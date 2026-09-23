// Express replacements for the NestJS HTTP exceptions this codebase used.
// Class names, constructor signatures and the JSON error body
// ({ statusCode, message, error }) are kept identical so services can keep
// throwing the same exceptions and every client (web, field-pwa, mobile)
// keeps receiving exactly the error shape it already parses.

export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  PAYMENT_REQUIRED = 402,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  GONE = 410,
  PAYLOAD_TOO_LARGE = 413,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

const DEFAULT_ERROR_NAMES: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  402: 'Payment Required',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  410: 'Gone',
  413: 'Payload Too Large',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  503: 'Service Unavailable',
};

export class HttpException extends Error {
  readonly status: number;
  readonly response: string | Record<string, any>;

  constructor(response: string | Record<string, any>, status: number) {
    super(typeof response === 'string' ? response : (response?.message ?? DEFAULT_ERROR_NAMES[status] ?? 'Error'));
    this.status = status;
    this.response = response;
    this.name = new.target.name;
  }

  getStatus(): number {
    return this.status;
  }

  getResponse(): string | Record<string, any> {
    return this.response;
  }

  // The body Nest used to send: an object response is sent as-is, a string
  // message is wrapped as { statusCode, message, error }.
  toJSON(): Record<string, any> {
    if (this.response && typeof this.response === 'object') {
      return { statusCode: this.status, ...this.response };
    }
    return {
      statusCode: this.status,
      message: this.response,
      error: DEFAULT_ERROR_NAMES[this.status] ?? 'Error',
    };
  }
}

function makeException(status: number) {
  return class extends HttpException {
    constructor(message?: string | Record<string, any> | string[]) {
      if (message === undefined) {
        super({ message: DEFAULT_ERROR_NAMES[status], statusCode: status }, status);
      } else if (typeof message === 'string') {
        super(message, status);
      } else if (Array.isArray(message)) {
        super({ message, error: DEFAULT_ERROR_NAMES[status] }, status);
      } else {
        super(message, status);
      }
    }
  };
}

export class BadRequestException extends makeException(400) {}
export class UnauthorizedException extends makeException(401) {}
export class ForbiddenException extends makeException(403) {}
export class NotFoundException extends makeException(404) {}
export class ConflictException extends makeException(409) {}
export class GoneException extends makeException(410) {}
export class PayloadTooLargeException extends makeException(413) {}
export class UnprocessableEntityException extends makeException(422) {}
export class InternalServerErrorException extends makeException(500) {}
export class ServiceUnavailableException extends makeException(503) {}
