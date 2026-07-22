import { supabase } from "@/services/supabase";
import { uploadProfilePicture } from "@/services/r2";
import { normalizePhone, phoneToAuthEmail } from "@/utils/phone";
import i18n from "@/i18n";
import type { Profile } from "@/types/models";

export async function getProfile(id: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

export interface UpdateProfileInput {
  fullName?: string;
  phoneNumber?: string;
  vehiclePlateNumber?: string | null;
  profilePictureUri?: string; // new local image to upload
}

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<Profile> {
  const patch: {
    full_name?: string;
    phone_number?: string;
    vehicle_plate_number?: string | null;
    profile_picture?: string;
  } = {};

  if (input.fullName !== undefined) patch.full_name = input.fullName.trim();
  if (input.phoneNumber !== undefined) {
    const phone = normalizePhone(input.phoneNumber);
    patch.phone_number = phone;
    // Keep Auth login identity in sync (phone → pseudo-email).
    const { error: authError } = await supabase.auth.updateUser({
      email: phoneToAuthEmail(phone),
      data: { phone_number: phone },
    });
    if (authError) throw authError;
  }
  if (input.vehiclePlateNumber !== undefined) {
    patch.vehicle_plate_number = input.vehiclePlateNumber?.trim() || null;
  }
  if (input.profilePictureUri) {
    patch.profile_picture = await uploadProfilePicture(
      input.profilePictureUri,
      userId,
    );
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", userId)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error(i18n.t("editProfile.phoneTaken"));
    }
    throw error;
  }
  return data;
}

export interface ProfileStats {
  totalTrips: number;
}

/** Total trips = rides driven + seats taken as a passenger (accepted). */
export async function getProfileStats(userId: string): Promise<ProfileStats> {
  const [{ count: driven }, { count: ridden }] = await Promise.all([
    supabase
      .from("rides")
      .select("id", { count: "exact", head: true })
      .eq("driver_id", userId),
    supabase
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .eq("passenger_id", userId)
      .eq("status", "accepted"),
  ]);

  return { totalTrips: (driven ?? 0) + (ridden ?? 0) };
}
