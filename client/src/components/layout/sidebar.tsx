import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { 
  LayoutDashboard, 
  Map, 
  BarChart2, 
  Settings, 
  Users,
  ChevronDown,
  LogOut,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { Organization } from '@shared/schema';

export function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation, switchOrganization } = useAuth();
  // Default to open on desktop
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(true);
  
  const { data: organizations, isLoading: orgsLoading } = useQuery<Organization[]>({
    queryKey: ['/api/organizations'],
    enabled: !!user,
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };
  
  const navItems = [
    { href: '/', icon: <LayoutDashboard className="w-5 h-5" />, text: 'Dashboard' },
    { href: '/map', icon: <Map className="w-5 h-5" />, text: 'Map' },
    { href: '/measure', icon: <BarChart2 className="w-5 h-5" />, text: 'Measure' },
    { href: '/manage', icon: <Settings className="w-5 h-5" />, text: 'Manage' },
    { href: '/risk-register', icon: <AlertTriangle className="w-5 h-5" />, text: 'Risk Register' },
  ];
  
  // Only show the admin link if the user has admin permissions
  const hasAdminPermission = user?.role?.permissions?.includes('admin');
  if (hasAdminPermission) {
    navItems.push({ 
      href: '/admin', 
      icon: <Shield className="w-5 h-5" />, 
      text: 'Platform Admin' 
    });
  }
  
  return (
    <>
      {/* Mobile menu button */}
      <button
        className="p-2 text-gray-600 bg-white rounded-md lg:hidden"
        onClick={() => setIsMobileMenuOpen(true)}
      >
        <svg 
          className="w-6 h-6" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      
      {/* Overlay for mobile */}
      <div
        className={`${
          isMobileMenuOpen ? 'fixed inset-0 z-40 block transition-opacity bg-black bg-opacity-25' : 'hidden'
        } lg:hidden`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      <div 
        className="fixed inset-y-0 left-0 z-30 w-64 overflow-y-auto bg-white border-r border-gray-200 lg:static lg:inset-0"
      >
        {/* Logo */}
        <div className="flex items-center justify-center h-16 px-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="bg-primary text-white font-bold rounded-lg p-2 flex items-center justify-center">
                <span>A<span className="lowercase">ura</span> AI</span>
              </div>
            </div>
            <div className="ml-2 text-xl font-bold text-gray-900">Govern</div>
          </div>
        </div>
        
        {/* Organization Selector */}
        <div className="border-b border-gray-200">
          <div className="relative px-4 py-3">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center justify-between w-full text-sm font-medium text-left text-gray-700 hover:text-gray-900 focus:outline-none">
                <span className="font-medium text-sm">{user?.organization?.name || 'Loading...'}</span>
                <ChevronDown className="w-5 h-5 ml-1" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Switch Organization</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {orgsLoading ? (
                  <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
                ) : (
                  organizations?.map(org => (
                    <DropdownMenuItem
                      key={org.id}
                      onClick={() => switchOrganization(org.id)}
                      className="cursor-pointer"
                    >
                      {org.name}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="px-2 py-4 space-y-1">
          {navItems.map(item => (
            <div key={item.href} className="w-full">
              <Link href={item.href}>
                <div 
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer ${
                    location === item.href
                      ? 'bg-gray-100 text-primary'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {item.icon}
                  <span className="truncate ml-3">{item.text}</span>
                </div>
              </Link>
            </div>
          ))}
        </nav>
        
        {/* User menu */}
        <div className="mt-auto border-t border-gray-200">
          <div className="px-4 py-3">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.avatarUrl || ''} alt={user?.username || ''} />
                  <AvatarFallback>
                    {user ? getInitials(`${user.firstName || ''} ${user.lastName || ''}`) || user.username?.charAt(0).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user?.username || 'User'}
                </div>
                <div className="text-xs text-gray-500 truncate">{user?.email || ''}</div>
                <div className="text-xs text-gray-500 truncate">{user?.role?.name || ''}</div>
              </div>
              <div>
                <button 
                  onClick={() => logoutMutation.mutate()}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-full"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}