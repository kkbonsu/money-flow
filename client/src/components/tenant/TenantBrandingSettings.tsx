import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantAwareApiRequest, createTenantAwareQueryKey } from '@/lib/queryClient';
import { useTenant } from '@/hooks/useTenant';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, Image, Eye, Save, RotateCcw, Palette, Type, Layout, Code } from 'lucide-react';

interface BrandingSettings {
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

const defaultBranding: BrandingSettings = {
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

const fontOptions = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Source Sans Pro', label: 'Source Sans Pro' },
  { value: 'Nunito', label: 'Nunito' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Raleway', label: 'Raleway' },
  { value: 'Manrope', label: 'Manrope' }
];

export default function TenantBrandingSettings() {
  const { tenant: currentTenant } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [brandingSettings, setBrandingSettings] = useState<BrandingSettings>(defaultBranding);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const logoFileRef = useRef<HTMLInputElement>(null);
  const faviconFileRef = useRef<HTMLInputElement>(null);
  const loginBackgroundRef = useRef<HTMLInputElement>(null);
  const dashboardBackgroundRef = useRef<HTMLInputElement>(null);

  // Fetch current branding settings
  const { data: currentBranding, isLoading } = useQuery({
    queryKey: createTenantAwareQueryKey(['/api/tenant/branding']),
    queryFn: async () => {
      const response = await tenantAwareApiRequest('GET', '/api/tenant/branding');
      return await response.json();
    },
  });

  // Update branding mutation
  const updateBrandingMutation = useMutation({
    mutationFn: async (branding: Partial<BrandingSettings>) => {
      const response = await tenantAwareApiRequest('PUT', '/api/tenant/branding', { branding });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Branding settings updated successfully'
      });
      setHasUnsavedChanges(false);
      queryClient.invalidateQueries({ 
        queryKey: createTenantAwareQueryKey(['/api/tenant/branding']) 
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update branding settings',
        variant: 'destructive'
      });
    }
  });

  // File upload mutation
  const uploadAssetMutation = useMutation({
    mutationFn: async ({ file, assetType }: { file: File; assetType: string }) => {
      const formData = new FormData();
      formData.append('brandingAsset', file);
      formData.append('assetType', assetType);
      
      const response = await tenantAwareApiRequest('POST', '/api/tenant/branding/upload', formData);
      return await response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: 'Success',
        description: `${variables.assetType} uploaded successfully`
      });
      
      // Update local state with new asset URL
      setBrandingSettings(prev => ({
        ...prev,
        [variables.assetType === 'logo' ? 'logo' : 
         variables.assetType === 'favicon' ? 'favicon' :
         variables.assetType === 'loginBackground' ? 'loginBackgroundImage' :
         'dashboardBackgroundImage']: data.assetUrl
      }));
      setHasUnsavedChanges(true);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload asset',
        variant: 'destructive'
      });
    }
  });

  const handleColorChange = (colorKey: keyof BrandingSettings, value: string) => {
    setBrandingSettings(prev => ({
      ...prev,
      [colorKey]: value
    }));
    setHasUnsavedChanges(true);
  };

  const handleInputChange = (key: keyof BrandingSettings, value: any) => {
    setBrandingSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setHasUnsavedChanges(true);
  };

  const handleFileUpload = (assetType: string) => {
    let fileRef;
    switch (assetType) {
      case 'logo': fileRef = logoFileRef; break;
      case 'favicon': fileRef = faviconFileRef; break;
      case 'loginBackground': fileRef = loginBackgroundRef; break;
      case 'dashboardBackground': fileRef = dashboardBackgroundRef; break;
      default: return;
    }
    
    fileRef.current?.click();
  };

  const handleFileSelect = (assetType: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadAssetMutation.mutate({ file, assetType });
    }
  };

  const handleSave = () => {
    updateBrandingMutation.mutate(brandingSettings);
  };

  const handleReset = () => {
    if (currentBranding?.branding) {
      setBrandingSettings({ ...defaultBranding, ...currentBranding.branding });
    } else {
      setBrandingSettings(defaultBranding);
    }
    setHasUnsavedChanges(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8" data-testid="loading-branding-settings">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl" data-testid="tenant-branding-settings">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="title-branding-settings">Branding Settings</h1>
          <p className="text-muted-foreground" data-testid="description-branding-settings">
            Customize your tenant's appearance and branding
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <Badge variant="secondary" data-testid="badge-unsaved-changes">
              Unsaved changes
            </Badge>
          )}
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
            data-testid="button-toggle-preview"
          >
            <Eye className="w-4 h-4 mr-2" />
            {previewMode ? 'Exit Preview' : 'Preview'}
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!hasUnsavedChanges}
            data-testid="button-reset-changes"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasUnsavedChanges || updateBrandingMutation.isPending}
            data-testid="button-save-branding"
          >
            {updateBrandingMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" data-testid="tab-general">
            <Layout className="w-4 h-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="colors" data-testid="tab-colors">
            <Palette className="w-4 h-4 mr-2" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="typography" data-testid="tab-typography">
            <Type className="w-4 h-4 mr-2" />
            Typography
          </TabsTrigger>
          <TabsTrigger value="advanced" data-testid="tab-advanced">
            <Code className="w-4 h-4 mr-2" />
            Advanced
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="title-company-info">Company Information</CardTitle>
              <CardDescription>Basic company details displayed across your tenant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName" data-testid="label-company-name">Company Name</Label>
                  <Input
                    id="companyName"
                    value={brandingSettings.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    placeholder="Enter company name"
                    data-testid="input-company-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tagline" data-testid="label-tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    value={brandingSettings.tagline}
                    onChange={(e) => handleInputChange('tagline', e.target.value)}
                    placeholder="Enter company tagline"
                    data-testid="input-tagline"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle data-testid="title-assets">Brand Assets</CardTitle>
              <CardDescription>Upload logos and images for your tenant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label data-testid="label-logo">Logo</Label>
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center" data-testid="preview-logo">
                        {brandingSettings.logo ? (
                          <img src={brandingSettings.logo} alt="Logo" className="w-full h-full object-contain rounded-lg" />
                        ) : (
                          <Image className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => handleFileUpload('logo')}
                        disabled={uploadAssetMutation.isPending}
                        data-testid="button-upload-logo"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Logo
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label data-testid="label-favicon">Favicon</Label>
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-muted rounded flex items-center justify-center" data-testid="preview-favicon">
                        {brandingSettings.favicon ? (
                          <img src={brandingSettings.favicon} alt="Favicon" className="w-full h-full object-contain rounded" />
                        ) : (
                          <Image className="w-3 h-3 text-muted-foreground" />
                        )}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => handleFileUpload('favicon')}
                        disabled={uploadAssetMutation.isPending}
                        data-testid="button-upload-favicon"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Favicon
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label data-testid="label-login-background">Login Background</Label>
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-10 bg-muted rounded flex items-center justify-center" data-testid="preview-login-background">
                        {brandingSettings.loginBackgroundImage ? (
                          <img src={brandingSettings.loginBackgroundImage} alt="Login Background" className="w-full h-full object-cover rounded" />
                        ) : (
                          <Image className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => handleFileUpload('loginBackground')}
                        disabled={uploadAssetMutation.isPending}
                        data-testid="button-upload-login-background"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Background
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label data-testid="label-dashboard-background">Dashboard Background</Label>
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-10 bg-muted rounded flex items-center justify-center" data-testid="preview-dashboard-background">
                        {brandingSettings.dashboardBackgroundImage ? (
                          <img src={brandingSettings.dashboardBackgroundImage} alt="Dashboard Background" className="w-full h-full object-cover rounded" />
                        ) : (
                          <Image className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => handleFileUpload('dashboardBackground')}
                        disabled={uploadAssetMutation.isPending}
                        data-testid="button-upload-dashboard-background"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Background
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="colors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="title-color-scheme">Color Scheme</CardTitle>
              <CardDescription>Customize colors for your tenant's interface</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {[
                  { key: 'primaryColor' as keyof BrandingSettings, label: 'Primary Color', description: 'Main brand color' },
                  { key: 'secondaryColor' as keyof BrandingSettings, label: 'Secondary Color', description: 'Supporting color' },
                  { key: 'accentColor' as keyof BrandingSettings, label: 'Accent Color', description: 'Highlight color' },
                  { key: 'backgroundColor' as keyof BrandingSettings, label: 'Background Color', description: 'Main background' },
                  { key: 'surfaceColor' as keyof BrandingSettings, label: 'Surface Color', description: 'Card backgrounds' },
                  { key: 'textColor' as keyof BrandingSettings, label: 'Text Color', description: 'Primary text' },
                  { key: 'borderColor' as keyof BrandingSettings, label: 'Border Color', description: 'Border and dividers' }
                ].map(({ key, label, description }) => (
                  <div key={key} className="space-y-2">
                    <Label data-testid={`label-${key}`}>{label}</Label>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-8 h-8 rounded border cursor-pointer"
                        style={{ backgroundColor: brandingSettings[key] as string }}
                        onClick={() => {
                          const input = document.getElementById(`color-${key}`) as HTMLInputElement;
                          input?.click();
                        }}
                        data-testid={`color-preview-${key}`}
                      />
                      <Input
                        id={`color-${key}`}
                        type="color"
                        value={brandingSettings[key] as string}
                        onChange={(e) => handleColorChange(key, e.target.value)}
                        className="w-16 h-8 p-0 border-0"
                        data-testid={`input-${key}`}
                      />
                      <Input
                        value={brandingSettings[key] as string}
                        onChange={(e) => handleColorChange(key, e.target.value)}
                        placeholder="#000000"
                        className="font-mono text-sm"
                        data-testid={`input-hex-${key}`}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="typography" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="title-typography">Typography Settings</CardTitle>
              <CardDescription>Configure fonts and text styling</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label data-testid="label-font-family">Font Family</Label>
                <Select
                  value={brandingSettings.fontFamily}
                  onValueChange={(value) => handleInputChange('fontFamily', value)}
                >
                  <SelectTrigger data-testid="select-font-family">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontOptions.map((font) => (
                      <SelectItem key={font.value} value={font.value} data-testid={`font-option-${font.value}`}>
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />
              
              <div className="space-y-4">
                <h4 className="font-semibold" data-testid="title-font-sizes">Font Sizes</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(brandingSettings.fontSizes).map(([size, value]) => (
                    <div key={size} className="space-y-2">
                      <Label data-testid={`label-font-size-${size}`}>{size.toUpperCase()}</Label>
                      <Input
                        value={value}
                        onChange={(e) => handleInputChange('fontSizes', {
                          ...brandingSettings.fontSizes,
                          [size]: e.target.value
                        })}
                        placeholder="1rem"
                        className="font-mono text-sm"
                        data-testid={`input-font-size-${size}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="title-custom-css">Custom CSS</CardTitle>
              <CardDescription>Add custom CSS to further customize your tenant's appearance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="customCSS" data-testid="label-custom-css">Custom CSS</Label>
                <Textarea
                  id="customCSS"
                  value={brandingSettings.customCSS}
                  onChange={(e) => handleInputChange('customCSS', e.target.value)}
                  placeholder="/* Add your custom CSS here */&#10;.custom-class {&#10;  color: red;&#10;}"
                  className="font-mono text-sm min-h-[200px]"
                  data-testid="textarea-custom-css"
                />
                <p className="text-xs text-muted-foreground">
                  Use custom CSS to add advanced styling. Be careful not to break the layout.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Hidden file inputs */}
      <input
        type="file"
        ref={logoFileRef}
        onChange={(e) => handleFileSelect('logo', e)}
        accept="image/*"
        className="hidden"
        data-testid="file-input-logo"
      />
      <input
        type="file"
        ref={faviconFileRef}
        onChange={(e) => handleFileSelect('favicon', e)}
        accept="image/*"
        className="hidden"
        data-testid="file-input-favicon"
      />
      <input
        type="file"
        ref={loginBackgroundRef}
        onChange={(e) => handleFileSelect('loginBackground', e)}
        accept="image/*"
        className="hidden"
        data-testid="file-input-login-background"
      />
      <input
        type="file"
        ref={dashboardBackgroundRef}
        onChange={(e) => handleFileSelect('dashboardBackground', e)}
        accept="image/*"
        className="hidden"
        data-testid="file-input-dashboard-background"
      />
    </div>
  );
}