export interface Beat {
  id: string;
  organizationId: string;
  name: string;
  day: string;
  rep: string;
  outlets: number;
  assigned: number;
  visited: number;
  status: 'Published' | 'Draft' | 'Recovery';
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
