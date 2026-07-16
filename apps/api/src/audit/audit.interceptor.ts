import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';
import { AUDIT_LOG_KEY } from './audit.decorator';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector, private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const entityName = this.reflector.get<string>(AUDIT_LOG_KEY, context.getHandler()) || 
                       this.reflector.get<string>(AUDIT_LOG_KEY, context.getClass());

    if (!entityName) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // Only log mutations
    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return next.handle().pipe(
        tap((response) => {
          const user = request.user;
          if (user) {
            const ipAddress = request.ip || request.connection?.remoteAddress;
            const deviceInfo = request.headers['user-agent'];
            const reason = request.headers['x-audit-reason'] || request.body?.reason;

            this.auditService.logAction({
              organizationId: user.orgId,
              actorId: user.sub || user.id,
              actorRole: user.role,
              action: method,
              entityName: entityName,
              entityId: response?.id || response?._id?.toString(),
              details: { body: request.body, params: request.params },
              ipAddress,
              deviceInfo,
              reason,
            }).catch(err => console.error('Audit Log Error:', err));
          }
        })
      );
    }

    return next.handle();
  }
}
