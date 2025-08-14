import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Shield, Save, Lock } from "lucide-react";
import { useRole, usePermissions, useUpdateRolePermissions, useHasPermission } from "@/hooks/usePermissions";

interface RoleDetailsDialogProps {
  roleId: number;
}

export function RoleDetailsDialog({ roleId }: RoleDetailsDialogProps) {
  const { data: role, isLoading: roleLoading } = useRole(roleId);
  const { data: allPermissions, isLoading: permissionsLoading } = usePermissions();
  const updateRolePermissions = useUpdateRolePermissions();
  const canManageRoles = useHasPermission('users:assign_roles');
  const { toast } = useToast();

  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize selected permissions when role data loads
  React.useEffect(() => {
    if (role?.permissions) {
      setSelectedPermissions(role.permissions.map(p => p.id));
    }
  }, [role]);

  if (roleLoading || permissionsLoading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  if (!role || !allPermissions) {
    return <div className="text-center py-4">Role not found</div>;
  }

  const handlePermissionToggle = (permissionId: number, checked: boolean) => {
    if (!canManageRoles) return;

    setSelectedPermissions(prev => {
      const newSelection = checked
        ? [...prev, permissionId]
        : prev.filter(id => id !== permissionId);
      
      const originalIds = role.permissions?.map(p => p.id) || [];
      setHasChanges(
        newSelection.length !== originalIds.length ||
        newSelection.some(id => !originalIds.includes(id))
      );
      
      return newSelection;
    });
  };

  const handleSaveChanges = async () => {
    try {
      await updateRolePermissions.mutateAsync({
        roleId: role.id,
        permissionIds: selectedPermissions,
      });
      
      toast({
        title: "Success",
        description: "Role permissions updated successfully",
      });
      
      setHasChanges(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update role permissions",
        variant: "destructive",
      });
    }
  };

  const getRoleIcon = (hierarchyLevel: number) => {
    switch (hierarchyLevel) {
      case 1: return <Shield className="h-4 w-4 text-red-500" />;
      case 2: return <Shield className="h-4 w-4 text-orange-500" />;
      case 3: return <Shield className="h-4 w-4 text-blue-500" />;
      case 4: return <Shield className="h-4 w-4 text-green-500" />;
      default: return <Shield className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Data Access': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Financial Operations': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Administrative': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Reporting': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'User Management': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Role Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getRoleIcon(role.hierarchyLevel)}
            {role.name}
          </CardTitle>
          <CardDescription>{role.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant="outline">Level {role.hierarchyLevel}</Badge>
            <Badge variant="secondary">
              {role.permissions?.length || 0} permissions
            </Badge>
            {!canManageRoles && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Read-only
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Permissions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Permissions</CardTitle>
              <CardDescription>
                Manage what this role can access and modify
              </CardDescription>
            </div>
            {canManageRoles && hasChanges && (
              <Button 
                onClick={handleSaveChanges}
                disabled={updateRolePermissions.isPending}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(allPermissions).map(([category, permissions]) => (
            <div key={category} className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={getCategoryColor(category)}>
                  {category}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {permissions.length} permissions
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {permissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="flex items-start space-x-3 p-3 rounded-lg border bg-card"
                  >
                    <Checkbox
                      id={`permission-${permission.id}`}
                      checked={selectedPermissions.includes(permission.id)}
                      disabled={!canManageRoles}
                      onCheckedChange={(checked) => 
                        handlePermissionToggle(permission.id, checked as boolean)
                      }
                    />
                    <div className="space-y-1 flex-1">
                      <label
                        htmlFor={`permission-${permission.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {permission.name}
                      </label>
                      <p className="text-xs text-muted-foreground">
                        {permission.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {permission.resource}:{permission.action}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {category !== Object.keys(allPermissions)[Object.keys(allPermissions).length - 1] && (
                <Separator />
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}