import { QueryClient } from "@tanstack/react-query";

/**
 * React Query client tuned for a mobile app on potentially slow networks:
 * generous stale times, limited retries, and no refetch storms on focus.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      gcTime: 1000 * 60 * 10,
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

/** Centralised query keys keep cache invalidation predictable. */
export const queryKeys = {
  me: ["me"] as const,
  profile: (id: string) => ["profile", id] as const,
  rides: {
    all: ["rides"] as const,
    nearby: (lat?: number, lng?: number) => ["rides", "nearby", lat, lng] as const,
    list: (filters?: unknown) => ["rides", "list", filters] as const,
    detail: (id: string) => ["rides", "detail", id] as const,
    mine: ["rides", "mine"] as const,
  },
  reservations: {
    mine: ["reservations", "mine"] as const,
    forRide: (rideId: string) => ["reservations", "ride", rideId] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    unreadCount: ["notifications", "unread-count"] as const,
  },
  reviews: {
    forUser: (userId: string) => ["reviews", userId] as const,
  },
} as const;
