import { AuthResponse, LoginCredentials, AuthUser } from '@/types';

const API_BASE_URL = '/api';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    return response.json();
  },

  register: async (userData: {
    username: string;
    email: string;
    password: string;
    role?: string;
  }): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    return response.json();
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  },

  getStoredAuth: (): { user: AuthUser; token: string } | null => {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('auth_user');
    
    if (!token || !userStr) return null;
    
    try {
      const user = JSON.parse(userStr);
      return { user, token };
    } catch {
      return null;
    }
  },

  storeAuth: (authData: AuthResponse) => {
    localStorage.setItem('auth_token', authData.token);
    localStorage.setItem('auth_user', JSON.stringify(authData.user));
  },
};
