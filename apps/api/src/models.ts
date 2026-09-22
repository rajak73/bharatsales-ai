import type { Connection, Model, Schema } from 'mongoose';
import {
  AppNotificationSchema,
  ApprovalRuleSchema,
  ApprovalSchema,
  AttendanceSessionSchema,
  AuditLogSchema,
  BeatScheduleSchema,
  BeatSchema,
  ClaimSchema,
  CollectionSchema,
  DispatchSchema,
  DistributorSchema,
  ExpenseSchema,
  HierarchyNodeSchema,
  IncentivePayoutSchema,
  IncentivePlanSchema,
  IntegrationSchema,
  InventorySchema,
  InvoiceSchema,
  LocationPingSchema,
  NotificationLogSchema,
  OrderSchema,
  OutletSchema,
  PlatformSettingsSchema,
  PriceListSchema,
  ProductSchema,
  ReportJobSchema,
  ReturnSchema,
  ScheduledReportSchema,
  SchemeSchema,
  SessionSchema,
  SupportTicketSchema,
  TargetSchema,
  TaxRateSchema,
  TenantSchema,
  TokenSchema,
  UserSchema,
  VisitSchema,
  WarehouseSchema,
} from './schemas';
import { OnboardingStateSchema } from './schemas/onboarding-state.schema';

/**
 * Model name -> schema. Names are exactly the ones the Nest modules registered
 * via MongooseModule.forFeature / injected via @InjectModel (including the
 * `X.name` forms, which resolve to the class name, e.g. ReturnOrder).
 * Collection names are unchanged: schemas with an explicit `collection`
 * option keep it; the rest are pluralised from the model name by Mongoose,
 * exactly as before.
 */
const SCHEMAS = {
  AppNotification: AppNotificationSchema,
  Approval: ApprovalSchema,
  ApprovalRule: ApprovalRuleSchema,
  AttendanceSession: AttendanceSessionSchema,
  AuditLog: AuditLogSchema,
  Beat: BeatSchema,
  BeatSchedule: BeatScheduleSchema,
  Claim: ClaimSchema,
  Collection: CollectionSchema,
  Dispatch: DispatchSchema,
  Distributor: DistributorSchema,
  Expense: ExpenseSchema,
  HierarchyNode: HierarchyNodeSchema,
  IncentivePayout: IncentivePayoutSchema,
  IncentivePlan: IncentivePlanSchema,
  Integration: IntegrationSchema,
  Inventory: InventorySchema,
  Invoice: InvoiceSchema,
  LocationPing: LocationPingSchema,
  NotificationLog: NotificationLogSchema,
  OnboardingState: OnboardingStateSchema,
  Order: OrderSchema,
  Outlet: OutletSchema,
  PlatformSettings: PlatformSettingsSchema,
  PriceList: PriceListSchema,
  Product: ProductSchema,
  ReportJob: ReportJobSchema,
  ReturnOrder: ReturnSchema,
  ScheduledReport: ScheduledReportSchema,
  Scheme: SchemeSchema,
  Session: SessionSchema,
  SupportTicket: SupportTicketSchema,
  Target: TargetSchema,
  TaxRate: TaxRateSchema,
  Tenant: TenantSchema,
  Token: TokenSchema,
  User: UserSchema,
  Visit: VisitSchema,
  Warehouse: WarehouseSchema,
} satisfies Record<string, Schema>;

export type ModelName = keyof typeof SCHEMAS;

/**
 * Services historically typed the same model differently (Model<Order>,
 * Model<OrderDocument>, Model<any>), so models are exposed as Model<any>
 * to stay assignable to every existing constructor parameter type.
 */
export type Models = { [K in ModelName]: Model<any> };

export const MODEL_NAMES = Object.keys(SCHEMAS) as ModelName[];

export function registerModels(conn: Connection): Models {
  const models = {} as Models;
  for (const name of MODEL_NAMES) {
    // Reuse an already-compiled model (e.g. when tests call this twice on the
    // same connection) instead of throwing OverwriteModelError.
    models[name] = conn.models[name] ?? conn.model(name, SCHEMAS[name]);
  }
  return models;
}
