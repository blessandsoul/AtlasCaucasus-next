/**
 * CSRF Token Management
 *
 * Handles fetching and storing CSRF tokens for state-changing requests.
 * The server requires X-CSRF-Token header for POST, PUT, PATCH, DELETE requests.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

let csrfToken: string | null = null;
let csrfTokenPromise: Promise<string> | null = null;

/**
 * Fetches a new CSRF token from the server.
 * Uses a singleton promise to prevent multiple simultaneous fetches.
 */
export async function fetchCsrfToken(): Promise<string> {
  // If a fetch is already in progress, return the existing promise
  if (csrfTokenPromise) {
    return csrfTokenPromise;
  }

  csrfTokenPromise = (async (): Promise<string> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/csrf-token`, {
        method: 'GET',
        credentials: 'include', // Important: include cookies for CSRF
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch CSRF token: ${response.status}`);
      }

      const data = await response.json();
      csrfToken = data.data.csrfToken;
      return csrfToken as string;
    } finally {
      csrfTokenPromise = null;
    }
  })();

  return csrfTokenPromise;
}

/**
 * Returns the currently stored CSRF token (may be null if not yet fetched).
 */
export function getCsrfToken(): string | null {
  return csrfToken;
}

/**
 * Clears the stored CSRF token.
 * Call this on logout or when token is invalidated.
 */
export function clearCsrfToken(): void {
  csrfToken = null;
}

/**
 * Ensures a CSRF token is available, fetching one if necessary.
 * Use this before making state-changing requests.
 */
export async function ensureCsrfToken(): Promise<string> {
  if (csrfToken !== null) {
    return csrfToken;
  }
  return fetchCsrfToken();
}
