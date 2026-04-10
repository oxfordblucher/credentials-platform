export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}

export class TokenReuseError extends AppError {
  constructor() {
    super(401, "Unauthorized");
    this.name = 'Token Reuse'
  }
}

export class TokenMissingError extends AppError {
  constructor() {
    super(401, "Unauthorized");
    this.name = 'Missing Token';
  }
}

export class UserMissingError extends AppError {
  constructor() {
    super(401, "Unauthorized");
    this.name = 'Missing User';
  }
}

export class UserAuthError extends AppError {
  constructor() {
    super(401, "Unauthorized");
    this.name = 'Invalid credentials';
  }
}

export class PermissionError extends AppError {
  constructor() {
    super(403, "Insufficient permissions");
  }
}