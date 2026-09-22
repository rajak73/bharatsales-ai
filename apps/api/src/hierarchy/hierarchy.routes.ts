import { Router } from 'express';
import { z } from 'zod';
import { Resource, Action } from '@bharatsales/permissions';
import { authenticate, requirePermission } from '../core/auth.middleware';
import { audit } from '../core/audit.middleware';
import { route, validateBody } from '../core/http';
import type { HierarchyService } from './hierarchy.service';
import type { AuditService } from '../audit/audit.service';

const optId = z.string().nullish().transform((v) => v || undefined);
// On update, an explicit null (or '') clears the field — moves the node to
// the root / removes its manager — as the old controller's raw $set did;
// an absent key leaves the field unchanged.
const clearableId = z
  .string()
  .nullable()
  .optional()
  .transform((v) => (v === '' ? null : v));

// organizationId/_id/timestamps are stripped; only the node's own fields.
const createNodeSchema = z.object({
  name: z.string().min(1),
  level: z.enum(['Zone', 'Region', 'Area', 'Territory']),
  parentId: optId,
  managerId: optId,
  status: z.enum(['Active', 'Inactive']).optional(),
});

const updateNodeSchema = z.object({
  name: z.string().min(1).optional(),
  level: z.enum(['Zone', 'Region', 'Area', 'Territory']).optional(),
  parentId: clearableId,
  managerId: clearableId,
  status: z.enum(['Active', 'Inactive']).optional(),
}).transform((body) => {
  // Drop keys that were absent so $set leaves them alone.
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(body)) if (v !== undefined) out[k] = v;
  return out;
});

export function createHierarchyRouter(deps: { hierarchyService: HierarchyService; auditService: AuditService }): Router {
  const { hierarchyService, auditService } = deps;
  const router = Router();
  // @AuditEntity('HierarchyNode') was on every mutating route; audit() only
  // logs POST/PUT/PATCH/DELETE, so a router-level mount is equivalent.
  router.use(authenticate, audit(auditService, 'HierarchyNode'));

  router.get('/', requirePermission(Resource.Hierarchy, Action.Read),
    route((req) => hierarchyService.findAllByOrgId(req.user.orgId)));

  router.post('/', requirePermission(Resource.Hierarchy, Action.Create), validateBody(createNodeSchema),
    route((req) => hierarchyService.createNode(req.user.orgId, req.body)));

  router.put('/:id', requirePermission(Resource.Hierarchy, Action.Update), validateBody(updateNodeSchema),
    route((req) => hierarchyService.updateNode(req.user.orgId, req.params.id, req.body)));

  router.delete('/:id', requirePermission(Resource.Hierarchy, Action.Delete),
    route((req) => hierarchyService.deleteNode(req.user.orgId, req.params.id)));

  return router;
}
