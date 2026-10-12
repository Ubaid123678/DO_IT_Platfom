export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export const createErrorResponse = (
  code: string,
  message: string,
  details?: unknown,
): ApiErrorResponse => ({
  success: false,
  error: {
    code,
    message,
    ...(details !== undefined ? { details } : {}),
  },
});
