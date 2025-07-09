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

export interface Config {
  platform?: string | Environment;
  apiKey: string;
}

export interface ApiConfig extends Config {
  endpoint: string;
}
