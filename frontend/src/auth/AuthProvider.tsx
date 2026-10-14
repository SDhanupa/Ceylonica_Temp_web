import React, { createContext, useContext, ReactNode } from 'react';

/**
 * Public portal: authentication removed.
 *
 * Replaces the main app's Keycloak AuthProvider with the same `useAuth()`
 * contract, always anonymous, so the copied pages and components run
 * unchanged — exactly as they do for a signed-out visitor in the main app.
 * Login / Join open the main app (VITE_MAIN_APP_URL), where accounts live.
 */
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | undefined;
  getToken: () => Promise<string | undefined>;
  userInfo: {
    name?: string;
    email?: string;
    sub?: string;
    preferred_username?: string;
    realm_roles?: string[];
    given_name?: string;
    family_name?: string;
    role?: string;
    id?: string;
    mobile_number?: string;
    nic?: string;
    address?: string;
    dob?: string;
    gender?: string;
  } | null;
  logout: () => void;
  login: (redirectUri?: string) => void;
  register: (redirectUri?: string) => void;
}

const MAIN_APP_URL = (import.meta.env.VITE_MAIN_APP_URL || '').replace(/\/+$/, '');

const openMainApp = (redirectUri?: string) => {
  if (!MAIN_APP_URL) return;
  let path = '/';
  try {
    path = new URL(redirectUri || '/', window.location.origin).pathname;
  } catch {
    // keep '/'
  }
  window.location.assign(`${MAIN_APP_URL}${path.startsWith('/user') ? '/user' : '/login'}`);
};

const anonymous: AuthContextType = {
  isAuthenticated: false,
  isLoading: false,
  token: undefined,
  getToken: async () => undefined,
  userInfo: null,
  logout: () => {},
  login: openMainApp,
  register: openMainApp,
};

const AuthContext = createContext<AuthContextType | null>(anonymous);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => (
  <AuthContext.Provider value={anonymous}>{children}</AuthContext.Provider>
);

export const useAuth = () => useContext(AuthContext) as AuthContextType;

export default AuthContext;
