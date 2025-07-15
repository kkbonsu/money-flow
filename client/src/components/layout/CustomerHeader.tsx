import { useState } from 'react';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { 
  User, 
  Settings, 
  LogOut, 
  ChevronDown,
  Bell,
  CreditCard
} from 'lucide-react';

export default function CustomerHeader() {
  const { customer, logout } = useCustomerAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="glass-card border-b border-gray-200/20 dark:border-gray-700/20 p-4 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-6 h-6 text-blue-600 glow-animation" />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Money Flow
            </span>
          </div>
          <div className="hidden md:block">
            <span className="text-sm text-gray-600 dark:text-gray-400">Customer Portal</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative hover:bg-white/10 dark:hover:bg-gray-800/10"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs"></span>
          </Button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 hover:bg-white/10 dark:hover:bg-gray-800/10">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="hidden md:block text-sm font-medium">
                  {customer?.firstName} {customer?.lastName}
                </span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 glass-card border-gray-200/20 dark:border-gray-700/20">
              <DropdownMenuItem className="cursor-pointer hover:bg-white/10 dark:hover:bg-gray-800/10">
                <User className="w-4 h-4 mr-2" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer hover:bg-white/10 dark:hover:bg-gray-800/10">
                <Settings className="w-4 h-4 mr-2" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer hover:bg-white/10 dark:hover:bg-gray-800/10 text-red-600"
                onClick={logout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}