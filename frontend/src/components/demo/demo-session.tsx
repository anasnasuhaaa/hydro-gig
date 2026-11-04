"use client";
import { createContext, useContext, useState } from "react";
import type { ScreenRequest } from "@/lib/contracts/data";

type Session = {
  routeChoice: "default" | "screened";
  setRouteChoice: (choice: "default" | "screened") => void;
  request: ScreenRequest | null;
  screenedTrip: ScreenRequest | null;
  setRequest: (request: ScreenRequest) => void;
  rememberTrip: (request: ScreenRequest) => void;
};
const DemoSession = createContext<Session | null>(null);
export function DemoSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [routeChoice, setRouteChoice] = useState<"default" | "screened">(
    "default",
  );
  const [request, setRequest] = useState<ScreenRequest | null>(null);
  const [screenedTrip, setScreenedTrip] = useState<ScreenRequest | null>(null);
  return (
    <DemoSession.Provider
      value={{
        routeChoice,
        setRouteChoice,
        request,
        screenedTrip,
        setRequest,
        rememberTrip: (request) => {
          setRouteChoice("screened");
          setScreenedTrip(request);
          setRequest(request);
        },
      }}
    >
      {children}
    </DemoSession.Provider>
  );
}
export function useDemoSession() {
  const session = useContext(DemoSession);
  if (!session) throw new Error("Demo session provider is required");
  return session;
}
