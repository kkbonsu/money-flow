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
    primaryColor: string;
    secondaryColor: string;
    companyName: string;
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