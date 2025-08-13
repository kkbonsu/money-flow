export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
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
}