export interface Beat {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  // Populated Outlet objects when fetched via GET /beats (populate('outlets')),
  // otherwise raw ids on create/update payloads.
  outlets: string[] | { id: string; name: string }[];
  sequence: { outletId: string; sequenceOrder: number }[];
  status: 'Active' | 'Draft' | 'Archived';
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface BeatSchedule {
  id: string;
  user: string;
  beat: Beat | string;
  organizationId: string;
  date: string;
}
