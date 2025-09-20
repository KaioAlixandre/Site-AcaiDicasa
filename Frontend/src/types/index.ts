// User related types
export interface User {
  id: number;
  username: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin' | 'master';
  createdAt: string;
  addresses?: Address[];
  orders?: {
    totalPrice: number;
    // other order properties...
  }[];
}

export interface Address {
  id: number;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  isDefault: boolean;
  userId: number;
}

// Product related types
export interface Product {
  id: number;
  name: string;
  price: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  images?: ProductImage[];
  options?: ProductOption[];
  categoryId?: number;
  category?: ProductCategory;
}

export interface ProductImage {
  id: number;
  url: string;
  altText?: string;
  productId: number;
}

export interface ProductCategory {
  id: number;
  name: string;
  products?: Product[];
}

export interface ProductOption {
  id: number;
  name: string;
  productId: number;
  values: OptionValue[];
}

export interface OptionValue {
  id: number;
  value: string;
  priceModifier: number;
  optionId: number;
}

// Cart related types
export interface Cart {
  id: number;
  createdAt: string;
  userId: number;
  items: CartItem[];
}

export interface CartItem {
  id: number;
  quantity: number;
  createdAt: string;
  cartId: number;
  productId: number;
  product: Product;
  selectedOptions?: any;
  totalPrice?: number;
}

// Order related types
export interface Order {
  id: number;
  totalPrice: number;
  status: OrderStatus;
  createdAt: string;
  userId: number;
  shippingStreet: string;
  shippingNumber: string;
  shippingComplement?: string;
  shippingNeighborhood: string;
  shippingPhone?: string;
  orderItems: OrderItem[];
  payment?: Payment;
  user?: {
    username?: string;
    // other user properties...
  };
}

export interface OrderItem {
  id: number;
  quantity: number;
  priceAtOrder: number;
  orderId: number;
  productId: number;
  product: Product;
  selectedOptionsSnapshot?: any;
}

export interface Payment {
  id: number;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
  orderId: number;
}

export interface Coupon {
  id: number;
  code: string;
  discountType: DiscountType;
  value: number;
  expiresAt?: string;
  isActive: boolean;
  maxUses?: number;
  usedCount: number;
}

export interface OrderCoupon {
  id: number;
  orderId: number;
  couponId: number;
  discountAmount: number;
  coupon: Coupon;
}

// Review types
export interface Review {
  id: number;
  rating: number;
  comment?: string;
  createdAt: string;
  userId: number;
  productId: number;
  user: User;
}

// Enums
export type Role = 'user' | 'admin' | 'master';
export type OrderStatus = 'pending_payment' | 'being_prepared' | 'on_the_way' | 'delivered' | 'canceled';
export type PaymentMethod = 'CREDIT_CARD' | 'PIX' | 'CASH_ON_DELIVERY';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';

// API Response types
export interface ApiResponse<T> {
  message: string;
  data?: T;
  error?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface CartResponse {
  items: CartItem[];
  cartTotal: number;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  username: string;
  email: string;
  password: string;
}

export interface AddressForm {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  isDefault?: boolean;
}

export interface ProductForm {
  name: string;
  price: number;
  description?: string;
  categoryId?: number;
}

// Context types
export interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  refreshUserProfile: () => Promise<void>;
}

export interface CartContextType {
  items: CartItem[];
  total: number;
  addItem: (productId: number, quantity: number) => Promise<void>;
  updateItem: (cartItemId: number, quantity: number) => Promise<void>;
  removeItem: (cartItemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  loading: boolean;
}
