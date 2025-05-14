import { useState } from 'react';
import { Bell } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface TopNavbarProps {
  title: string;
}

export function TopNavbar({ title }: TopNavbarProps) {
  const [notifications, setNotifications] = useState([
    { id: 1, message: 'New AI system registered', time: '2h ago' },
    { id: 2, message: 'Compliance issue detected', time: '1d ago' },
  ]);

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-background border-b border-border">
      <button 
        className="px-4 border-r border-border text-muted-foreground focus:outline-none focus:bg-muted focus:text-foreground lg:hidden"
      >
        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      </button>
      
      <div className="flex-1 px-4 flex justify-between">
        <div className="flex-1 flex items-center">
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        </div>
        
        <div className="ml-4 flex items-center md:ml-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex justify-between items-center">
                <span>Notifications</span>
                {notifications.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearNotifications}
                    className="text-xs"
                  >
                    Clear all
                  </Button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length > 0 ? (
                notifications.map(notification => (
                  <DropdownMenuItem key={notification.id} className="py-2">
                    <div>
                      <p className="text-sm font-medium">{notification.message}</p>
                      <p className="text-xs text-muted-foreground">{notification.time}</p>
                    </div>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  No new notifications
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
