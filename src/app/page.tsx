"use client";

import {useSession} from "next-auth/react";
import HomeApp from "@/components/HomeApp";
import LandingPage from "@/components/LandingPage";

export default function Home() {
  const {status} = useSession();

  if (status === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-paper">
        <p className="text-sm text-muted">Ładowanie…</p>
      </div>
    );
  }

  if (status === "authenticated") {
    return <HomeApp />;
  }

  return <LandingPage />;
}
