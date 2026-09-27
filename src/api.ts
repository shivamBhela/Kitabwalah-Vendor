import axios from 'axios';
import { getDeviceId } from './data';
import type {
  User,
  VendorProfileView,
  VendorEarningsView,
  VendorOrder,
  WithdrawalBalance,
  WithdrawalItem,
  ProductView,
  VendorShipment,
  PaginatedResponse,
} from './data';

export const baseURL = 'https://backend-i4kx.onrender.com';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const authData = localStorage.getItem('kb-auth-token');
  if (authData) {
    config.headers.Authorization = `Bearer ${authData}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    // Every successful response is wrapped as { success: true, data: <payload> }
    return response.data?.data !== undefined ? response.data.data : response.data;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Helper to extract the error message from the backend's two error shapes
export const errMsg = (e: any): string => {
  const m = e.response?.data?.message;
  return Array.isArray(m) ? m[0] : (m ?? e.message ?? 'Something went wrong');
};

export const vendorApi = {
  // Auth
  sendOtp: (phone: string): Promise<{ success: boolean }> =>
    api.post('/auth/otp/send', {
      phone,
      deviceId: getDeviceId(),
      purpose: 'phone_login',
    }) as unknown as Promise<{ success: boolean }>,

  verifyOtp: (phone: string, otp: string): Promise<{
    accessToken: string;
    expiresInSeconds: number;
    user: User;
    isNewUser: boolean;
  }> =>
    api.post('/auth/otp/verify', {
      phone,
      otp,
      deviceId: getDeviceId(),
      deviceName: typeof navigator !== 'undefined' ? navigator.userAgent : 'Web App',
    }) as unknown as Promise<{
      accessToken: string;
      expiresInSeconds: number;
      user: User;
      isNewUser: boolean;
    }>,

  getMe: (): Promise<User> =>
    api.get('/auth/me') as unknown as Promise<User>,

  logout: (): Promise<any> =>
    api.post('/auth/logout'),

  // Vendor Profile
  registerVendor: (data: {
    storeName: string;
    storeDescription?: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    country?: string;
  }): Promise<VendorProfileView> =>
    api.post('/vendors/register', data) as unknown as Promise<VendorProfileView>,

  getProfile: (): Promise<VendorProfileView> =>
    api.get('/vendors/profile') as unknown as Promise<VendorProfileView>,

  updateProfile: (data: {
    storeName?: string;
    storeDescription?: string;
    storeLogo?: string;
    vacationMode?: boolean;
    vacationMessage?: string;
  }): Promise<VendorProfileView> =>
    api.put('/vendors/profile', data) as unknown as Promise<VendorProfileView>,

  // Earnings
  getEarnings: (): Promise<VendorEarningsView> =>
    api.get('/vendors/earnings') as unknown as Promise<VendorEarningsView>,

  // Orders
  getOrders: (params?: { status?: string; page?: number; limit?: number }): Promise<PaginatedResponse<VendorOrder>> =>
    api.get('/vendors/orders', { params }) as unknown as Promise<PaginatedResponse<VendorOrder>>,

  updateOrderItemStatus: (
    orderId: number,
    itemId: number,
    status: 'confirmed' | 'processing'
  ): Promise<any> =>
    api.put(`/vendors/orders/${orderId}/items/${itemId}/status`, { status }),

  // Products
  getProducts: (params?: { search?: string; status?: string; page?: number; limit?: number }): Promise<PaginatedResponse<ProductView>> =>
    api.get('/vendors/products', { params }) as unknown as Promise<PaginatedResponse<ProductView>>,

  getProductById: (id: number): Promise<ProductView> =>
    api.get(`/catalog/admin/products/${id}`) as unknown as Promise<ProductView>,

  createProduct: (data: {
    title: string;
    regularPrice: string;
    salePrice?: string | null;
    sku?: string;
    author?: string;
    condition?: string;
    stockQuantity?: number;
    status?: 'draft' | 'pending_review';
    categoryIds?: number[];
  }): Promise<ProductView> =>
    api.post('/catalog/products', data) as unknown as Promise<ProductView>,

  updateProduct: (
    id: number,
    data: Partial<{
      title: string;
      regularPrice: string;
      salePrice?: string | null;
      sku?: string;
      author?: string;
      condition?: string;
      stockQuantity?: number;
      status?: 'draft' | 'pending_review';
      categoryIds?: number[];
    }>
  ): Promise<ProductView> =>
    api.put(`/catalog/products/${id}`, data) as unknown as Promise<ProductView>,

  deleteProduct: (id: number): Promise<any> =>
    api.delete(`/catalog/products/${id}`),

  updateCityPrices: (
    id: number,
    prices: { cityId: number; price: string }[]
  ): Promise<any> =>
    api.put(`/catalog/products/${id}/city-prices`, { prices }),

  // Withdrawals
  getWithdrawalBalance: (): Promise<WithdrawalBalance> =>
    api.get('/vendors/withdrawals/balance') as unknown as Promise<WithdrawalBalance>,

  getWithdrawals: (params?: { status?: string; page?: number; limit?: number }): Promise<PaginatedResponse<WithdrawalItem>> =>
    api.get('/vendors/withdrawals', { params }) as unknown as Promise<PaginatedResponse<WithdrawalItem>>,

  requestWithdrawal: (amountPaise: number): Promise<any> =>
    api.post('/vendors/withdrawals', { amountPaise }),

  // Shipments
  getShipments: (): Promise<VendorShipment[] | PaginatedResponse<VendorShipment>> =>
    api.get('/delivery/vendor/shipments') as unknown as Promise<VendorShipment[] | PaginatedResponse<VendorShipment>>,
};
