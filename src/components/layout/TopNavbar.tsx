import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Calendar, 
  Moon, 
  Sun,
  DollarSign,
  User,
  LogOut,
  Menu
} from "lucide-react";
import { useState } from "react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useDate } from "@/contexts/DateContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface TopNavbarProps {
  onMobileMenuClick?: () => void;
}

export function TopNavbar({ onMobileMenuClick }: TopNavbarProps) {
  const { currency, setCurrency } = useCurrency();
  const { selectedMonth, setSelectedMonth, getMonthOptions } = useDate();
  const { theme, setTheme, actualTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const toggleTheme = () => {
    const newTheme = actualTheme === "light" ? "dark" : "light";
    setTheme(newTheme);
  };

  const handleLogout = () => {
    logout();
    navigate("/signin");
  };


  return (
    <div className="flex items-center justify-between p-4 bg-gradient-card border-b border-border">
      {/* Mobile menu button + Month Selector */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMobileMenuClick}
          className="h-8 w-8 p-0 lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </Button>
        <Calendar className="h-5 w-5 text-muted-foreground hidden sm:flex" />
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-32 sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {getMonthOptions().map(({ value, label }) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Currency Toggle */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <Button
            variant={currency === "USD" ? "default" : "ghost"}
            size="sm"
            onClick={() => setCurrency("USD")}
            className="h-8 px-2 sm:px-3"
          >
            <DollarSign className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">USD</span>
          </Button>
          <Button
            variant={currency === "TRY" ? "default" : "ghost"}
            size="sm"
            onClick={() => setCurrency("TRY")}
            className="h-8 px-2 sm:px-3"
          >
            <span className="sm:mr-1">₺</span>
            <span className="hidden sm:inline">TRY</span>
          </Button>
        </div>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="h-8 w-8 p-0"
        >
          {actualTheme === "light" ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </Button>
        
        {/* User Menu */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}