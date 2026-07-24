/**
 * API client. While the backend (Phase 2+) is unbuilt, requests are served by the
 * in-memory mock adapter. Flip VITE_USE_MOCK=false (or set VITE_API_BASE) once the
 * Go service is live — screens and hooks call `api.get/post` and never change.
 */
import { mockResolve } from "./mock";

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";
const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export interface RequestOptions {
  signal?: AbortSignal;
}

async function request<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
  opts?: RequestOptions
): Promise<T> {
  if (USE_MOCK) {
    return mockResolve<T>(method, path, body);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: opts?.signal,
    credentials: "include",
  });

  if (!res.ok) {
    throw new ApiError(res.status, await res.text().catch(() => res.statusText));
  }
  return (await res.json()) as T;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>("GET", path, undefined, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>("POST", path, body, opts),
};
