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

export interface Config {
  platformUrl?: string;
  apiKey: string;
}

export interface ApiConfig extends Config {
  endpoint: string;
}
