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
  AlertTriangle,
  Sparkles,
  PanelLeftClose,
  PanelLeft,
  MessageSquare
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
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation, switchOrganization } = useAuth();
  // Default to open on desktop
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(true);
  // Control auto-hide feature
  const [isAutoHide, setIsAutoHide] = useState(false);
  // Control sidebar collapsed state
  const [isCollapsed, setIsCollapsed] = useState(false);
  // Mouse over control for auto-hide feature
  const [isMouseOver, setIsMouseOver] = useState(false);
  
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
    // First section - Dashboard 
    { 
      section: 'main',
      items: [
        { href: '/', icon: <LayoutDashboard className="w-5 h-5" />, text: 'Dashboard' }
      ]
    },
    // Second section - Main features
    { 
      section: 'features',
      items: [
        { href: '/map', icon: <Map className="w-5 h-5" />, text: 'Map' },
        { href: '/measure', icon: <BarChart2 className="w-5 h-5" />, text: 'Measure' },
        { href: '/manage', icon: <Settings className="w-5 h-5" />, text: 'Manage' }
      ]
    },
    // Third section - Incognito ChatGPT
    { 
      section: 'incognito',
      items: [
        { href: '/incognito-chat', icon: <MessageSquare className="w-5 h-5" />, text: 'Incognito ChatGPT' }
      ]
    }
  ];
  
  // Only show the admin link if the user has admin permissions
  const hasAdminPermission = user?.role?.permissions?.includes('admin');
  if (hasAdminPermission) {
    navItems.push({ 
      section: 'admin',
      items: [
        { href: '/admin', icon: <Shield className="w-5 h-5" />, text: 'Platform Admin' }
      ]
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
        className={cn(
          "fixed inset-y-0 left-0 z-30 overflow-y-auto bg-background border-r border-border transition-all duration-300 ease-in-out",
          isCollapsed ? "w-20" : "w-64",
          isAutoHide && !isMouseOver && !isMobileMenuOpen ? "-ml-16" : "",
          "lg:static lg:inset-0"
        )}
        onMouseEnter={() => setIsMouseOver(true)}
        onMouseLeave={() => setIsMouseOver(false)}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-6 border-b border-border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="bg-primary text-white font-bold rounded-lg p-2 flex items-center justify-center">
                <span>A<span className={cn("lowercase", isCollapsed && "hidden")}>ura</span> AI</span>
              </div>
            </div>
            {!isCollapsed && <div className="ml-2 text-xl font-bold text-foreground">Govern</div>}
          </div>
        </div>
        
        {/* Organization Selector */}
        {!isCollapsed && (
          <div className="border-b border-border">
            <div className="relative px-4 py-3">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center justify-between w-full text-sm font-medium text-left text-foreground hover:text-primary focus:outline-none">
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
        )}
        
        {/* Navigation */}
        <nav className="px-2 py-4 space-y-4 flex-grow">
          {navItems.map((section, idx) => (
            <div key={section.section} className="space-y-1">
              {/* Section navigation items */}
              {section.items.map(menuItem => (
                <div key={menuItem.href} className="w-full">
                  <Link href={menuItem.href}>
                    <div 
                      className={cn(
                        "group flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer",
                        location === menuItem.href
                          ? 'bg-muted text-primary'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                        isCollapsed && "justify-center"
                      )}
                    >
                      {menuItem.icon}
                      {!isCollapsed && <span className="truncate ml-3">{menuItem.text}</span>}
                    </div>
                  </Link>
                </div>
              ))}
              
              {/* Add separator after each section except the last one */}
              {idx < navItems.length - 1 && (
                <Separator className="my-2" />
              )}
            </div>
          ))}
        </nav>
        
        {/* Admin User, Logout and Collapse Sidebar at the bottom */}
        <div className="mt-auto border-t border-border">
          {/* Admin User info */}
          <div className={cn(
            "px-4 py-3",
            isCollapsed && "flex justify-center"
          )}>
            {!isCollapsed ? (
              <div className="flex items-center">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatarUrl || ''} alt={user?.username || ''} />
                  <AvatarFallback>
                    {user ? getInitials(`${user.firstName || ''} ${user.lastName || ''}`) || user.username?.charAt(0).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3 min-w-0 flex-1">
                  <div className="text-sm font-medium text-foreground truncate">
                    Admin User
                  </div>
                  <div className="text-xs text-muted-foreground truncate">admin@aura.ai</div>
                </div>
              </div>
            ) : (
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatarUrl || ''} alt={user?.username || ''} />
                <AvatarFallback>
                  {user ? getInitials(`${user.firstName || ''} ${user.lastName || ''}`) || user.username?.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
          
          {/* Logout */}
          <div className={cn(
            "px-2 pt-1 pb-2",
            isCollapsed && "flex justify-center"
          )}>
            {!isCollapsed ? (
              <Link href="#">
                <div 
                  className="flex items-center px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground rounded-md"
                  onClick={() => logoutMutation.mutate()}
                >
                  <LogOut className="h-5 w-5" />
                  <span className="truncate ml-3">Logout</span>
                </div>
              </Link>
            ) : (
              <div 
                className="flex items-center justify-center p-2 text-muted-foreground hover:bg-muted/50 hover:text-foreground rounded-md cursor-pointer"
                onClick={() => logoutMutation.mutate()}
              >
                <LogOut className="h-5 w-5" />
              </div>
            )}
          </div>
          
          {/* Collapse Sidebar */}
          <div className={cn(
            "px-2 pb-3",
            isCollapsed && "flex justify-center"
          )}>
            {!isCollapsed ? (
              <Link href="#">
                <div 
                  className="flex items-center px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground rounded-md"
                  onClick={() => setIsCollapsed(true)}
                >
                  <PanelLeftClose className="h-5 w-5" />
                  <span className="truncate ml-3">Collapse Sidebar</span>
                </div>
              </Link>
            ) : (
              <div 
                className="flex items-center justify-center p-2 text-muted-foreground hover:bg-muted/50 hover:text-foreground rounded-md cursor-pointer"
                onClick={() => setIsCollapsed(false)}
              >
                <PanelLeft className="h-5 w-5" />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}