import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, CartContextType } from '../types';
import { apiService } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Carregar carrinho quando o usuário fizer login
  useEffect(() => {
    if (user) {
      loadCart();
    } else {
      setItems([]);
      setTotal(0);
    }
  }, [user]);

  const loadCart = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCart();
      setItems(response.items);
      setTotal(response.cartTotal);
    } catch (error) {
      console.error('Erro ao carregar carrinho:', error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (productId: number, quantity: number) => {
    try {
      setLoading(true);
      await apiService.addToCart(productId, quantity);
      await loadCart(); // Recarregar carrinho após adicionar item
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao adicionar item ao carrinho');
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (cartItemId: number, quantity: number) => {
    try {
      setLoading(true);
      await apiService.updateCartItem(cartItemId, quantity);
      await loadCart(); // Recarregar carrinho após atualizar item
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao atualizar item do carrinho');
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (cartItemId: number) => {
    try {
      setLoading(true);
      await apiService.removeFromCart(cartItemId);
      await loadCart(); // Recarregar carrinho após remover item
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao remover item do carrinho');
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setLoading(true);
      await apiService.clearCart();
      setItems([]);
      setTotal(0);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao esvaziar carrinho');
    } finally {
      setLoading(false);
    }
  };

  const value: CartContextType = {
    items,
    total,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    loading,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
