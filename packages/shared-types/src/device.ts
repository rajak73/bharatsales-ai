export interface Device {
  id: string;
  organizationId: string;
  user: string;
  model: string;
  os: string;
  appVersion: string;
  lastSync: string;
  trusted: boolean;
}

export interface Session {
  id: string;
  organizationId: string;
  user: string;
  device: string;
  ip: string;
  loginTime: string;
  lastActive: string;
  status: string;
}
