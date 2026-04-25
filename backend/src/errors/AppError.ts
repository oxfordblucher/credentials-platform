export class AppError extends Error {
  constructor(public statusCode: number, message: string, public log?: string) {
    super(message);
  }
}

export class AuthError extends AppError {
  constructor(log?: string) {
    super(401, "Unauthorized", log);
    this.name = "AuthError";
  }
}

export class PermissionError extends AppError {
  constructor(log?: string) {
    super(403, "Insufficient permissions", log);
    this.name = "PermissionError";
  }
}

export class NotFoundError extends AppError {
  constructor(log?: string) {
    super(404, "The requested resource was not found.", log);
    this.name = "MissingError";
  }
}

export class RateLimitError extends AppError {
  constructor(log?: string) {
    super(429, "An upload is already in progress. Please wait for the existing link to expire.", log);
    this.name = "RateLimitError";
  }
}