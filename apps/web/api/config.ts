import type { ApiMode } from "@/types/domain";

export const apiConfig = {
  baseUrl: (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3056/v1/api").replace(/\/$/, ""),
  mode: (process.env.NEXT_PUBLIC_API_MODE === "live" ? "live" : "mock") as ApiMode
};
