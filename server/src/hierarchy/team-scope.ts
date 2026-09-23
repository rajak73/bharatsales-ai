import type { HierarchyService } from './hierarchy.service';

/**
 * User ids whose location / route data `user` may see, or undefined for
 * "everyone in the org" (Organization Admin / Super Admin). Anyone else
 * (in practice a Sales Manager, the other LiveMap:Read holder) is limited to
 * their own reporting team, as attendance regularizations already are.
 */
export async function visibleTeamUserIds(
  hierarchyService: Pick<HierarchyService, 'getTeamUserIds'> | undefined,
  user: { sub: string; orgId: string; role: string },
): Promise<string[] | undefined> {
  if (['Super Admin', 'Organization Admin'].includes(user.role)) return undefined;
  if (!hierarchyService) return [];
  const ids = await hierarchyService.getTeamUserIds(user.orgId, user.sub);
  return ids.map(String);
}
