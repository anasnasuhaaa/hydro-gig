"use client";

import { useQuery } from "@tanstack/react-query";
import { getSystemStatus } from "@/lib/api/client";

export function useSystemStatus() {
  return useQuery({
    queryKey: ["system", "status"],
    queryFn: ({ signal }) => getSystemStatus(signal),
    refetchInterval: 60_000,
  });
}
