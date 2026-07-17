import { useMutation } from "@tanstack/react-query";

import { useAuthStore } from "@/stores/authStore";
import {
  login,
  register,
  type LoginInput,
  type RegisterInput,
} from "./auth.service";

export function useRegister() {
  const setProfile = useAuthStore((s) => s.setProfile);
  return useMutation({
    mutationFn: (input: RegisterInput) => register(input),
    onSuccess: (profile) => setProfile(profile),
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: (input: LoginInput) => login(input),
  });
}

export function useLogout() {
  const signOut = useAuthStore((s) => s.signOut);
  return useMutation({ mutationFn: () => signOut() });
}
