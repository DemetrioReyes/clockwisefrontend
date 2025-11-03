import api from './api';
import { API_ENDPOINTS } from '../config/api';
import { LoginCredentials, LoginResponse, User, Business } from '../types';

class AuthService {
  // Super Admin Authentication
  async superAdminLogin(credentials: LoginCredentials): Promise<LoginResponse> {
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await api.post<LoginResponse>(
      API_ENDPOINTS.SUPER_ADMIN_LOGIN,
      formData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    return response.data;
  }

  async getSuperAdminProfile(): Promise<User> {
    const response = await api.get<User>(API_ENDPOINTS.SUPER_ADMIN_ME);
    return response.data;
  }

  // Business Authentication
  async businessLogin(credentials: LoginCredentials): Promise<LoginResponse> {
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await api.post<LoginResponse>(
      API_ENDPOINTS.BUSINESS_LOGIN,
      formData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    return response.data;
  }

  async getBusinessProfile(): Promise<Business> {
    const response = await api.get<Business>(API_ENDPOINTS.BUSINESS_ME);
    return response.data;
  }

  // Token Management
  setToken(token: string, userType: 'super_admin' | 'business'): void {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user_type', userType);
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getUserType(): string | null {
    return localStorage.getItem('user_type');
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_type');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

const authServiceInstance = new AuthService();
export default authServiceInstance;
