export type Role = 'student' | 'vendor' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  studentId?: string;
  vendorId?: string;
  vendor?: {
    id: string;
    name: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
    isOpen: boolean;
  } | null;
}

export interface Vendor {
  _id: string;
  id?: string;
  name: string;
  slug: string;
  description: string;
  logo?: string;
  location: string;
  phone: string;
  openingTime: string;
  closingTime: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  isOpen: boolean;
  estimatedPreparationTime: number;
  pickupSlotDuration: number;
  pickupSlotCapacity: number;
  createdAt: string;
}

export interface MenuCategory {
  _id: string;
  vendorId: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface MenuItem {
  _id: string;
  vendorId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  preparationTime: number;
  isAvailable: boolean;
  isVegetarian: boolean;
}

export interface PickupSlot {
  _id: string;
  vendorId: string;
  date: string;
  startTime: string;
  endTime: string;
  maxOrders: number;
  bookedOrders: number;
  isActive: boolean;
}

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  isVegetarian?: boolean;
}

export type OrderStatus = 'PLACED' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  studentId: User | string;
  vendorId: Vendor | string;
  items: OrderItem[];
  subtotal: number;
  platformFee: number;
  totalAmount: number;
  pickupSlotId: string;
  pickupDate: string;
  pickupStartTime: string;
  pickupEndTime: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  razorpayOrderId?: string;
  pickupPin?: string; // Available to student
  urgency?: 'NORMAL' | 'DUE SOON' | 'OVERDUE';
  createdAt: string;
  acceptedAt?: string;
  preparingAt?: string;
  readyAt?: string;
  completedAt?: string;
  cancelledAt?: string;
}

export interface Payment {
  _id: string;
  orderId: any;
  studentId: any;
  provider: string;
  providerOrderId: string;
  providerPaymentId?: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}
