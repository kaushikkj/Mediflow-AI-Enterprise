const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(message: string, status: number, detail?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

export function token(): string | null {
  return localStorage.getItem("token");
}

export function saveToken(accessToken: string): void {
  localStorage.setItem("token", accessToken);
}

export function removeToken(): void {
  localStorage.removeItem("token");
}

function notifyUnauthorized(): void {
  window.dispatchEvent(new CustomEvent("mediflow:unauthorized"));
}

export async function request<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const accessToken = token();

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError("Unable to connect to the server", 0);
  }

  if (!response.ok) {
    let detail: unknown = null;
    let message = `Request failed with status ${response.status}`;

    try {
      detail = await response.json();

      if (typeof detail === "object" && detail !== null && "detail" in detail) {
        const responseDetail = (
          detail as {
            detail?: unknown;
          }
        ).detail;

        message =
          typeof responseDetail === "string"
            ? responseDetail
            : JSON.stringify(responseDetail);
      }
    } catch {
      const fallback = await response.text();

      if (fallback) {
        message = fallback;
      }
    }

    if (response.status === 401) {
      removeToken();
      notifyUnauthorized();
    }

    throw new ApiError(message, response.status, detail);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json() as Promise<T>;
  }

  return response.blob() as Promise<T>;
}

export { API };
