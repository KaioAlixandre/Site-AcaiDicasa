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

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          
          // Tentar verificar se o token ainda é válido e carregar perfil completo
          // Se falhar, usar os dados do localStorage como fallback
          try {
            const userProfile = await apiService.getProfile();
            setUser(userProfile);
            // Atualizar o usuário no localStorage com dados completos
            localStorage.setItem('user', JSON.stringify(userProfile));
          } catch (profileError: any) {
            // Se o erro for 401 (não autorizado), o token realmente expirou
            if (profileError.response?.status === 401) {
              // Token inválido, limpar storage
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              setToken(null);
              setUser(null);
            } else {
              // Se for outro erro (rede, servidor, etc), usar dados do localStorage
              // Isso mantém o usuário logado mesmo com problemas temporários
              const parsedUser = JSON.parse(storedUser);
              setUser(parsedUser);
              console.warn('Erro ao carregar perfil, usando dados do localStorage:', profileError.message);
            }
          }
        } catch (error) {
          // Erro ao parsear ou acessar localStorage, manter como não autenticado
          console.error('Erro ao inicializar autenticação:', error);
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (telefone: string, password: string) => {
    try {
      setLoading(true);
     
      
      const response = await apiService.login({ telefone, password });
     
      
      // Salvar token no localStorage ANTES de fazer outras requisições
      localStorage.setItem('token', response.token);
      setToken(response.token);
     
      
      // Carregar perfil completo com endereços
      const userProfile = await apiService.getProfile();
     
      
      setUser(userProfile);
      localStorage.setItem('user', JSON.stringify(userProfile));
    
    } catch (error: any) {
     
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
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const refreshUserProfile = async () => {
    try {
      const userProfile = await apiService.getProfile();
      setUser(userProfile);
      localStorage.setItem('user', JSON.stringify(userProfile));
    } catch (error) {
    
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    setUser, // Add setUser to match AuthContextType
    refreshUserProfile, // Add refresh function
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
