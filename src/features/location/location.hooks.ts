import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { useCurrentUserId } from "@/stores/authStore";
import { getCurrentLocation } from "./location.service";

export function useCurrentLocation() {
  const userId = useCurrentUserId();
  const query = useQuery({
    queryKey: ["location", "current", userId],
    queryFn: getCurrentLocation,
    staleTime: 1000 * 60 * 5,
  });

  // Keep profile last_location_at fresh while signed in (nearby-ride push).
  useEffect(() => {
    if (!userId) return;
    const id = setInterval(() => {
      void getCurrentLocation();
    }, 1000 * 60 * 10);
    return () => clearInterval(id);
  }, [userId]);

  return query;
}
