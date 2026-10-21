export function getStoredToken(): string | null {
  // Tokens are stored strictly in server-managed HttpOnly cookies
  return null;
}

export function setStoredToken(_token: string): void {
  // No-op: Tokens are managed strictly via HttpOnly cookies
}

export function removeStoredToken(): void {
  // No-op: Logout endpoint clears cookies
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});

  // Set default JSON Content-Type only if not sending FormData
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    credentials: "include", // Transmit HttpOnly cookies automatically
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `Request failed (${response.status})`;
    try {
      const errorData = await response.json();
      if (typeof errorData.detail === "string") {
        errorMessage = errorData.detail;
      } else if (Array.isArray(errorData.detail) && errorData.detail.length > 0) {
        errorMessage = errorData.detail.map((d: { msg: string }) => d.msg).join(", ");
      }
    } catch {
      // Fallback to HTTP status text
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json();
}
