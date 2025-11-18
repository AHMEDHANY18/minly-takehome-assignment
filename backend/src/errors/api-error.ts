export class ApiError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string): ApiError {
    return new ApiError(message, 400);
  }

  static unauthorized(message: string): ApiError {
    return new ApiError(message, 401);
  }

  static forbidden(message: string): ApiError {
    return new ApiError(message, 403);
  }

  static notFound(message: string): ApiError {
    return new ApiError(message, 404);
  }

  static conflict(message: string): ApiError {
    return new ApiError(message, 409);
  }

  static internal(message: string): ApiError {
    return new ApiError(message, 500);
  }
}
