export interface ResponseBase {
  workflow_id: string;
  status: Status;
}

export type StyleAnalysisPollResp = ResponseBase;

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

export enum PlatformType {
  Environment = 'environment',
  Url = 'url',
}

// Discriminated union for platform configuration
export type PlatformConfig =
  | { type: PlatformType.Environment; value: Environment }
  | { type: PlatformType.Url; value: string };

export interface Config {
  platform?: PlatformConfig;
  apiKey: string;
}
