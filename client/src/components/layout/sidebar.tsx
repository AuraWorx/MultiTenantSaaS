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
  LogOut 
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const { data: organizations, isLoading: orgsLoading } = useQuery<Organization[]>({
    queryKey: ['/api/organizations'],
    enabled: !!user,
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard className="mr-3 h-5 w-5" /> },
    { path: '/map', label: 'Map', icon: <Map className="mr-3 h-5 w-5" /> },
    { path: '/measure', label: 'Measure', icon: <BarChart2 className="mr-3 h-5 w-5" /> },
    { path: '/manage', label: 'Manage', icon: <Settings className="mr-3 h-5 w-5" /> },
  ];

  // Only show user management for admins
  if (user?.role.name === 'Administrator') {
    menuItems.push({ 
      path: '/users', 
      label: 'User Management', 
      icon: <Users className="mr-3 h-5 w-5" /> 
    });
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 z-40 w-full bg-white border-b border-gray-200 p-4">
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:bg-gray-100 focus:text-gray-600"
        >
          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </button>
      </div>

      {/* Sidebar for desktop and mobile */}
      <div 
        className={`${
          isMobileMenuOpen ? 'fixed inset-0 z-40 block transition-opacity bg-black bg-opacity-25' : 'hidden'
        } lg:hidden`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      <div 
        className={`${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 left-0 z-30 w-64 overflow-y-auto transition duration-300 transform bg-white border-r border-gray-200 lg:translate-x-0 lg:static lg:inset-0`}
      >
        {/* Logo */}
        <div className="flex items-center justify-center h-16 px-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="bg-primary text-white font-bold rounded-lg p-2 flex items-center justify-center">
                <span>AURA AI</span>
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
                <span className="font-medium text-sm">{user?.organization.name || 'Loading...'}</span>
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
        <nav className="px-3 mt-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = location === item.path;
            return (
              <Link 
                key={item.path} 
                href={item.path}
                className={`
                  flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200
                  ${isActive 
                    ? 'bg-primary-100 text-primary border-l-3 border-primary' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}
                `}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        
        {/* User Profile */}
        <div className="absolute bottom-0 w-full border-t border-gray-200">
          <div className="relative px-4 py-3">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center w-full cursor-pointer">
                <Avatar className="w-9 h-9">
                  <AvatarImage src={user?.avatarUrl || ''} />
                  <AvatarFallback>
                    {user ? getInitials(user.firstName && user.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : user.username) 
                    : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : user?.username}
                  </p>
                  <p className="text-xs font-medium text-gray-500">{user?.role.name}</p>
                </div>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => logoutMutation.mutate()}
                  className="text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" /> 
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </>
  );
}
