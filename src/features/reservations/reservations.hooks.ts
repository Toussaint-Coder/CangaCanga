import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { queryKeys } from "@/lib/queryClient";
import {
  cancelReservation,
  getMyReservations,
  getReservationsForRide,
  reserveSeat,
  respondToReservation,
} from "./reservations.service";

export function useMyReservations() {
  return useQuery({
    queryKey: queryKeys.reservations.mine,
    queryFn: getMyReservations,
  });
}

export function useRideReservations(rideId?: string) {
  return useQuery({
    queryKey: queryKeys.reservations.forRide(rideId ?? ""),
    queryFn: () => getReservationsForRide(rideId!),
    enabled: !!rideId,
  });
}

export function useReserveSeat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ rideId, seats }: { rideId: string; seats?: number }) =>
      reserveSeat(rideId, seats),
    onSuccess: (_data, { rideId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.reservations.mine });
      qc.invalidateQueries({ queryKey: queryKeys.rides.detail(rideId) });
    },
  });
}

export function useRespondToReservation(rideId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) =>
      respondToReservation(id, accept),
    onSuccess: () => {
      if (rideId) {
        qc.invalidateQueries({
          queryKey: queryKeys.reservations.forRide(rideId),
        });
        qc.invalidateQueries({ queryKey: queryKeys.rides.detail(rideId) });
      }
      qc.invalidateQueries({ queryKey: queryKeys.rides.mine });
    },
  });
}

export function useCancelReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelReservation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.reservations.mine });
    },
  });
}
