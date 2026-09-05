export type UserRole = 'student' | 'vendor' | 'admin';

export interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  studentId?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface Vendor {
  _id: string;
  id?: string;
  ownerId?: string | User;
  name: string;
  description: string;
  logo?: string;
  location: string;
  phone: string;
  openingTime: string;
  closingTime: string;
  isOpen: boolean;
  isApproved: boolean;
  isSuspended: boolean;
  estimatedPreparationTime: number;
  maxOrdersPerSlot: number;
  slotIntervalMinutes: number;
  categories?: MenuCategory[];
}

export interface MenuCategory {
  _id: string;
  id?: string;
  vendorId: string;
  name: string;
  order: number;
}

export interface MenuItem {
  _id: string;
  id?: string;
  vendorId: string;
  categoryId: string | MenuCategory;
  name: string;
  description: string;
  price: number;
  image?: string;
  isVegetarian: boolean;
  isAvailable: boolean;
  preparationTime: number;
}

export interface PickupSlot {
  _id: string;
  id?: string;
  vendorId: string;
  startTime: string;
  endTime: string;
  maxOrders: number;
  bookedOrders: number;
  isActive: boolean;
}

export type OrderStatus = 'PLACED' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  isVegetarian?: boolean;
}

export interface Order {
  _id: string;
  id?: string;
  orderNumber: string;
  studentId: string | User;
  vendorId: string | Vendor;
  pickupSlotId: string | PickupSlot;
  pickupStartTime: string;
  pickupEndTime: string;
  items: OrderItem[];
  subtotal: number;
  platformFee: number;
  totalAmount: number;
  orderStatus: OrderStatus;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentId?: string;
  pickupPin?: string;
  urgency?: 'NORMAL' | 'DUE SOON' | 'OVERDUE';
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  isVegetarian: boolean;
}

export interface AuditLog {
  _id: string;
  action: string;
  userId?: string | User;
  details: string;
  ipAddress?: string;
  createdAt: string;
}
