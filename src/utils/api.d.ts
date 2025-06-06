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
