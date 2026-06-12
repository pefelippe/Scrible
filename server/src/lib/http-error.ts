// Application error carrying an HTTP status code, thrown by services and
// routes and translated to a JSON response by the error-handler middleware.
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}
