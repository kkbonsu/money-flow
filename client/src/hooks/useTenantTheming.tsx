import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tenantAwareApiRequest, createTenantAwareQueryKey } from '@/lib/queryClient';
import { useTenant } from '@/hooks/useTenant';
import { useTheme } from '@/hooks/useTheme';

interface TenantBranding {
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
    '2xl': string;
    '3xl': string;
    '4xl': string;
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
}

interface TenantThemingContextType {
  branding: TenantBranding | null;
  isLoading: boolean;
  error: string | null;
  applyBranding: (branding: TenantBranding) => void;
  resetToDefaults: () => void;
}

const defaultBranding: TenantBranding = {
  primaryColor: '#2563eb',
  secondaryColor: '#64748b',
  accentColor: '#0ea5e9',
  backgroundColor: '#ffffff',
  surfaceColor: '#f8fafc',
  textColor: '#0f172a',
  borderColor: '#e2e8f0',
  companyName: '',
  tagline: '',
  fontFamily: 'Inter',
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem'
  },
  borderRadius: {
    sm: '0.125rem',
    base: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem'
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
  },
  customCSS: ''
};

const TenantThemingContext = createContext<TenantThemingContextType | undefined>(undefined);

export function TenantThemingProvider({ children }: { children: ReactNode }) {
  const { tenant: currentTenant, tenantSlug } = useTenant();
  const { theme } = useTheme(); // Get current theme (light/dark)
  const [branding, setBranding] = useState<TenantBranding | null>(null);
  const [customStyleElement, setCustomStyleElement] = useState<HTMLStyleElement | null>(null);

  // Fetch tenant branding settings
  const { 
    data: brandingData, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: createTenantAwareQueryKey(['/api/tenant/branding']),
    queryFn: async () => {
      try {
        const response = await tenantAwareApiRequest('GET', '/api/tenant/branding');
        if (!response.ok) {
          throw new Error('Failed to fetch branding');
        }
        return await response.json();
      } catch (error) {
        console.error('Failed to fetch tenant branding:', error);
        return null;
      }
    },
    retry: 1,
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!currentTenant && !!tenantSlug,
  });

  // Update branding when data changes
  useEffect(() => {
    if (brandingData?.branding) {
      const mergedBranding = { ...defaultBranding, ...brandingData.branding };
      setBranding(mergedBranding);
      applyBrandingToDom(mergedBranding);
    } else if (currentTenant) {
      // Use default branding if no custom branding is available
      setBranding(defaultBranding);
      applyBrandingToDom(defaultBranding);
    }
  }, [brandingData, currentTenant]);

  // Update theme-aware colors when dark mode changes
  useEffect(() => {
    if (branding) {
      applyBrandingToDom(branding);
    }
  }, [theme, branding]);

  // Apply tenant branding to DOM
  const applyBrandingToDom = (brandingConfig: TenantBranding) => {
    const root = document.documentElement;
    
    // Apply CSS custom properties for colors
    const colorProperties = {
      '--tenant-primary': brandingConfig.primaryColor,
      '--tenant-secondary': brandingConfig.secondaryColor,
      '--tenant-accent': brandingConfig.accentColor,
      '--tenant-background': theme === 'dark' ? adjustColorForDarkMode(brandingConfig.backgroundColor) : brandingConfig.backgroundColor,
      '--tenant-surface': theme === 'dark' ? adjustColorForDarkMode(brandingConfig.surfaceColor) : brandingConfig.surfaceColor,
      '--tenant-text': theme === 'dark' ? adjustColorForDarkMode(brandingConfig.textColor, true) : brandingConfig.textColor,
      '--tenant-border': theme === 'dark' ? adjustColorForDarkMode(brandingConfig.borderColor) : brandingConfig.borderColor,
      
      // Update existing CSS variables to use tenant colors
      '--primary': brandingConfig.primaryColor,
      '--secondary': brandingConfig.secondaryColor,
      '--accent': brandingConfig.accentColor,
      '--background': theme === 'dark' ? adjustColorForDarkMode(brandingConfig.backgroundColor) : brandingConfig.backgroundColor,
      '--card': theme === 'dark' ? adjustColorForDarkMode(brandingConfig.surfaceColor) : brandingConfig.surfaceColor,
      '--border': theme === 'dark' ? adjustColorForDarkMode(brandingConfig.borderColor) : brandingConfig.borderColor,
      
      // Sidebar theme integration
      '--sidebar-primary': brandingConfig.primaryColor,
      '--sidebar-accent': brandingConfig.accentColor,
      '--sidebar-background': theme === 'dark' ? adjustColorForDarkMode(brandingConfig.surfaceColor) : brandingConfig.surfaceColor,
      '--sidebar-border': theme === 'dark' ? adjustColorForDarkMode(brandingConfig.borderColor) : brandingConfig.borderColor,
    };

    // Apply font family
    root.style.setProperty('--tenant-font-family', brandingConfig.fontFamily);
    root.style.setProperty('--font-sans', brandingConfig.fontFamily);

    // Apply font sizes
    Object.entries(brandingConfig.fontSizes).forEach(([size, value]) => {
      root.style.setProperty(`--tenant-font-size-${size}`, value);
    });

    // Apply border radius values
    Object.entries(brandingConfig.borderRadius).forEach(([size, value]) => {
      root.style.setProperty(`--tenant-radius-${size}`, value);
      if (size === 'base') {
        root.style.setProperty('--radius', value);
      }
    });

    // Apply shadow values
    Object.entries(brandingConfig.shadows).forEach(([size, value]) => {
      root.style.setProperty(`--tenant-shadow-${size}`, value);
    });

    // Apply all color properties
    Object.entries(colorProperties).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    // Apply custom CSS
    if (brandingConfig.customCSS) {
      applyCustomCSS(brandingConfig.customCSS);
    } else {
      removeCustomCSS();
    }

    // Update favicon if provided
    if (brandingConfig.favicon) {
      updateFavicon(brandingConfig.favicon);
    }

    // Update page title with company name
    if (brandingConfig.companyName) {
      updatePageTitle(brandingConfig.companyName);
    }
  };

  // Adjust colors for dark mode (simplified approach)
  const adjustColorForDarkMode = (color: string, isText = false): string => {
    // This is a simplified approach - in production you might want more sophisticated color adjustments
    if (isText) {
      // For text, invert lightness for dark mode
      return color === '#0f172a' ? '#f1f5f9' : color;
    }
    
    // For backgrounds, make darker versions
    if (color === '#ffffff') return '#020817';
    if (color === '#f8fafc') return '#0f172a';
    if (color === '#e2e8f0') return '#334155';
    
    return color; // Return original color for brand colors
  };

  // Apply custom CSS styles
  const applyCustomCSS = (css: string) => {
    removeCustomCSS(); // Remove existing custom styles
    
    if (css.trim()) {
      const styleElement = document.createElement('style');
      styleElement.id = 'tenant-custom-styles';
      styleElement.textContent = css;
      document.head.appendChild(styleElement);
      setCustomStyleElement(styleElement);
    }
  };

  // Remove custom CSS styles
  const removeCustomCSS = () => {
    if (customStyleElement) {
      document.head.removeChild(customStyleElement);
      setCustomStyleElement(null);
    } else {
      // Fallback: find and remove by ID
      const existingStyle = document.getElementById('tenant-custom-styles');
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
    }
  };

  // Update favicon
  const updateFavicon = (faviconUrl: string) => {
    let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = faviconUrl;
  };

  // Update page title
  const updatePageTitle = (companyName: string) => {
    const currentTitle = document.title;
    const titleParts = currentTitle.split(' | ');
    if (titleParts.length > 1) {
      // Replace the company name part
      document.title = `${titleParts[0]} | ${companyName}`;
    } else {
      // Add company name
      document.title = `${currentTitle} | ${companyName}`;
    }
  };

  // Manual branding application (for real-time preview)
  const applyBranding = (newBranding: TenantBranding) => {
    setBranding(newBranding);
    applyBrandingToDom(newBranding);
  };

  // Reset to default branding
  const resetToDefaults = () => {
    setBranding(defaultBranding);
    applyBrandingToDom(defaultBranding);
    removeCustomCSS();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      removeCustomCSS();
    };
  }, []);

  return (
    <TenantThemingContext.Provider 
      value={{ 
        branding, 
        isLoading, 
        error: error?.message || null, 
        applyBranding, 
        resetToDefaults 
      }}
    >
      {children}
    </TenantThemingContext.Provider>
  );
}

export function useTenantTheming() {
  const context = useContext(TenantThemingContext);
  if (!context) {
    throw new Error('useTenantTheming must be used within a TenantThemingProvider');
  }
  return context;
}

// Helper hook to get tenant branding info for components
export const useTenantBranding = () => {
  const { branding } = useTenantTheming();
  const { tenant: currentTenant } = useTenant();
  
  return {
    logo: branding?.logo,
    favicon: branding?.favicon,
    companyName: branding?.companyName || currentTenant?.name || '',
    tagline: branding?.tagline || '',
    primaryColor: branding?.primaryColor || defaultBranding.primaryColor,
    secondaryColor: branding?.secondaryColor || defaultBranding.secondaryColor,
    accentColor: branding?.accentColor || defaultBranding.accentColor,
    fontFamily: branding?.fontFamily || defaultBranding.fontFamily,
    loginBackgroundImage: branding?.loginBackgroundImage,
    dashboardBackgroundImage: branding?.dashboardBackgroundImage,
  };
};