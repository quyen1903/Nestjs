import { apiConfig } from "@/api/config";
import type { ApiEnvelope } from "@/types/domain";

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  token?: string;
  headers?: HeadersInit;
};

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${apiConfig.baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  const text = await response.text();
  const payload = text ? safeJson<ApiEnvelope<T> & { error?: string; statusCode?: number; code?: string }>(text) : null;

  if (!response.ok) {
    const message =
      (Array.isArray(payload?.message) ? payload.message.join(", ") : payload?.message) ??
      payload?.error ??
      response.statusText;
    throw new ApiError(message, response.status, payload?.code);
  }

  if (!payload || typeof payload !== "object") {
    return payload as T;
  }
  if ("metadata" in payload) {
    return payload.metadata as T;
  }
  if ("data" in payload) {
    return payload.data as T;
  }
  return payload as T;
}

function safeJson<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}
