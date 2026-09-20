import { AppError } from "./AppError";
import { ErrorCode } from "./ErrorCode";

export function normalizeError(
  error: unknown,
  fallbackCode = ErrorCode.UNKNOWN_ERROR,
) {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(fallbackCode, error.message, error);
  }

  return new AppError(fallbackCode, "Unexpected error.", error);
}

export function getSafeErrorMessage(error: unknown) {
  const appError = normalizeError(error);

  if (appError.code === ErrorCode.VALIDATION_ERROR) {
    return appError.message;
  }

  return "حدث خطأ غير متوقع. حاول مرة أخرى.";
}
