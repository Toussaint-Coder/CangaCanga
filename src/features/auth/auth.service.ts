import { supabase } from "@/services/supabase";
import { uploadProfilePicture } from "@/services/r2";
import { normalizePhone, phoneToAuthEmail } from "@/utils/phone";
import i18n from "@/i18n";
import type { Profile } from "@/types/models";

/**
 * Auth service.
 *
 * We use Supabase Auth (which hashes passwords with bcrypt and issues JWTs).
 * Because the product requires phone + password with NO email and NO OTP, we
 * map each phone number to a deterministic pseudo-email. This needs "Confirm
 * email" turned OFF in the Supabase Auth settings (see README).
 */

export interface RegisterInput {
  fullName: string;
  phoneNumber: string;
  password: string;
  profilePictureUri: string; // local file:// uri (required)
  vehiclePlateNumber?: string;
}

export interface LoginInput {
  phoneNumber: string;
  password: string;
}

export async function register(input: RegisterInput): Promise<Profile> {
  const phone = normalizePhone(input.phoneNumber);
  const email = phoneToAuthEmail(phone);

  // 1. Create the auth user (session established immediately when email
  //    confirmation is disabled).
  const { data: signUp, error: signUpError } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: { data: { full_name: input.fullName, phone_number: phone } },
  });

  if (signUpError) {
    if (signUpError.message.toLowerCase().includes("already")) {
      throw new Error(i18n.t("auth.accountExists"));
    }
    throw signUpError;
  }

  const user = signUp.user;
  if (!user) {
    throw new Error(i18n.t("auth.registrationFailed"));
  }

  // 2. Upload the (required) profile picture to R2.
  let pictureUrl: string | null = null;
  try {
    pictureUrl = await uploadProfilePicture(input.profilePictureUri, user.id);
  } catch (err) {
    // Non-fatal: the account exists; the user can add a photo later.
    if (__DEV__) console.warn("[auth] profile picture upload failed", err);
  }

  // 3. Create the profile row.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      full_name: input.fullName.trim(),
      phone_number: phone,
      profile_picture: pictureUrl,
      vehicle_plate_number: input.vehiclePlateNumber?.trim() || null,
    })
    .select("*")
    .single();

  if (profileError) throw profileError;
  return profile;
}

export async function login(input: LoginInput): Promise<void> {
  const email = phoneToAuthEmail(input.phoneNumber);
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: input.password,
  });
  if (error) {
    throw new Error(i18n.t("auth.invalidCredentials"));
  }
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function fetchMyProfile(): Promise<Profile | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", auth.user.id)
    .single();

  if (error) return null;
  return data;
}
