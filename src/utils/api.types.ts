export interface ResponseBase {
  workflow_id: string;
  status: Status;
}

export enum Status {
  Queued = 'queued',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
}

export enum Environment {
  Stage = 'stage',
  Dev = 'dev',
  Prod = 'prod',
}

// Discriminated union for platform configuration
export type PlatformConfig = { type: 'environment'; value: Environment } | { type: 'url'; value: string };

export interface Config {
  platform?: PlatformConfig;
  apiKey: string;
}

export interface ApiConfig extends Config {
  endpoint: string;
}
