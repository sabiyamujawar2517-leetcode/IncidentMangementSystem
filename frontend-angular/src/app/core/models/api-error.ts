import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/** Normalized error produced by apiErrorInterceptor for every failed API call. */
export interface ApiError {
  readonly kind: 'api-error';
  /** HTTP status; 0 when the API could not be reached. */
  readonly status: number;
  readonly title: string;
  readonly message: string;
  /** Field errors from a ValidationProblem response, keyed by camelCase field name (e.g. `title`, `reporterId`). */
  readonly fieldErrors: Readonly<Record<string, readonly string[]>>;
}

interface ProblemDetailsBody {
  title?: string;
  detail?: string;
  status?: number;
  errors?: Record<string, string[]>;
}

export function isApiError(value: unknown): value is ApiError {
  return typeof value === 'object' && value !== null && (value as { kind?: unknown }).kind === 'api-error';
}

export function toApiError(error: unknown): ApiError {
  if (isApiError(error)) return error;

  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return {
        kind: 'api-error',
        status: 0,
        title: 'API unreachable',
        message: `Cannot reach the API at ${environment.apiBaseUrl}. Check that it is running.`,
        fieldErrors: {},
      };
    }

    const body = isProblemDetails(error.error) ? error.error : null;
    const fieldErrors = body?.errors ?? {};
    const hasFieldErrors = Object.keys(fieldErrors).length > 0;

    return {
      kind: 'api-error',
      status: error.status,
      title: body?.title ?? defaultTitle(error.status),
      message: body?.detail ?? (hasFieldErrors ? 'Please correct the highlighted fields.' : defaultMessage(error.status)),
      fieldErrors,
    };
  }

  return {
    kind: 'api-error',
    status: -1,
    title: 'Unexpected error',
    message: error instanceof Error ? error.message : 'Something went wrong.',
    fieldErrors: {},
  };
}

/** Flattens all field errors into display strings, e.g. for a summary banner. */
export function allFieldMessages(error: ApiError): string[] {
  return Object.values(error.fieldErrors).flat();
}

function isProblemDetails(value: unknown): value is ProblemDetailsBody {
  return typeof value === 'object' && value !== null && ('title' in value || 'detail' in value || 'errors' in value);
}

function defaultTitle(status: number): string {
  switch (status) {
    case 400: return 'Invalid request';
    case 404: return 'Not found';
    case 409: return 'Conflict';
    default: return status >= 500 ? 'Server error' : 'Request failed';
  }
}

function defaultMessage(status: number): string {
  switch (status) {
    case 400: return 'The request was rejected by the API.';
    case 404: return 'The requested item does not exist.';
    case 409: return 'The action conflicts with the current state of the incident.';
    default: return status >= 500 ? 'The API encountered an error. Try again later.' : `Request failed with status ${status}.`;
  }
}
