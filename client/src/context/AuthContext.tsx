import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearAuth = () => {
    localStorage.removeItem('taskstudio_token');
    localStorage.removeItem('taskstudio_user');
    sessionStorage.removeItem('taskstudio_token');
    sessionStorage.removeItem('taskstudio_user');
  };

  useEffect(() => {
    const storedToken = sessionStorage.getItem('taskstudio_token') || localStorage.getItem('taskstudio_token');
    const storedUser = sessionStorage.getItem('taskstudio_user') || localStorage.getItem('taskstudio_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));

      authAPI.getMe()
        .then((res) => {
          setUser(res.data.user);
          const storage = localStorage.getItem('taskstudio_token') ? localStorage : sessionStorage;
          storage.setItem('taskstudio_user', JSON.stringify(res.data.user));
        })
        .catch(() => {
          clearAuth();
          setToken(null);
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean = true) => {
    const response = await authAPI.login({ email, password });
    const { user: userData, token: userToken } = response.data;

    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('taskstudio_token', userToken);
    storage.setItem('taskstudio_user', JSON.stringify(userData));

    // If not remembering, clear any existing localStorage copy
    if (!rememberMe) {
      localStorage.removeItem('taskstudio_token');
      localStorage.removeItem('taskstudio_user');
    }

    setToken(userToken);
    setUser(userData);
  };

  const register = async (name: string, email: string, password: string, role?: string) => {
    const response = await authAPI.register({ name, email, password, role });
    const { user: userData, token: userToken } = response.data;

    localStorage.setItem('taskstudio_token', userToken);
    localStorage.setItem('taskstudio_user', JSON.stringify(userData));

    setToken(userToken);
    setUser(userData);
  };

  const googleLogin = async (idToken: string) => {
    const response = await authAPI.googleLogin(idToken);
    const { user: userData, token: userToken } = response.data;

    localStorage.setItem('taskstudio_token', userToken);
    localStorage.setItem('taskstudio_user', JSON.stringify(userData));

    setToken(userToken);
    setUser(userData);
  };

  const logout = () => {
    authAPI.logout().catch(() => {});
    clearAuth();
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    // Write to whichever storage holds the token (respects rememberMe choice)
    const storage = localStorage.getItem('taskstudio_token') ? localStorage : sessionStorage;
    storage.setItem('taskstudio_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        googleLogin,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};