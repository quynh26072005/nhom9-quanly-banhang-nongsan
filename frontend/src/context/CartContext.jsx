/**
 * Cart Context - Manage cart state globally
 */
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchCartCount();
    } else {
      setCartCount(0);
    }
  }, [isAuthenticated]);

  const fetchCartCount = async () => {
    try {
      const response = await api.get('/cart');
      const cartData = response.data.data;
      const items = cartData?.items || [];
      const totalCount = items.reduce((sum, item) => {
        const qty = parseFloat(item.quantity) || 0;
        return sum + qty;
      }, 0);
      // Round to integer if it's a whole number
      setCartCount(totalCount % 1 === 0 ? Math.round(totalCount) : totalCount);
    } catch (error) {
      console.error('Failed to fetch cart count:', error);
      setCartCount(0);
    }
  };

  const refreshCart = () => {
    if (isAuthenticated) {
      fetchCartCount();
    }
  };

  const value = {
    cartCount,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
