import { supabase } from "@/services/supabase";
import type { Review } from "@/types/models";

export interface CreateReviewInput {
  receiverId: string;
  rideId?: string;
  rating: number; // 1..5
  comment?: string;
}

export async function createReview(
  input: CreateReviewInput,
): Promise<Review> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("You must be signed in to leave a review.");

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      author_id: auth.user.id,
      receiver_id: input.receiverId,
      ride_id: input.rideId ?? null,
      rating: input.rating,
      comment: input.comment?.trim() || null,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("You already reviewed this trip.");
    }
    throw error;
  }
  return data;
}

export async function getReviewsForUser(userId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("receiver_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data ?? [];
}
