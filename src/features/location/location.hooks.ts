import { useQuery } from "@tanstack/react-query";

import { getCurrentLocation } from "./location.service";

export function useCurrentLocation() {
  return useQuery({
    queryKey: ["location", "current"],
    queryFn: getCurrentLocation,
    staleTime: 1000 * 60 * 5,
  });
}
