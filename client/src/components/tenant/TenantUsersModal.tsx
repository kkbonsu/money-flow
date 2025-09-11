import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX,
  Mail,
  Shield,
  Globe,
  Building2,
  Key,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeftRight
} from 'lucide-react';
import { format } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';

interface TenantUsersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string | null;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
  tenantAccess?: TenantAccessInfo[];
  isSuperAdmin?: boolean;
}

interface TenantAccessInfo {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  role: string;
  permissions: string[];
  isDefault: boolean;
  createdAt: string;
}

interface TenantAccessRequest {
  id: string;
  userId: string;
  tenantId: string;
  requestedRole: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export function TenantUsersModal({ open, onOpenChange, tenantId }: TenantUsersModalProps) {
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showMultiTenantAccess, setShowMultiTenantAccess] = useState(false);
  const [showAccessRequests, setShowAccessRequests] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'access-requests' | 'cross-tenant'>('users');
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    role: 'user'
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/tenant-users', tenantId],
    enabled: !!tenantId && open,
  });

  // New queries for multi-tenant access management
  const { data: accessRequests = [], isLoading: requestsLoading } = useQuery<TenantAccessRequest[]>({
    queryKey: ['/api/admin/tenant-access-requests', tenantId],
    enabled: !!tenantId && open,
  });

  const { data: allTenants = [], isLoading: tenantsLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/tenants'],
    enabled: open,
  });

  const { data: userTenantAccess, isLoading: userAccessLoading } = useQuery<TenantAccessInfo[]>({
    queryKey: ['/api/admin/user-tenant-access', selectedUserId],
    enabled: !!selectedUserId && showMultiTenantAccess,
  });

  const addUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      return await apiRequest('POST', `/api/admin/tenant-users/${tenantId}`, userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tenant-users', tenantId] });
      setShowAddUser(false);
      setNewUser({ firstName: '', lastName: '', email: '', username: '', password: '', role: 'user' });
      toast({
        title: "Success",
        description: "User added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add user",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, userData }: { userId: string; userData: any }) => {
      return await apiRequest('PATCH', `/api/admin/tenant-users/${tenantId}/${userId}`, userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tenant-users', tenantId] });
      setEditingUser(null);
      toast({
        title: "Success",
        description: "User updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest('DELETE', `/api/admin/tenant-users/${tenantId}/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tenant-users', tenantId] });
      setUserToDelete(null);
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const toggleUserStatus = (userId: string, isActive: boolean) => {
    updateUserMutation.mutate({
      userId,
      userData: { isActive: !isActive }
    });
  };

  const handleAddUser = () => {
    addUserMutation.mutate(newUser);
  };

  const handleUpdateUser = () => {
    if (editingUser) {
      updateUserMutation.mutate({
        userId: editingUser.id,
        userData: {
          firstName: editingUser.firstName,
          lastName: editingUser.lastName,
          email: editingUser.email,
          role: editingUser.role,
        }
      });
    }
  };

  const handleDeleteUser = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete);
    }
  };

  // New mutations for multi-tenant access management
  const grantTenantAccessMutation = useMutation({
    mutationFn: async ({ userId, targetTenantId, role, permissions }: { 
      userId: string; 
      targetTenantId: string; 
      role: string; 
      permissions: string[] 
    }) => {
      return await apiRequest('POST', `/api/admin/grant-tenant-access`, {
        userId,
        tenantId: targetTenantId,
        role,
        permissions
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/user-tenant-access'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tenant-users'] });
      toast({
        title: "Success",
        description: "Tenant access granted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to grant tenant access",
        variant: "destructive",
      });
    },
  });

  const revokeTenantAccessMutation = useMutation({
    mutationFn: async ({ userId, targetTenantId }: { userId: string; targetTenantId: string }) => {
      return await apiRequest('DELETE', `/api/admin/revoke-tenant-access`, {
        userId,
        tenantId: targetTenantId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/user-tenant-access'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tenant-users'] });
      toast({
        title: "Success",
        description: "Tenant access revoked successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to revoke tenant access",
        variant: "destructive",
      });
    },
  });

  const reviewAccessRequestMutation = useMutation({
    mutationFn: async ({ requestId, action, reason }: { 
      requestId: string; 
      action: 'approve' | 'reject'; 
      reason?: string 
    }) => {
      return await apiRequest('POST', `/api/admin/review-access-request/${requestId}`, {
        action,
        reason
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tenant-access-requests'] });
      toast({
        title: "Success",
        description: "Access request reviewed successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to review access request",
        variant: "destructive",
      });
    },
  });

  if (!tenantId) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Multi-Tenant User Management
            </DialogTitle>
            <DialogDescription>
              Manage users, tenant access, and approval workflows
            </DialogDescription>
          </DialogHeader>

          {/* Navigation Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'users'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              data-testid="tab-users"
            >
              <Users className="h-4 w-4 inline mr-2" />
              Users ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('access-requests')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'access-requests'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              data-testid="tab-access-requests"
            >
              <Clock className="h-4 w-4 inline mr-2" />
              Access Requests ({accessRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('cross-tenant')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'cross-tenant'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              data-testid="tab-cross-tenant"
            >
              <Globe className="h-4 w-4 inline mr-2" />
              Cross-Tenant Access
            </button>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {/* Users Tab */}
            {activeTab === 'users' && (
              <>
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{users.length}</p>
                    <p className="text-sm text-gray-500">Total Users</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {users.filter((u) => u.isActive).length}
                    </p>
                    <p className="text-sm text-gray-500">Active Users</p>
                  </div>
                </CardContent>
              </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">
                          {users.filter((u) => u.role === 'admin').length}
                        </p>
                        <p className="text-sm text-gray-500">Administrators</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

            {/* Add User Button */}
            <div className="flex justify-end">
              <Button onClick={() => setShowAddUser(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>

            {/* Users Table */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-pulse">Loading users...</div>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.firstName} {user.lastName}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            {user.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                            {user.username}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                            <Shield className="h-3 w-3 mr-1" />
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? 'default' : 'secondary'}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.lastLoginAt 
                            ? format(new Date(user.lastLoginAt), 'MMM dd, HH:mm')
                            : 'Never'
                          }
                        </TableCell>
                        <TableCell>
                          {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => setEditingUser(user)}
                                className="cursor-pointer"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => toggleUserStatus(user.id, user.isActive)}
                                className="cursor-pointer"
                              >
                                {user.isActive ? (
                                  <>
                                    <UserX className="mr-2 h-4 w-4" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => setUserToDelete(user.id)}
                                className="cursor-pointer text-red-600 dark:text-red-400"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account for this tenant
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={newUser.firstName}
                  onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={newUser.lastName}
                  onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="john.doe@example.com"
              />
            </div>
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                placeholder="john.doe"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddUser(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddUser}
                disabled={addUserMutation.isPending}
              >
                {addUserMutation.isPending ? 'Adding...' : 'Add User'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and role
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editFirstName">First Name</Label>
                  <Input
                    id="editFirstName"
                    value={editingUser.firstName}
                    onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="editLastName">Last Name</Label>
                  <Input
                    id="editLastName"
                    value={editingUser.lastName}
                    onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="editEmail">Email</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="editRole">Role</Label>
                <Select value={editingUser.role} onValueChange={(value) => setEditingUser({ ...editingUser, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingUser(null)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateUser}
                  disabled={updateUserMutation.isPending}
                >
                  {updateUserMutation.isPending ? 'Updating...' : 'Update User'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser}
              disabled={deleteUserMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteUserMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}