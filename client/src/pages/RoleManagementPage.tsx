import { RoleManagement } from "@/components/permissions/RoleManagement";
import { useHasPermission } from "@/hooks/usePermissions";
import { Card, CardContent } from "@/components/ui/card";

export default function RoleManagementPage() {
  const canViewRoles = useHasPermission('users:view');

  if (!canViewRoles) {
    return (
      <div className="container mx-auto px-6 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              You don't have permission to access role management.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Role Management</h1>
        <p className="text-muted-foreground">
          Manage user roles and permissions within your organization
        </p>
      </div>
      
      <RoleManagement />
    </div>
  );
}