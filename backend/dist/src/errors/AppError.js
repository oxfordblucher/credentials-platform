export class AppError extends Error {
    statusCode;
    log;
    constructor(statusCode, message, log) {
        super(message);
        this.statusCode = statusCode;
        this.log = log;
    }
}
export class AuthError extends AppError {
    constructor(log) {
        super(401, "Unauthorized", log);
        this.name = "AuthError";
    }
}
export class PermissionError extends AppError {
    constructor(log) {
        super(403, "Insufficient permissions", log);
        this.name = "PermissionError";
    }
}
export class NotFoundError extends AppError {
    constructor(log) {
        super(404, "The requested resource was not found.", log);
        this.name = "MissingError";
    }
}
