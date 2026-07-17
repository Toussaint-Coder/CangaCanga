import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { queryKeys } from "@/lib/queryClient";
import type { Coordinates } from "@/types/models";
import {
  cancelRide,
  createRide,
  getMyRidesAsDriver,
  getNearbyRides,
  getRide,
  listRides,
  type CreateRideInput,
  type RideFilters,
} from "./rides.service";

export function useNearbyRides(location?: Coordinates, radiusMeters?: number) {
  return useQuery({
    queryKey: queryKeys.rides.nearby(location?.latitude, location?.longitude),
    queryFn: () => getNearbyRides(location!, radiusMeters),
    enabled: !!location,
  });
}

export function useRides(filters: RideFilters = {}) {
  return useQuery({
    queryKey: queryKeys.rides.list(filters),
    queryFn: () => listRides(filters),
  });
}

export function useRide(id?: string) {
  return useQuery({
    queryKey: queryKeys.rides.detail(id ?? ""),
    queryFn: () => getRide(id!),
    enabled: !!id,
  });
}

export function useMyRides() {
  return useQuery({
    queryKey: queryKeys.rides.mine,
    queryFn: getMyRidesAsDriver,
  });
}

export function useCreateRide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRideInput) => createRide(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.rides.all });
    },
  });
}

export function useCancelRide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rideId: string) => cancelRide(rideId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.rides.all });
    },
  });
}
