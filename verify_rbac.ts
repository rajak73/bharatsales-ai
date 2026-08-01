import { RBAC, Resource, Action, Role } from './packages/permissions/src/index';

console.log('--- API AUTHORIZATION VERIFICATION ---');

const testCases = [
  { role: 'Organization Admin' as Role, action: Action.Read, resource: Resource.Inventory },
  { role: 'Organization Admin' as Role, action: Action.Read, resource: Resource.Collections },
  { role: 'Sales Manager' as Role, action: Action.Read, resource: Resource.Returns },
  { role: 'Sales Representative' as Role, action: Action.Create, resource: Resource.Expenses },
  { role: 'Organization Admin' as Role, action: Action.Read, resource: Resource.Users },
  { role: 'Distributor' as Role, action: Action.Read, resource: Resource.Inventory },
];

testCases.forEach(tc => {
  const result = RBAC.can(tc.role, tc.action, tc.resource);
  console.log(`[${result ? 'ALLOW' : 'DENY'}] Role: ${tc.role.padEnd(20)} | Action: ${tc.action.padEnd(6)} | Resource: ${tc.resource}`);
});
