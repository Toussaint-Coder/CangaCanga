import { useEffect, useState } from "react";
import { Redirect } from "expo-router";

import { getNextSetupStep, setupHref } from "@/features/setup/setup";
import { useAuthStore } from "@/stores/authStore";

export default function Index() {
  const status = useAuthStore((s) => s.status);
  const [setupHrefPath, setSetupHrefPath] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void getNextSetupStep().then((step) => {
      setSetupHrefPath(setupHref(step));
      setReady(true);
    });
  }, []);

  if (status === "loading" || !ready || !setupHrefPath) {
    return null;
  }

  if (status === "authenticated") {
    return <Redirect href="/(tabs)" />;
  }

  // Incomplete first-launch flow (onboarding → permissions → language).
  if (setupHrefPath !== "/(auth)/login") {
    return <Redirect href={setupHrefPath as "/(auth)/onboarding"} />;
  }

  return <Redirect href="/(auth)/login" />;
}
