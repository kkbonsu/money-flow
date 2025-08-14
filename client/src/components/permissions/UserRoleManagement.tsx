import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Users, UserCheck, UserX, Shield, Settings, Eye } from "lucide-react";
import { 
  useUsersWithRoles, 
  useRoles, 
  useAssignRole, 
  useRemoveRole,
  useCanManageUser,
  type UserWithRole 
} from "@/hooks/usePermissions";

// Separate component for user row to properly use hooks
const UserRow = ({ 
  user, 
  getRoleIcon, 
  getRoleBadgeVariant, 
  handleRemoveRole 
}: { 
  user: UserWithRole;
  getRoleIcon: (hierarchyLevel?: number) => JSX.Element;
  getRoleBadgeVariant: (hierarchyLevel?: number) => string;
  handleRemoveRole: (userId: number) => void;
}) => {
  const canManage = useCanManageUser(user.id);

  return (
    <TableRow>
      <TableCell>
        <div className="space-y-1">
          <div className="font-medium">{user.username}</div>
          <div className="text-sm text-muted-foreground">
            {user.firstName} {user.lastName}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {user.email}
      </TableCell>
      <TableCell>
        {user.roleName ? (
          <div className="flex items-center gap-2">
            {getRoleIcon(user.hierarchyLevel)}
            <span>{user.roleName}</span>
          </div>
        ) : (
          <Badge variant="outline">No Role</Badge>
        )}
      </TableCell>
      <TableCell>
        {user.hierarchyLevel ? (
          <Badge variant={getRoleBadgeVariant(user.hierarchyLevel) as any}>
            Level {user.hierarchyLevel}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {user.assignedAt ? (
          new Date(user.assignedAt).toLocaleDateString()
        ) : (
          "-"
        )}
      </TableCell>
      <TableCell>
        {user.roleName && canManage ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                Remove Role
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove Role</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove the {user.roleName} role from {user.username}? 
                  This will revoke all associated permissions.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleRemoveRole(user.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Remove Role
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <span className="text-muted-foreground text-sm">
            {!canManage ? "No permission" : "No role"}
          </span>
        )}
      </TableCell>
    </TableRow>
  );
};

export function UserRoleManagement() {
  const { data: usersWithRoles, isLoading: usersLoading } = useUsersWithRoles();
  const { data: roles, isLoading: rolesLoading } = useRoles();
  const assignRole = useAssignRole();
  const removeRole = useRemoveRole();
  const { toast } = useToast();

  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);

  if (usersLoading || rolesLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading users...</div>
        </CardContent>
      </Card>
    );
  }

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) {
      toast({
        title: "Error",
        description: "Please select both a user and a role",
        variant: "destructive",
      });
      return;
    }

    try {
      await assignRole.mutateAsync({
        userId: selectedUser,
        roleId: selectedRole,
      });

      toast({
        title: "Success",
        description: "Role assigned successfully",
      });

      setSelectedUser(null);
      setSelectedRole(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign role",
        variant: "destructive",
      });
    }
  };

  const handleRemoveRole = async (userId: number) => {
    try {
      await removeRole.mutateAsync(userId);

      toast({
        title: "Success",
        description: "Role removed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove role",
        variant: "destructive",
      });
    }
  };

  const getRoleIcon = (hierarchyLevel?: number) => {
    switch (hierarchyLevel) {
      case 1: return <Shield className="h-4 w-4 text-red-500" />;
      case 2: return <Settings className="h-4 w-4 text-orange-500" />;
      case 3: return <Users className="h-4 w-4 text-blue-500" />;
      case 4: return <Eye className="h-4 w-4 text-green-500" />;
      default: return <UserX className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadgeVariant = (hierarchyLevel?: number) => {
    switch (hierarchyLevel) {
      case 1: return "destructive";
      case 2: return "default";
      case 3: return "secondary";
      case 4: return "outline";
      default: return "outline";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          User Role Assignment
        </CardTitle>
        <CardDescription>
          Assign and manage user roles within your organization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Role Assignment Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/50">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select User</label>
            <Select value={selectedUser?.toString() || ""} onValueChange={(value) => setSelectedUser(parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a user" />
              </SelectTrigger>
              <SelectContent>
                {usersWithRoles?.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    <div className="flex items-center gap-2">
                      <span>{user.username}</span>
                      {user.roleName && (
                        <Badge variant="outline" className="text-xs">
                          {user.roleName}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Select Role</label>
            <Select value={selectedRole?.toString() || ""} onValueChange={(value) => setSelectedRole(parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a role" />
              </SelectTrigger>
              <SelectContent>
                {roles?.map((role) => (
                  <SelectItem key={role.id} value={role.id.toString()}>
                    <div className="flex items-center gap-2">
                      {getRoleIcon(role.hierarchyLevel)}
                      <span>{role.name}</span>
                      <Badge variant="outline" className="text-xs">
                        Level {role.hierarchyLevel}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button 
              onClick={handleAssignRole}
              disabled={!selectedUser || !selectedRole || assignRole.isPending}
              className="w-full"
            >
              {assignRole.isPending ? "Assigning..." : "Assign Role"}
            </Button>
          </div>
        </div>

        {/* Users Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Current Role</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersWithRoles?.map((user) => (
              <UserRow 
                key={user.id} 
                user={user} 
                getRoleIcon={getRoleIcon}
                getRoleBadgeVariant={getRoleBadgeVariant}
                handleRemoveRole={handleRemoveRole}
              />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}