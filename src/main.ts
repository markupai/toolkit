export interface RewriteRequest {
  content: string;
}

export class Endpoint {

  constructor() {}

  rewriteContent(rewriteRequest: RewriteRequest) {
    console.log(rewriteRequest);
  }
}