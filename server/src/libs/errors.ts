export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(code: string, message: string, statusCode: number) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Placeholder error subclasses - to be fully implemented later
export class BadRequestError extends AppError {
  constructor(message: string, code = "BAD_REQUEST") {
    super(code, message, 400);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, code = "VALIDATION_ERROR") {
    super(code, message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string, code = "UNAUTHORIZED") {
    super(code, message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string, code = "FORBIDDEN") {
    super(code, message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, code = "NOT_FOUND") {
    super(code, message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code = "CONFLICT") {
    super(code, message, 409);
  }
}

export class InternalError extends AppError {
  constructor(message: string, code = "INTERNAL_ERROR") {
    super(code, message, 500);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string, code = "RATE_LIMIT_EXCEEDED") {
    super(code, message, 429);
  }
}
