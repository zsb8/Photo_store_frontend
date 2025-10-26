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
  const [isInitialized, setIsInitialized] = useState(false);

  // 从localStorage加载购物车数据
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loadCartFromStorage = () => {
        const savedCart = localStorage.getItem('cartItems');
        if (savedCart) {
          try {
            const parsedCart = JSON.parse(savedCart);
            setCartItems(parsedCart);
            console.log('Loaded cart from localStorage:', parsedCart);
          } catch (error) {
            console.error('Error loading cart from localStorage:', error);
            setCartItems([]);
          }
        } else {
          setCartItems([]);
        }
        setIsInitialized(true);
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

  // 保存购物车数据到localStorage（只在初始化完成后）
  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialized) {
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
      console.log('Saved cart to localStorage:', cartItems);
    }
  }, [cartItems, isInitialized]);

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
      console.log('Cart cleared and localStorage removed');
    }
  };

  const isInCart = (id: string | number) => {
    return cartItems.some(item => String(item.id) === String(id));
  };

  const getCartTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.price, 0);
  };

  const markAsPurchased = async () => {
    console.log('=== MARK AS PURCHASED ===');
    console.log('Current cart items before marking:', cartItems);
    
    // 创建一个新的Promise来确保状态更新完成
    await new Promise<void>((resolve) => {
      setCartItems(prev => {
        const updatedItems = prev.map(item => ({
          ...item,
          purchased: true
        }));
        console.log('Marking all items as purchased');
        return updatedItems;
      });
      
      // 使用setTimeout确保状态更新已经完成
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          // 更新localStorage中的购物车数据
          const updatedItems = cartItems.map(item => ({
            ...item,
            purchased: true
          }));
          localStorage.setItem('cartItems', JSON.stringify(updatedItems));
          
          // 清除选择信息与购物车总金额
          localStorage.removeItem('cartSelectedIds');
          localStorage.removeItem('cartSelectedTotal');
          localStorage.removeItem('cartTotal');
          console.log('Updated cart items in localStorage and cleared selection');
        }
        resolve();
      }, 100);
    });
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
            const parsedCart = JSON.parse(savedCart);
            setCartItems(parsedCart);
            console.log('Cart refreshed from localStorage:', parsedCart);
          } catch (error) {
            console.error('Error loading cart from localStorage:', error);
            setCartItems([]);
          }
        } else {
          setCartItems([]);
          console.log('No cart data found in localStorage, setting empty cart');
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
