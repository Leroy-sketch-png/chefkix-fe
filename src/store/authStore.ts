  import { create } from 'zustand';

  interface AuthState {
    isLoggedIn: boolean;
    user: { email: string } | null;
    login: (email: string) => void;
    logout: () => void;
  }

  export const useAuthStore = create<AuthState>((set) => ({
    isLoggedIn: false,
    user: null,
    login: (email: string) => set({ isLoggedIn: true, user: { email } }),
    logout: () => set({ isLoggedIn: false, user: null }),
  }));