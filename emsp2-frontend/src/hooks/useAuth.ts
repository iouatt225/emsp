import { useAuthStore } from "../store/authStore";

export const useAuth = () => {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const hydrate = useAuthStore((state) => state.hydrate);
  const setUser = useAuthStore((state) => state.setUser);

  return {
    user,
    accessToken,
    isAuthenticated,
    login,
    logout,
    hydrate,
    setUser,
  };
};
