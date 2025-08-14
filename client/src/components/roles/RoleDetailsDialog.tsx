import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, Users, Settings, Eye } from "lucide-react";

interface Permission {
  id: number;
  name: string;
  category: string;
  description: string;
  resource: string;
  action: string;
}

interface Role {
  id: number;
  name: string;
  description: string;
  hierarchyLevel: number;
  permissions: Permission[];
}

interface RoleDetailsDialogProps {
  role: Role | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoleDetailsDialog({ role, open, onOpenChange }: RoleDetailsDialogProps) {
  if (!role) return null;

  const getRoleIcon = (hierarchyLevel: number) => {
    switch (hierarchyLevel) {
      case 1: return <Shield className="h-5 w-5 text-red-500" />;
      case 2: return <Settings className="h-5 w-5 text-orange-500" />;
      case 3: return <Users className="h-5 w-5 text-blue-500" />;
      case 4: return <Eye className="h-5 w-5 text-green-500" />;
      default: return <Shield className="h-5 w-5 text-gray-500" />;
    }
  };

  const getHierarchyLabel = (level: number) => {
    switch (level) {
      case 1: return "Super Admin";
      case 2: return "Administrator";
      case 3: return "Manager";
      case 4: return "Viewer";
      default: return "Unknown";
    }
  };

  // Group permissions by category
  const groupedPermissions = role.permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {getRoleIcon(role.hierarchyLevel)}
            <div>
              <span className="capitalize">{role.name.replace(/_/g, ' ')}</span>
              <Badge variant="outline" className="ml-2">
                Level {role.hierarchyLevel} - {getHierarchyLabel(role.hierarchyLevel)}
              </Badge>
            </div>
          </DialogTitle>
          <DialogDescription>
            {role.description || "View detailed permissions for this role"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full pr-4">
            <div className="space-y-6">
              {Object.entries(groupedPermissions).map(([category, permissions]) => (
                <div key={category} className="space-y-3">
                  <h4 className="font-semibold capitalize text-sm text-muted-foreground border-b pb-2">
                    {category.replace(/_/g, ' ')}
                  </h4>
                  <div className="grid gap-2">
                    {permissions.map((permission) => (
                      <div
                        key={permission.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {permission.action}
                            </Badge>
                            <span className="font-medium text-sm">
                              {permission.name}
                            </span>
                          </div>
                          {permission.description && (
                            <p className="text-xs text-muted-foreground">
                              {permission.description}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {permission.resource}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {Object.keys(groupedPermissions).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No permissions assigned to this role</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}