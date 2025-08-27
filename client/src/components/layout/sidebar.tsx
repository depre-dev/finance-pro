import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { 
  BarChart3, 
  Calculator, 
  Download, 
  Folder, 
  Receipt, 
  TrendingUp, 
  CreditCard,
  FileSpreadsheet,
  User,
  Calendar,
  LogOut
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Projects", href: "/projects", icon: Folder },
  { name: "Budget Planning", href: "/budget-planning", icon: Calculator },
  { name: "Financial Records", href: "/financial-records", icon: Receipt },
  { name: "Charge History", href: "/charge-history", icon: CreditCard },
  { name: "CATS Booking", href: "/cats-booking", icon: Calendar },
  { name: "Reports", href: "/reports", icon: TrendingUp },
  { name: "Import/Export", href: "/import-export", icon: Download },
  { name: "Uploaded Data", href: "/uploaded-data", icon: FileSpreadsheet },
];

function UserInfo() {
  const { user, logout, isLoggingOut } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!user) {
    return null;
  }

  // Get user initials for avatar
  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-3">
      <div className="flex items-center">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-foreground">{user.name}</p>
          <p className="text-xs text-neutral-50">{user.role}</p>
        </div>
      </div>
      <Separator />
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start text-neutral-50 hover:text-foreground hover:bg-neutral-10"
        onClick={handleLogout}
        disabled={isLoggingOut}
        data-testid="button-logout"
      >
        <LogOut className="mr-2 h-4 w-4" />
        {isLoggingOut ? 'Logging out...' : 'Logout'}
      </Button>
    </div>
  );
}

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-white border-r border-neutral-20 flex flex-col">
      <div className="p-6 border-b border-neutral-20">
        <h1 className="text-xl font-semibold text-foreground flex items-center">
          <BarChart3 className="text-primary mr-2 h-6 w-6" />
          FinancePro
        </h1>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <li key={item.name}>
                <Link href={item.href} className={cn(
                  "flex items-center px-3 py-2 rounded-md font-medium transition-colors",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-foreground hover:bg-neutral-10"
                )}>
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-neutral-20">
        <UserInfo />
      </div>
    </aside>
  );
}
