import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem } from '../components/ShoppingCart';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string | number) => void;
  clearCart: () => void;
  isInCart: (id: string | number) => boolean;
  getCartTotal: () => number;
  markAsPurchased: () => void;
  getUnpurchasedItems: () => CartItem[];
  refreshCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // 从localStorage加载购物车数据
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loadCartFromStorage = () => {
        const savedCart = localStorage.getItem('cartItems');
        if (savedCart) {
          try {
            setCartItems(JSON.parse(savedCart));
          } catch (error) {
            console.error('Error loading cart from localStorage:', error);
          }
        }
      };

      // 初始加载
      loadCartFromStorage();

      // 监听localStorage变化
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'cartItems') {
          loadCartFromStorage();
        }
      };

      window.addEventListener('storage', handleStorageChange);

      // 清理监听器
      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, []);

  // 保存购物车数据到localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
    }
  }, [cartItems]);

  const addToCart = (item: CartItem) => {
    setCartItems(prev => {
      // 检查商品是否已经在购物车中
      const exists = prev.find(cartItem => String(cartItem.id) === String(item.id));
      if (exists) {
        return prev; // 如果已存在，不重复添加
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (id: string | number) => {
    setCartItems(prev => {
      // 确保ID比较的一致性
      return prev.filter(item => String(item.id) !== String(id));
    });
  };

  const clearCart = () => {
    setCartItems([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cartItems');
      localStorage.removeItem('cartTotal');
    }
  };

  const isInCart = (id: string | number) => {
    return cartItems.some(item => String(item.id) === String(id));
  };

  const getCartTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.price, 0);
  };

  const markAsPurchased = () => {
    console.log('=== MARK AS PURCHASED ===');
    console.log('Current cart items before marking:', cartItems);
    setCartItems(prev => {
      const updatedItems = prev.map(item => ({ ...item, purchased: true }));
      console.log('Updated cart items after marking:', updatedItems);
      return updatedItems;
    });
    // 清除购物车总金额
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cartTotal');
      console.log('Removed cartTotal from localStorage');
    }
  };

  const getUnpurchasedItems = () => {
    return cartItems.filter(item => !item.purchased);
  };

  const refreshCart = () => {
    if (typeof window !== 'undefined') {
      const loadCartFromStorage = () => {
        const savedCart = localStorage.getItem('cartItems');
        if (savedCart) {
          try {
            setCartItems(JSON.parse(savedCart));
          } catch (error) {
            console.error('Error loading cart from localStorage:', error);
          }
        }
      };
      loadCartFromStorage();
    }
  };

  const value: CartContextType = {
    cartItems,
    addToCart,
    removeFromCart,
    clearCart,
    isInCart,
    getCartTotal,
    markAsPurchased,
    getUnpurchasedItems,
    refreshCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
