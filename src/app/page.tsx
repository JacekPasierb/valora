"use client";

import {useSession} from "next-auth/react";
import HomeApp from "@/components/HomeApp";
import LandingPage from "@/components/LandingPage";
import {SessionSkeleton} from "@/components/skeletons";

export default function Home() {
  const {status} = useSession();

  if (status === "loading") {
    return <SessionSkeleton />;
  }

  if (status === "authenticated") {
    return <HomeApp />;
  }

  return <LandingPage />;
}
