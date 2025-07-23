import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  Calculator, 
  Download, 
  Folder, 
  Receipt, 
  TrendingUp, 
  CreditCard,
  User 
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Projects", href: "/projects", icon: Folder },
  { name: "Budget Planning", href: "/budget-planning", icon: Calculator },
  { name: "Financial Records", href: "/financial-records", icon: Receipt },
  { name: "Charge History", href: "/charge-history", icon: CreditCard },
  { name: "Reports", href: "/reports", icon: TrendingUp },
  { name: "Import/Export", href: "/import-export", icon: Download },
];

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
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <User className="text-primary-foreground h-4 w-4" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-foreground">John Smith</p>
            <p className="text-xs text-neutral-50">Financial Analyst</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
