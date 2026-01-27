import { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import Keycloak from 'keycloak-js';
import keycloak from '../config/keycloak';

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  keycloak: Keycloak;
  logout: () => void;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const isInitialized = useRef(false);

  const parseTokenAndSetUser = useCallback((tokenParsed: any) => {
    const realmRoles = tokenParsed.realm_access?.roles || [];
    const clientRoles = tokenParsed.resource_access?.['konitys-booth']?.roles || [];
    const allRoles = [...realmRoles, ...clientRoles];

    setUser({
      id: tokenParsed.sub || '',
      username: tokenParsed.preferred_username || '',
      email: tokenParsed.email || '',
      firstName: tokenParsed.given_name || '',
      lastName: tokenParsed.family_name || '',
      roles: allRoles,
    });
  }, []);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    // SSO: login-required redirige vers Keycloak si pas de session
    // Si déjà connecté sur le Hub (même realm), Keycloak renvoie directement le token
    keycloak
      .init({
        onLoad: 'login-required',
        checkLoginIframe: false,
        pkceMethod: 'S256'
      })
      .then((authenticated: boolean) => {
        if (authenticated && keycloak.tokenParsed) {
          setIsAuthenticated(true);
          setToken(keycloak.token || null);
          parseTokenAndSetUser(keycloak.tokenParsed);
        }
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Keycloak init error:', error);
        setIsLoading(false);
      });

    // Token refresh automatique
    keycloak.onTokenExpired = () => {
      keycloak.updateToken(30).then((refreshed) => {
        if (refreshed) {
          setToken(keycloak.token || null);
        }
      }).catch(() => {
        keycloak.logout();
      });
    };
  }, [parseTokenAndSetUser]);

  const logout = () => {
    // Redirige vers booth après déconnexion
    keycloak.logout({ redirectUri: window.location.origin });
  };

  const hasRole = (role: string): boolean => {
    return user?.roles.includes(role) || false;
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        token,
        keycloak,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
