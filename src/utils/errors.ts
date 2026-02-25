/**
 * Custom Error Hierarchy for WellNexus
 * Provides typed, structured error handling across the application.
 */

export type ErrorCode =
  | 'NETWORK_ERROR'
  | 'AUTH_ERROR'
  | 'PAYMENT_ERROR'
  | 'VALIDATION_ERROR'
  | 'SERVICE_ERROR'
  | 'AGENT_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'TIMEOUT_ERROR'
  | 'NOT_FOUND'
  | 'UNKNOWN_ERROR';

/**
 * Base application error with structured metadata.
 * All custom errors extend this class.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  /** Operational errors are expected (e.g. validation); non-operational are bugs */
  readonly isOperational: boolean;
  readonly context?: Record<string, unknown>;
  readonly timestamp: string;

  constructor(
    message: string,
    code: ErrorCode = 'UNKNOWN_ERROR',
    statusCode = 500,
    isOperational = true,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    this.timestamp = new Date().toISOString();
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Network/connectivity failures (Supabase, fetch, external APIs) */
export class NetworkError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'NETWORK_ERROR', 503, true, context);
  }
}

/** Authentication/authorization failures */
export class AuthError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'AUTH_ERROR', 401, true, context);
  }
}

/** Payment processing failures (PayOS, wallet operations) */
export class PaymentError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'PAYMENT_ERROR', 402, true, context);
  }
}

/** Input validation failures */
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, true, context);
  }
}

/** Service-level failures (business logic errors) */
export class ServiceError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'SERVICE_ERROR', 500, true, context);
  }
}

/** Agent execution failures */
export class AgentError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'AGENT_ERROR', 500, true, context);
  }
}

// ─── Helpers ──────────────────────────────────────────────────

/** Type guard: check if error is an AppError */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/** Extract a safe error message from any thrown value */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unknown error occurred';
}

/** Wrap any thrown value into an AppError */
export function toAppError(error: unknown, fallbackCode: ErrorCode = 'UNKNOWN_ERROR'): AppError {
  if (error instanceof AppError) return error;
  const message = getErrorMessage(error);
  return new AppError(message, fallbackCode);
}

/**
 * Classify a Supabase error into the appropriate AppError subclass.
 * Inspects error message/code to determine the right type.
 */
export function fromSupabaseError(
  error: { message: string; code?: string; status?: number },
  context?: Record<string, unknown>
): AppError {
  const msg = error.message.toLowerCase();
  const code = error.code || '';

  if (code === 'PGRST301' || msg.includes('jwt') || msg.includes('auth') || msg.includes('unauthorized')) {
    return new AuthError(error.message, context);
  }
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('timeout') || msg.includes('econnrefused')) {
    return new NetworkError(error.message, context);
  }
  if (msg.includes('payment') || msg.includes('payos') || msg.includes('transaction')) {
    return new PaymentError(error.message, context);
  }
  if (msg.includes('validation') || msg.includes('invalid') || msg.includes('required')) {
    return new ValidationError(error.message, context);
  }
  return new ServiceError(error.message, context);
}
