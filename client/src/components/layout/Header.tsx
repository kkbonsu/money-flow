import { Search, Sun, Moon, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  return (
    <header className="bg-background shadow-sm border-b border-border">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search Bar */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search..."
              className="w-64 pl-10"
            />
          </div>

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
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
              <span className="text-sm font-medium">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-sm"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
