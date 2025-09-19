import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  User, 
  Product, 
  CartItem, 
  Order, 
  Address, 
  LoginForm, 
  RegisterForm, 
  AddressForm,
  LoginResponse,
  CartResponse,
  ProductCategory,
  ApiResponse 
} from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: 'http://localhost:3001/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para adicionar token de autenticação
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor para tratar respostas de erro
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(credentials: LoginForm): Promise<LoginResponse> {
    const response: AxiosResponse<LoginResponse> = await this.api.post('/auth/login', credentials);
    return response.data;
  }

  async register(userData: RegisterForm): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.post('/auth/register', userData);
    return response.data;
  }

  async getProfile(): Promise<User> {
    const response: AxiosResponse<User> = await this.api.get('/auth/profile');
    return response.data;
  }

  async updatePhone(phone: string): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.put('/auth/profile/phone', { phone });
    return response.data;
  }

  async getUsers(): Promise<User[]> {
  const response: AxiosResponse<User[]> = await this.api.get('/auth/users');
  return response.data;
}

  // Address endpoints
  async addAddress(addressData: AddressForm): Promise<ApiResponse<Address>> {
    const response: AxiosResponse<ApiResponse<Address>> = await this.api.post('/auth/profile/address', addressData);
    return response.data;
  }

  async getAddresses(): Promise<Address[]> {
    const response: AxiosResponse<Address[]> = await this.api.get('/auth/profile/addresses');
    return response.data;
  }

  async updateAddress(addressId: number, addressData: AddressForm): Promise<ApiResponse<Address>> {
    const response: AxiosResponse<ApiResponse<Address>> = await this.api.put(`/auth/profile/address/${addressId}`, addressData);
    return response.data;
  }

  // Product endpoints
  async getProducts(): Promise<Product[]> {
    const response: AxiosResponse<Product[]> = await this.api.get('/products');
    return response.data;
  }

  async getProductById(id: number): Promise<Product> {
    const response: AxiosResponse<Product> = await this.api.get(`/products/${id}`);
    return response.data;
  }

  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    const response: AxiosResponse<Product[]> = await this.api.get(`/products/category/${categoryId}`);
    return response.data;
  }

  async createProduct(formData: FormData): Promise<Product> {
    const response = await this.api.post('/products/add', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  async updateProduct(id: number, formData: FormData): Promise<Product> {
    const response = await this.api.put(`/products/update/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  async deleteProduct(id: number): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.delete(`/products/delete/${id}`);
    return response.data;
  }

  async addCategory(name: string): Promise<ProductCategory> {
    const response: AxiosResponse<ProductCategory> = await this.api.post('/products/categories/add', { name });
    return response.data;
  }

  async getCategories(): Promise<ProductCategory[]> {
    const response: AxiosResponse<ProductCategory[]> = await this.api.get('/products/categories');
    return response.data;
  }

  // Cart endpoints
  async getCart(): Promise<CartResponse> {
    const response: AxiosResponse<CartResponse> = await this.api.get('/cart');
    return response.data;
  }

  async addToCart(productId: number, quantity: number): Promise<ApiResponse<CartItem>> {
    const response: AxiosResponse<ApiResponse<CartItem>> = await this.api.post('/cart/add', {
      productId,
      quantity,
    });
    return response.data;
  }

  async updateCartItem(cartItemId: number, quantity: number): Promise<ApiResponse<CartItem>> {
    const response: AxiosResponse<ApiResponse<CartItem>> = await this.api.put(`/cart/update/${cartItemId}`, {
      quantity,
    });
    return response.data;
  }

  async removeFromCart(cartItemId: number): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.delete(`/cart/remove/${cartItemId}`);
    return response.data;
  }

  async clearCart(): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.delete('/cart/clear');
    return response.data;
  }

  // Order endpoints
  async createOrder(): Promise<ApiResponse<Order>> {
    const response: AxiosResponse<ApiResponse<Order>> = await this.api.post('/orders');
    return response.data;
  }

  async getOrderHistory(): Promise<Order[]> {
    const response: AxiosResponse<Order[]> = await this.api.get('/orders/history');
    return response.data;
  }

  async cancelOrder(orderId: number): Promise<ApiResponse<Order>> {
    const response: AxiosResponse<ApiResponse<Order>> = await this.api.put(`/orders/cancel/${orderId}`);
    return response.data;
  }

  async getOrders(): Promise<Order[]> {
  const response: AxiosResponse<Order[]> = await this.api.get('/orders/orders');
  return response.data;
}

async advanceOrderStatus(orderId: number, nextStatus: string): Promise<Order> {
  const response = await this.api.put(`/orders/status/${orderId}`, { status: nextStatus });
  return response.data.order;
}

async getPendingOrders() {
  const response = await this.api.get('/orders/pending-count');
  return response.data.count;
}

  async updateOrderStatus(orderId: number, status: string): Promise<ApiResponse<Order>> {
    const response: AxiosResponse<ApiResponse<Order>> = await this.api.put(`/orders/status/${orderId}`, {
      status,
    });
    return response.data;
  }

  // Insights endpoints
async getDailySales(date: string) {
  const response = await this.api.get(`/insights/daily-sales/${date}`);
  return response.data;
}

async getProductSales(date: string) {
  const response = await this.api.get(`/insights/product-sales/${date}`);
  return response.data;
}

async getCategorySales(date: string) {
  const response = await this.api.get(`/insights/category-sales/${date}`);
  return response.data;
}

// Store Config endpoints
async getStoreConfig() {
  const response = await this.api.get('/store-config');
  return response.data;
}

async updateStoreConfig(data: any) {
  const response = await this.api.put('/store-config', data);
  return response.data;
}
}

export const apiService = new ApiService();
export default apiService;
