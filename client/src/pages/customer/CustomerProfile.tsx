import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Lock, 
  Edit, 
  Save,
  Shield,
  CreditCard
} from 'lucide-react';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  address: z.string().min(1, 'Address is required'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function CustomerProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const { toast } = useToast();

  const { data: customer, isLoading } = useQuery({
    queryKey: ['/api/customer/profile'],
  });

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: customer?.firstName || '',
      lastName: customer?.lastName || '',
      email: customer?.email || '',
      phone: customer?.phone || '',
      address: customer?.address || '',
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await apiRequest('PUT', '/api/customer/profile', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['/api/customer/profile'] });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormData) => {
      const response = await apiRequest('PUT', '/api/customer/password', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully.",
      });
      passwordForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update password",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Profile Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your account information and security settings
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Profile Information
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'security'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Security
            </button>
          </nav>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <Card className="glass-card slide-in-up">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Profile Information
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className="glass-button"
                >
                  {isEditing ? (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={profileForm.handleSubmit((data) => updateProfileMutation.mutate(data))}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      {...profileForm.register('firstName')}
                      disabled={!isEditing}
                      className="glass-input"
                    />
                    {profileForm.formState.errors.firstName && (
                      <p className="text-sm text-red-500">{profileForm.formState.errors.firstName.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      {...profileForm.register('lastName')}
                      disabled={!isEditing}
                      className="glass-input"
                    />
                    {profileForm.formState.errors.lastName && (
                      <p className="text-sm text-red-500">{profileForm.formState.errors.lastName.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      {...profileForm.register('email')}
                      disabled={!isEditing}
                      className="glass-input"
                    />
                    {profileForm.formState.errors.email && (
                      <p className="text-sm text-red-500">{profileForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      {...profileForm.register('phone')}
                      disabled={!isEditing}
                      className="glass-input"
                    />
                    {profileForm.formState.errors.phone && (
                      <p className="text-sm text-red-500">{profileForm.formState.errors.phone.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      {...profileForm.register('address')}
                      disabled={!isEditing}
                      className="glass-input"
                    />
                    {profileForm.formState.errors.address && (
                      <p className="text-sm text-red-500">{profileForm.formState.errors.address.message}</p>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-6 flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="glass-button bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <Card className="glass-card slide-in-up">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-blue-600" />
                  Change Password
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={passwordForm.handleSubmit((data) => updatePasswordMutation.mutate(data))}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        {...passwordForm.register('currentPassword')}
                        className="glass-input"
                      />
                      {passwordForm.formState.errors.currentPassword && (
                        <p className="text-sm text-red-500">{passwordForm.formState.errors.currentPassword.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        {...passwordForm.register('newPassword')}
                        className="glass-input"
                      />
                      {passwordForm.formState.errors.newPassword && (
                        <p className="text-sm text-red-500">{passwordForm.formState.errors.newPassword.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        {...passwordForm.register('confirmPassword')}
                        className="glass-input"
                      />
                      {passwordForm.formState.errors.confirmPassword && (
                        <p className="text-sm text-red-500">{passwordForm.formState.errors.confirmPassword.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-6">
                    <Button 
                      type="submit" 
                      className="glass-button bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      disabled={updatePasswordMutation.isPending}
                    >
                      {updatePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="glass-card slide-in-up" style={{ animationDelay: '0.1s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  Account Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Portal Access</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {customer?.isPortalActive ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Last Login</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {customer?.lastPortalLogin ? new Date(customer.lastPortalLogin).toLocaleDateString() : 'Never'}
                      </p>
                    </div>
                    <CreditCard className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}