"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string | null;
  shopId: number;
  quantity: number;
  min_order_quantity?: number;
  wholesale_price?: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (productId: number) => void;
  decrementCartItem: (productId: number) => void;
  clearCart: () => void;
  buyNow: (item: Omit<CartItem, 'quantity'>) => void;
  cartCount: number;
  totalAmount: number;
  groupedByShop: { [shopId: number]: CartItem[] };
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load from local storage
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart', e);
      }
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (newItem: Omit<CartItem, 'quantity'>) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === newItem.id);
      const moq = newItem.min_order_quantity || 1;
      if (existing) {
        return prev.map(item => 
          item.id === newItem.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...newItem, quantity: moq }];
    });
  };

  const decrementCartItem = (productId: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === productId);
      if (existing) {
        const moq = existing.min_order_quantity || 1;
        if (existing.quantity > moq) {
          return prev.map(item => 
            item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
          );
        } else {
          return prev.filter(item => item.id !== productId);
        }
      }
      return prev;
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const buyNow = (newItem: Omit<CartItem, 'quantity'>) => {
    const moq = newItem.min_order_quantity || 1;
    setCart([{ ...newItem, quantity: moq }]);
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const totalAmount = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  // Group items by shop for split checkout
  const groupedByShop = cart.reduce((acc: any, item) => {
    if (!acc[item.shopId]) acc[item.shopId] = [];
    acc[item.shopId].push(item);
    return acc;
  }, {});

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, decrementCartItem, clearCart, buyNow, cartCount, totalAmount, groupedByShop }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
