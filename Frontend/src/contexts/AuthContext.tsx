import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '../types';
import { apiService } from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Função para sincronizar token com localStorage
  const syncToken = (newToken: string | null) => {
    if (newToken) {
      localStorage.setItem('token', newToken);
      setToken(newToken);
    } else {
      localStorage.removeItem('token');
      setToken(null);
    }
  };

  // Função para sincronizar usuário com localStorage
  const syncUser = (newUser: User | null) => {
    if (newUser) {
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
    } else {
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  // Inicializar autenticação ao carregar a aplicação
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUserStr = localStorage.getItem('user');

        if (storedToken) {
          // Sempre definir o token primeiro para que as requisições funcionem
          setToken(storedToken);
          
          // Tentar restaurar usuário do localStorage temporariamente
          if (storedUserStr) {
            try {
              const storedUser = JSON.parse(storedUserStr);
              setUser(storedUser);
            } catch (e) {
              console.warn('Erro ao parsear usuário do localStorage:', e);
            }
          }

          // Validar token e carregar perfil completo do servidor
          try {
            const userProfile = await apiService.getProfile();
            syncUser(userProfile);
            syncToken(storedToken); // Garantir que o token está salvo
          } catch (error: any) {
            // Token inválido ou expirado
            console.warn('Token inválido ou expirado:', error);
            // Limpar tudo
            syncToken(null);
            syncUser(null);
          }
        } else {
          // Não há token, garantir que está limpo
          syncToken(null);
          syncUser(null);
        }
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error);
        syncToken(null);
        syncUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Sincronizar token quando mudar
  useEffect(() => {
    const currentToken = localStorage.getItem('token');
    if (token !== currentToken) {
      if (token) {
        localStorage.setItem('token', token);
      } else if (currentToken) {
        // Se o token foi removido do estado mas ainda existe no localStorage, remover
        localStorage.removeItem('token');
      }
    }
  }, [token]);

  // Listener para eventos de logout (quando token é invalidado pelo interceptor)
  useEffect(() => {
    const handleAuthLogout = () => {
      syncUser(null);
      syncToken(null);
    };

    window.addEventListener('auth:logout', handleAuthLogout);
    
    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout);
    };
  }, []);

  const login = async (telefone: string, password: string) => {
    try {
      setLoading(true);
      
      const response = await apiService.login({ telefone, password });
      
      // Salvar token no localStorage ANTES de fazer outras requisições
      syncToken(response.token);
      
      // Carregar perfil completo com endereços
      const userProfile = await apiService.getProfile();
      
      // Salvar usuário no localStorage
      syncUser(userProfile);
    
    } catch (error: any) {
      // Em caso de erro, limpar tudo
      syncToken(null);
      syncUser(null);
      throw new Error(error.response?.data?.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, telefone: string, password: string) => {
    try {
      setLoading(true);
      await apiService.register({ username, telefone, password });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    syncUser(null);
    syncToken(null);
    // Garantir que está tudo limpo
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const refreshUserProfile = async () => {
    try {
      const userProfile = await apiService.getProfile();
      syncUser(userProfile);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      // Se houver erro 401, fazer logout
      if ((error as any)?.response?.status === 401) {
        logout();
      }
    }
  };

  // Wrapper para setUser que mantém sincronização com localStorage
  const setUserWrapper = (newUser: User | null | ((prev: User | null) => User | null)) => {
    if (typeof newUser === 'function') {
      setUser((prev) => {
        const updated = newUser(prev);
        syncUser(updated);
        return updated;
      });
    } else {
      syncUser(newUser);
    }
  };

  const value: AuthContextType = {
    user,
    token: token || localStorage.getItem('token'), // Sempre retornar do localStorage se o estado estiver vazio
    login,
    register,
    logout,
    loading,
    setUser: setUserWrapper, // Usar wrapper para manter sincronizado
    refreshUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
