/**
 * TSR APP v1.0 — Middlewares & Gestion Centralisée des Erreurs
 */
import { ValidationError } from '../validators';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    field?: string;
  };
}

export function handleApiCall<T>(fn: () => T): ApiResponse<T> {
  try {
    const data = fn();
    return {
      success: true,
      data,
    };
  } catch (err: unknown) {
    if (err instanceof ValidationError) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: err.message,
          field: err.field,
        },
      };
    }
    const message = err instanceof Error ? err.message : 'Une erreur inattendue est survenue.';
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message,
      },
    };
  }
}
