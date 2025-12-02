import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, CartContextType, Product } from '../types';
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

  // Helpers para carrinho de convidado (localStorage)
  const GUEST_CART_KEY = 'guestCart';

  const readGuestCart = (): any[] => {
    try {
      const raw = localStorage.getItem(GUEST_CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  };

  const saveGuestCart = (guestItems: any[]) => {
    try {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(guestItems));
    } catch (e) {
      console.error('Erro ao salvar guest cart:', e);
    }
  };

  const toCartItems = (guestItems: any[]): CartItem[] => {
    return guestItems.map((g, idx) => ({
      id: g.id ?? -(idx + 1),
      quantity: g.quantity,
      createdAt: g.createdAt ?? new Date().toISOString(),
      cartId: g.cartId ?? 0,
      productId: g.productId ?? 0,
      product: g.product as Product,
      complements: g.complements ?? [],
      totalPrice: g.totalPrice ?? (g.product ? g.product.price * g.quantity : undefined),
    }));
  };

  const recalcGuestTotals = (guestItems: any[]) => {
    const total = guestItems.reduce((acc, g) => {
      const pPrice = g.product?.price ?? 0;
      return acc + (g.totalPrice ?? (pPrice * g.quantity));
    }, 0);
    return total;
  };

  // Carregar carrinho do servidor quando usuário logado; quando não, carregar localStorage
  useEffect(() => {
    const init = async () => {
      if (user) {
        // Ao logar, sincronizar possível guest cart para o servidor
        const guest = readGuestCart();
        if (guest.length > 0) {
          try {
            setLoading(true);
            for (const gi of guest) {
              // se for um item customizado (sem productId), ignoramos a sincronização automática
              if (!gi.productId) continue;
              await apiService.addToCart(gi.productId, gi.quantity, gi.complementIds || []);
            }
            // limpar guest cart e recarregar do servidor
            localStorage.removeItem(GUEST_CART_KEY);
            await loadCart();
          } catch (error) {
            console.error('Erro ao sincronizar guest cart:', error);
            // mesmo que falhe, tentar carregar o carrinho do servidor
            await loadCart();
          } finally {
            setLoading(false);
          }
        } else {
          await loadCart();
        }
      } else {
        // carregar carrinho local para convidado
        const guest = readGuestCart();
        const cartItems = toCartItems(guest);
        setItems(cartItems);
        setTotal(recalcGuestTotals(guest));
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const addItem = async (productId: number, quantity: number, complementIds?: number[]) => {
    try {
      setLoading(true);
      if (user) {
        await apiService.addToCart(productId, quantity, complementIds);
        await loadCart(); // Recarregar carrinho após adicionar item
      } else {
        // Carrinho local para convidado
        const guest = readGuestCart();
        // Buscar produto para exibição
        let product: Product | null = null;
        try {
          product = await apiService.getProductById(productId);
        } catch (e) {
          console.warn('Não foi possível buscar produto para guest cart', e);
        }

        // tentar encontrar item igual (mesmo produto e complementos)
        const match = guest.find((g) => g.productId === productId && JSON.stringify(g.complementIds || []) === JSON.stringify(complementIds || []));
        if (match) {
          match.quantity += quantity;
          match.totalPrice = (product?.price ?? match.totalPrice ?? 0) * match.quantity;
        } else {
          guest.push({
            id: Date.now(),
            productId,
            quantity,
            complementIds: complementIds || [],
            product,
            complements: [],
            totalPrice: (product?.price ?? 0) * quantity,
            createdAt: new Date().toISOString(),
          });
        }

        saveGuestCart(guest);
        setItems(toCartItems(guest));
        setTotal(recalcGuestTotals(guest));
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao adicionar item ao carrinho');
    } finally {
      setLoading(false);
    }
  };

  const addCustomAcai = async (customAcai: any, quantity: number) => {
    try {
      setLoading(true);
      if (user) {
        await apiService.addCustomAcaiToCart(customAcai, quantity);
        await loadCart(); // Recarregar carrinho após adicionar açaí personalizado
      } else {
        const guest = readGuestCart();
        guest.push({
          id: Date.now(),
          productId: null,
          type: 'custom_acai',
          customAcai,
          quantity,
          totalPrice: customAcai.value * quantity,
          createdAt: new Date().toISOString(),
        });
        saveGuestCart(guest);
        setItems(toCartItems(guest));
        setTotal(recalcGuestTotals(guest));
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao adicionar açaí personalizado ao carrinho');
    } finally {
      setLoading(false);
    }
  };

  const addCustomProduct = async (productName: string, customProduct: any, quantity: number) => {
    try {
      setLoading(true);
      if (user) {
        await apiService.addCustomProductToCart(productName, customProduct, quantity);
        await loadCart(); // Recarregar carrinho após adicionar produto personalizado
      } else {
        const guest = readGuestCart();
        guest.push({
          id: Date.now(),
          productId: null,
          type: 'custom_product',
          productName,
          customProduct,
          quantity,
          totalPrice: customProduct.value * quantity,
          createdAt: new Date().toISOString(),
        });
        saveGuestCart(guest);
        setItems(toCartItems(guest));
        setTotal(recalcGuestTotals(guest));
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao adicionar produto personalizado ao carrinho');
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (cartItemId: number, quantity: number) => {
    try {
      setLoading(true);
      if (user) {
        await apiService.updateCartItem(cartItemId, quantity);
        await loadCart(); // Recarregar carrinho após atualizar item
      } else {
        const guest = readGuestCart();
        const idx = guest.findIndex((g) => g.id === cartItemId);
        if (idx !== -1) {
          guest[idx].quantity = quantity;
          if (guest[idx].product) {
            guest[idx].totalPrice = guest[idx].product.price * quantity;
          }
          saveGuestCart(guest);
          setItems(toCartItems(guest));
          setTotal(recalcGuestTotals(guest));
        }
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao atualizar item do carrinho');
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (cartItemId: number) => {
    try {
      setLoading(true);
      if (user) {
        await apiService.removeFromCart(cartItemId);
        await loadCart(); // Recarregar carrinho após remover item
      } else {
        const guest = readGuestCart();
        const newGuest = guest.filter((g) => g.id !== cartItemId);
        saveGuestCart(newGuest);
        setItems(toCartItems(newGuest));
        setTotal(recalcGuestTotals(newGuest));
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao remover item do carrinho');
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setLoading(true);
      if (user) {
        await apiService.clearCart();
        setItems([]);
        setTotal(0);
      } else {
        localStorage.removeItem(GUEST_CART_KEY);
        setItems([]);
        setTotal(0);
      }
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
    addCustomAcai,
    addCustomProduct,
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
