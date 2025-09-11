export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  plan?: string;
  currency: string;
  locale: string;
  timezone: string;
  status: string;
  isActive: boolean;
  branding?: {
    logo?: string;
    favicon?: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    surfaceColor: string;
    textColor: string;
    borderColor: string;
    companyName: string;
    tagline: string;
    fontFamily: string;
    fontSizes: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      "2xl": string;
      "3xl": string;
      "4xl": string;
    };
    borderRadius: {
      sm: string;
      base: string;
      md: string;
      lg: string;
      xl: string;
    };
    shadows: {
      sm: string;
      base: string;
      md: string;
      lg: string;
      xl: string;
    };
    customCSS: string;
    loginBackgroundImage?: string;
    dashboardBackgroundImage?: string;
  };
  limits?: {
    maxLoans: number;
    maxUsers: number;
    maxStorage: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface AccessibleTenant {
  id: string;
  name: string;
  slug: string;
  role: string;
  permissions: string[];
  isDefault: boolean;
  status: string;
  lastAccessed?: string;
}

export interface TenantSwitchResponse {
  token: string;
  tenant: TenantInfo;
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
    permissions: string[];
  };
}

export interface TenantContextType {
  // Current tenant state
  currentTenant: TenantInfo | null;
  accessibleTenants: AccessibleTenant[];
  
  // Loading states
  isLoading: boolean;
  isSwitching: boolean;
  
  // Actions
  switchTenant: (tenantSlug: string) => Promise<void>;
  refreshTenants: () => Promise<void>;
  
  // Computed properties
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  isMultiTenant: boolean;
  canSwitchTenants: boolean;
  
  // Error state
  error: string | null;
  clearError: () => void;
  
  // Enhanced cache management
  invalidateCurrentTenantCache: () => void;
  clearCurrentTenantCache: () => void;
}

export interface TenantContext {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
}

export interface TenantAwareUser {
  id: number;
  username: string;
  email: string;
  role: string;
  tenantId?: string;
  isActive?: boolean;
  permissions?: string[];
}