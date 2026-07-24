import { create } from "zustand";
import { api, ApiError } from "@/api/client";
import { ENDPOINTS } from "@/api/endpoints";

export interface User {
  id: string;
  email: string;
  displayName: string;
}

interface AuthState {
  user: User | null;
  status: "idle" | "loading" | "authenticated" | "error";
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "idle",
  error: null,
  login: async (email, password) => {
    set({ status: "loading", error: null });
    try {
      let user: User;
      try {
        user = await api.post<User>(ENDPOINTS.login, { email, password });
      } catch (e) {
        // No register screen yet: an unknown email creates the account with
        // these credentials. A wrong password on an existing account still
        // errors (register conflicts with 409).
        if (e instanceof ApiError && e.status === 401) {
          user = await api.post<User>(`${ENDPOINTS.login.replace("login", "register")}`, {
            email,
            password,
          });
        } else {
          throw e;
        }
      }
      set({ user, status: "authenticated" });
    } catch (e) {
      const message =
        e instanceof ApiError && e.status === 409
          ? "Wrong password for this account."
          : (e as Error).message;
      set({ status: "error", error: message });
    }
  },
  logout: () => {
    void api.post(`${ENDPOINTS.login.replace("login", "logout")}`).catch(() => undefined);
    set({ user: null, status: "idle" });
  },
}));
