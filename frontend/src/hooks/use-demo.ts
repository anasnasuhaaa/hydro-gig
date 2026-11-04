"use client";
import { useQuery } from "@tanstack/react-query";
import { demoApi } from "@/lib/api/demo";

export function useDemoData() {
  const manifest = useQuery({
    queryKey: ["demo-manifest"],
    queryFn: ({ signal }) => demoApi.manifest(signal),
  });
  const network = useQuery({
    queryKey: ["demo-network"],
    queryFn: ({ signal }) => demoApi.network(signal),
  });
  const scenarios = useQuery({
    queryKey: ["demo-scenarios"],
    queryFn: ({ signal }) => demoApi.scenarios(signal),
  });
  return { manifest, network, scenarios };
}
