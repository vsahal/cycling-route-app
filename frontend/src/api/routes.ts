import type { RouteFormData, RouteResponse } from "../types.ts";

export async function generateRoute(data: RouteFormData): Promise<RouteResponse> {
  const response = await fetch("/api/generate-route", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || "Failed to generate route");
  }

  return response.json();
}
