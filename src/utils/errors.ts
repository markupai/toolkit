export class AcrolinxError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AcrolinxError';
    // This is needed to make instanceof work correctly
    Object.setPrototypeOf(this, AcrolinxError.prototype);
  }

  static fromResponse(response: Response, errorData: Record<string, unknown>): AcrolinxError {
    const detail = typeof errorData.detail === 'string' ? errorData.detail : undefined;
    const message = typeof errorData.message === 'string' ? errorData.message : undefined;
    const errorMessage = detail || message || `HTTP error! status: ${response.status}`;
    return new AcrolinxError(errorMessage, response.status, errorData);
  }
}
