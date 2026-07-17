import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { queryKeys } from "@/lib/queryClient";
import {
  createReview,
  getReviewsForUser,
  type CreateReviewInput,
} from "./reviews.service";

export function useReviews(userId?: string) {
  return useQuery({
    queryKey: queryKeys.reviews.forUser(userId ?? ""),
    queryFn: () => getReviewsForUser(userId!),
    enabled: !!userId,
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReviewInput) => createReview(input),
    onSuccess: (_data, input) => {
      qc.invalidateQueries({
        queryKey: queryKeys.reviews.forUser(input.receiverId),
      });
      qc.invalidateQueries({ queryKey: queryKeys.profile(input.receiverId) });
    },
  });
}
