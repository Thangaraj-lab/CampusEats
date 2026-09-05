import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, MenuItem, PickupSlot } from '../types';

interface CartVendor {
  id: string;
  name: string;
  location: string;
}

interface CartContextType {
  cartVendor: CartVendor | null;
  items: CartItem[];
  selectedSlot: PickupSlot | null;
  subtotal: number;
  platformFee: number;
  totalAmount: number;
  conflictModalOpen: boolean;
  pendingItemToAdd: { item: MenuItem; vendor: CartVendor } | null;
  addItem: (item: MenuItem, vendor: CartVendor, quantity?: number) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  removeItem: (menuItemId: string) => void;
  selectSlot: (slot: PickupSlot | null) => void;
  clearCart: () => void;
  confirmClearAndAdd: () => void;
  cancelConflict: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const PLATFORM_FEE = 5; // ₹5 platform fee

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartVendor, setCartVendor] = useState<CartVendor | null>(() => {
    const saved = localStorage.getItem('campus_eats_cart_vendor');
    return saved ? JSON.parse(saved) : null;
  });

  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('campus_eats_cart_items');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedSlot, setSelectedSlot] = useState<PickupSlot | null>(() => {
    const saved = localStorage.getItem('campus_eats_cart_slot');
    return saved ? JSON.parse(saved) : null;
  });

  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [pendingItemToAdd, setPendingItemToAdd] = useState<{ item: MenuItem; vendor: CartVendor } | null>(null);

  useEffect(() => {
    if (cartVendor) {
      localStorage.setItem('campus_eats_cart_vendor', JSON.stringify(cartVendor));
    } else {
      localStorage.removeItem('campus_eats_cart_vendor');
    }
  }, [cartVendor]);

  useEffect(() => {
    localStorage.setItem('campus_eats_cart_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (selectedSlot) {
      localStorage.setItem('campus_eats_cart_slot', JSON.stringify(selectedSlot));
    } else {
      localStorage.removeItem('campus_eats_cart_slot');
    }
  }, [selectedSlot]);

  const addItem = (item: MenuItem, vendor: CartVendor, quantityToAdd: number = 1) => {
    // Check if cart already has items from another vendor
    if (cartVendor && cartVendor.id !== vendor.id && items.length > 0) {
      setPendingItemToAdd({ item, vendor });
      setConflictModalOpen(true);
      return;
    }

    if (!cartVendor) {
      setCartVendor(vendor);
    }

    setItems((prevItems) => {
      const existing = prevItems.find((i) => i.menuItemId === item._id);
      if (existing) {
        return prevItems.map((i) =>
          i.menuItemId === item._id ? { ...i, quantity: i.quantity + quantityToAdd } : i
        );
      }
      return [
        ...prevItems,
        {
          menuItemId: item._id,
          name: item.name,
          price: item.price,
          quantity: quantityToAdd,
          image: item.image,
          isVegetarian: item.isVegetarian,
        },
      ];
    });
  };

  const updateQuantity = (menuItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(menuItemId);
      return;
    }
    setItems((prevItems) =>
      prevItems.map((i) => (i.menuItemId === menuItemId ? { ...i, quantity: newQuantity } : i))
    );
  };

  const removeItem = (menuItemId: string) => {
    setItems((prevItems) => {
      const updated = prevItems.filter((i) => i.menuItemId !== menuItemId);
      if (updated.length === 0) {
        setCartVendor(null);
        setSelectedSlot(null);
      }
      return updated;
    });
  };

  const selectSlot = (slot: PickupSlot | null) => {
    setSelectedSlot(slot);
  };

  const clearCart = () => {
    setItems([]);
    setCartVendor(null);
    setSelectedSlot(null);
    localStorage.removeItem('campus_eats_cart_items');
    localStorage.removeItem('campus_eats_cart_vendor');
    localStorage.removeItem('campus_eats_cart_slot');
  };

  const confirmClearAndAdd = () => {
    if (pendingItemToAdd) {
      setItems([
        {
          menuItemId: pendingItemToAdd.item._id,
          name: pendingItemToAdd.item.name,
          price: pendingItemToAdd.item.price,
          quantity: 1,
          image: pendingItemToAdd.item.image,
          isVegetarian: pendingItemToAdd.item.isVegetarian,
        },
      ]);
      setCartVendor(pendingItemToAdd.vendor);
      setSelectedSlot(null);
    }
    setConflictModalOpen(false);
    setPendingItemToAdd(null);
  };

  const cancelConflict = () => {
    setConflictModalOpen(false);
    setPendingItemToAdd(null);
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const platformFee = items.length > 0 ? PLATFORM_FEE : 0;
  const totalAmount = subtotal + platformFee;

  return (
    <CartContext.Provider
      value={{
        cartVendor,
        items,
        selectedSlot,
        subtotal,
        platformFee,
        totalAmount,
        conflictModalOpen,
        pendingItemToAdd,
        addItem,
        updateQuantity,
        removeItem,
        selectSlot,
        clearCart,
        confirmClearAndAdd,
        cancelConflict,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
