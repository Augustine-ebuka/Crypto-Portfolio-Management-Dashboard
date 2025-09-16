import { cn } from "./ui/utils";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { 
  PieChart, 
  TrendingUp, 
  Wallet, 
  Star, 
  Settings, 
  Menu,
  Sun,
  Moon,
  Shield
} from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export function Sidebar({ activeTab, onTabChange, darkMode, onToggleDarkMode }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { id: 'portfolio', label: 'Portfolio', icon: PieChart },
    { id: 'advanced-charts', label: 'Advanced Charts', icon: TrendingUp },
    { id: 'trading', label: 'Trading', icon: Wallet },
    { id: 'positions', label: 'All Positions', icon: Star },
    { id: 'risk-analytics', label: 'Risk Analytics', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className={cn(
      "bg-card border-r border-border h-screen flex flex-col transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        {!collapsed && (
          <div>
            <h1 className="font-bold text-lg">CryptoFolio</h1>
            <p className="text-xs text-muted-foreground">Portfolio Manager</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      {/* Portfolio Summary */}
      {!collapsed && (
        <div className="p-4 border-b border-border">
          <div className="text-sm text-muted-foreground mb-1">Total Portfolio</div>
          <div className="text-lg font-bold">$127,845.32</div>
          <div className="flex items-center space-x-1 text-xs">
            <TrendingUp className="h-3 w-3 text-green-500" />
            <span className="text-green-500">+2.34% ($2,943.21)</span>
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  collapsed && "justify-center px-2"
                )}
                onClick={() => onTabChange(item.id)}
              >
                <Icon className="h-4 w-4" />
                {!collapsed && (
                  <>
                    <span className="ml-2">{item.label}</span>
                    {item.id === 'watchlist' && (
                      <Badge variant="secondary" className="ml-auto">
                        12
                      </Badge>
                    )}
                  </>
                )}
              </Button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleDarkMode}
          className={cn(
            "w-full justify-start",
            collapsed && "justify-center"
          )}
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {!collapsed && (
            <span className="ml-2">
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}