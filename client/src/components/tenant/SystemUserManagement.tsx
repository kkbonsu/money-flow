import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Search, 
  Filter, 
  UserPlus, 
  MoreHorizontal, 
  Edit, 
  Shield, 
  Building2,
  Mail,
  Phone,
  Clock,
  UserCheck,
  UserX,
  Settings
} from 'lucide-react';

interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  tenantId: string;
  tenantName: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface SearchResults {
  users: User[];
  tenants: any[];
  customers: any[];
  loans: any[];
  totalFound: number;
}

export function SystemUserManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const { toast } = useToast();

  // Search functionality
  const { data: searchResults, isLoading: searchLoading } = useQuery<SearchResults>({
    queryKey: ['/api/admin/search', { q: searchQuery, type: searchType, limit: 100 }],
    enabled: searchQuery.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Get all users across tenants
  const { data: allUsersData, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/search', { q: '', type: 'users', limit: 1000 }],
    staleTime: 60 * 1000, // 1 minute
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ tenantId, userId, data }: { tenantId: string; userId: number; data: any }) =>
      apiRequest('PATCH', `/api/admin/tenant-users/${tenantId}/${userId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/search'] });
      toast({ title: "Success", description: "User updated successfully" });
      setShowUserModal(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: ({ tenantId, userId, isActive }: { tenantId: string; userId: number; isActive: boolean }) =>
      apiRequest('PATCH', `/api/admin/tenant-users/${tenantId}/${userId}`, { isActive: !isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/search'] });
      toast({ 
        title: "Success", 
        description: "User status updated successfully" 
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user status",
        variant: "destructive",
      });
    },
  });

  const displayUsers = searchQuery.length >= 2 
    ? searchResults?.users || [] 
    : allUsersData?.users || [];

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const UserDetailsModal = ({ user, isOpen, onClose }: { user: User | null; isOpen: boolean; onClose: () => void; }) => {
    const [editData, setEditData] = useState({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      role: user?.role || 'user'
    });

    const handleSave = () => {
      if (!user) return;
      updateUserMutation.mutate({
        tenantId: user.tenantId,
        userId: user.id,
        data: editData
      });
    };

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl" data-testid="modal-user-details">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              User Details - {user?.username}
            </DialogTitle>
          </DialogHeader>
          
          {user && (
            <div className="space-y-6">
              {/* User Info Summary */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tenant</label>
                  <p className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {user.tenantName}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <Badge variant={user.isActive ? 'default' : 'destructive'} className="mt-1">
                    {user.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {formatDate(user.createdAt)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Login</label>
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {formatDate(user.lastLogin)}
                  </p>
                </div>
              </div>

              {/* Editable Fields */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">First Name</label>
                    <Input
                      value={editData.firstName}
                      onChange={(e) => setEditData(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Last Name</label>
                    <Input
                      value={editData.lastName}
                      onChange={(e) => setEditData(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Last name"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    value={editData.email}
                    onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Email address"
                    type="email"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Role</label>
                  <Select value={editData.role} onValueChange={(value) => setEditData(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between pt-4 border-t">
                <Button
                  variant={user.isActive ? "destructive" : "default"}
                  onClick={() => toggleUserStatusMutation.mutate({ tenantId: user.tenantId, userId: user.id, isActive: user.isActive })}
                  disabled={toggleUserStatusMutation.isPending}
                >
                  {user.isActive ? <UserX className="h-4 w-4 mr-2" /> : <UserCheck className="h-4 w-4 mr-2" />}
                  {user.isActive ? 'Deactivate' : 'Activate'} User
                </Button>
                
                <div className="space-x-2">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={updateUserMutation.isPending}>
                    {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6" data-testid="system-user-management">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="h-6 w-6" />
            System-Wide User Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400">Manage users across all tenants</p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by username, email, or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
                data-testid="input-user-search"
              />
            </div>
            <Select value={searchType} onValueChange={setSearchType}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="users">Users Only</SelectItem>
                <SelectItem value="tenants">Tenants</SelectItem>
                <SelectItem value="customers">Customers</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">All Users</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="bulk-actions">Bulk Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>User Directory ({displayUsers.length} users)</span>
                {(searchLoading || usersLoading) && (
                  <Badge variant="secondary" className="animate-pulse">Loading...</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayUsers.map((user) => (
                      <TableRow key={`${user.tenantId}-${user.id}`} data-testid={`row-user-${user.id}`}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">{user.username}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </p>
                            {(user.firstName || user.lastName) && (
                              <p className="text-xs text-muted-foreground">
                                {user.firstName} {user.lastName}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{user.tenantName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? 'default' : 'destructive'}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(user.createdAt)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(user.lastLogin)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserModal(true);
                            }}
                            data-testid={`button-edit-user-${user.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {displayUsers.length === 0 && !searchLoading && !usersLoading && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <h3 className="font-medium">No Users Found</h3>
                    <p className="text-sm text-muted-foreground">
                      {searchQuery ? 'Try adjusting your search criteria' : 'No users available'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90">
              <CardHeader>
                <CardTitle className="text-sm">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{allUsersData?.users?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Across all tenants</p>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90">
              <CardHeader>
                <CardTitle className="text-sm">Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {allUsersData?.users?.filter((u: User) => u.isActive).length || 0}
                </div>
                <p className="text-xs text-muted-foreground">Currently active</p>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90">
              <CardHeader>
                <CardTitle className="text-sm">Admin Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {allUsersData?.users?.filter((u: User) => u.role === 'admin').length || 0}
                </div>
                <p className="text-xs text-muted-foreground">Administrative access</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bulk-actions" className="space-y-4">
          <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90">
            <CardHeader>
              <CardTitle>Bulk Operations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-medium">Bulk Operations</h3>
                <p className="text-sm text-muted-foreground">
                  Bulk user management operations will be available here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Details Modal */}
      <UserDetailsModal
        user={selectedUser}
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false);
          setSelectedUser(null);
        }}
      />
    </div>
  );
}