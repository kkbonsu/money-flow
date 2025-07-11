import { Sun, Moon, Menu, User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { user: authUser, logout } = useAuth();
  const [, setLocation] = useLocation();
  
  // Get fresh user data including profile picture
  const { data: user } = useQuery({
    queryKey: ['/api/users/profile'],
    enabled: !!authUser, // Only run if user is authenticated
  });

  return (
    <header className="bg-background shadow-sm border-b border-border">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
          >
            {theme === 'light' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 p-2 h-auto">
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={user?.profilePicture ? `/uploads/${user.profilePicture}` : undefined} 
                    alt={user?.username || authUser?.username || 'User'} 
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user?.firstName?.[0] || user?.username?.charAt(0).toUpperCase() || authUser?.username?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : user?.username || authUser?.username}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || authUser?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setLocation('/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
