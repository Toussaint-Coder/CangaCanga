import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { queryKeys } from "@/lib/queryClient";
import { useAuthStore } from "@/stores/authStore";
import {
  getProfile,
  getProfileStats,
  updateProfile,
  type UpdateProfileInput,
} from "./profile.service";

export function useProfile(id?: string) {
  return useQuery({
    queryKey: queryKeys.profile(id ?? ""),
    queryFn: () => getProfile(id!),
    enabled: !!id,
  });
}

export function useProfileStats(id?: string) {
  return useQuery({
    queryKey: ["profile-stats", id],
    queryFn: () => getProfileStats(id!),
    enabled: !!id,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const userId = useAuthStore((s) => s.session?.user.id);

  return useMutation({
    mutationFn: (input: UpdateProfileInput) => {
      if (!userId) throw new Error("Not authenticated");
      return updateProfile(userId, input);
    },
    onSuccess: async (profile) => {
      qc.setQueryData(queryKeys.profile(profile.id), profile);
      await refreshProfile();
    },
  });
}
