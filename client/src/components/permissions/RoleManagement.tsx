import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Shield, Users, Settings, Eye } from "lucide-react";
import { useRoles, useHasPermission } from "@/hooks/usePermissions";
import { RoleDetailsDialog } from "./RoleDetailsDialog";
import { UserRoleManagement } from "./UserRoleManagement";

export function RoleManagement() {
  const { data: roles, isLoading } = useRoles();
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const canViewRoles = useHasPermission('users:view');
  const canManageRoles = useHasPermission('users:assign_roles');

  if (!canViewRoles) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            You don't have permission to view role management.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading roles...</div>
        </CardContent>
      </Card>
    );
  }

  const getRoleIcon = (hierarchyLevel: number) => {
    switch (hierarchyLevel) {
      case 1: return <Shield className="h-4 w-4 text-red-500" />;
      case 2: return <Settings className="h-4 w-4 text-orange-500" />;
      case 3: return <Users className="h-4 w-4 text-blue-500" />;
      case 4: return <Eye className="h-4 w-4 text-green-500" />;
      default: return <Shield className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadgeVariant = (hierarchyLevel: number) => {
    switch (hierarchyLevel) {
      case 1: return "destructive";
      case 2: return "default";
      case 3: return "secondary";
      case 4: return "outline";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Role Management
          </CardTitle>
          <CardDescription>
            Manage user roles and permissions within your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles?.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {getRoleIcon(role.hierarchyLevel)}
                      {role.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {role.description}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(role.hierarchyLevel)}>
                      Level {role.hierarchyLevel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {role.userCount || 0} users
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedRoleId(role.id)}
                        >
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <DialogHeader>
                          <DialogTitle>Role Details</DialogTitle>
                          <DialogDescription>
                            View role permissions and settings
                          </DialogDescription>
                        </DialogHeader>
                        {selectedRoleId && (
                          <RoleDetailsDialog roleId={selectedRoleId} />
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {canManageRoles && <UserRoleManagement />}
    </div>
  );
}