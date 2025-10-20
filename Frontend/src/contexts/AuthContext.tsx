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
          
          // Verificar se o token ainda é válido e carregar perfil completo
          const userProfile = await apiService.getProfile();
          setUser(userProfile);
          
          // Atualizar o usuário no localStorage com dados completos
          localStorage.setItem('user', JSON.stringify(userProfile));
        } catch (error) {
          // Token inválido, limpar storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('🔐 [AuthContext] Iniciando login para:', email);
      
      const response = await apiService.login({ email, password });
      console.log('✅ [AuthContext] Login response:', response);
      
      // Salvar token no localStorage ANTES de fazer outras requisições
      localStorage.setItem('token', response.token);
      setToken(response.token);
      console.log('🔑 [AuthContext] Token salvo no localStorage');
      
      // Carregar perfil completo com endereços
      const userProfile = await apiService.getProfile();
      console.log('👤 [AuthContext] Perfil carregado:', userProfile);
      
      setUser(userProfile);
      localStorage.setItem('user', JSON.stringify(userProfile));
      console.log('💾 [AuthContext] Usuário salvo no localStorage');
    } catch (error: any) {
      console.error('❌ [AuthContext] Erro no login:', error);
      throw new Error(error.response?.data?.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      setLoading(true);
      await apiService.register({ username, email, password });
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
      console.error('Erro ao atualizar perfil do usuário:', error);
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
