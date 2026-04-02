export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}

export class TokenReuseError extends AppError {
  constructor() {
    super(401, "Token reuse detected");
  }
}

export class TokenMissingError extends AppError {
  constructor() {
    super(401, "No token found");
  }
}