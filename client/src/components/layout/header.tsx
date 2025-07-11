import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { BookOpen, ChevronDown, Menu, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useLocation } from "wouter";

const navigationItems = [
  { href: "/", label: "Dashboard" },
  { href: "/school-setup", label: "School Setup" },
  { href: "/student-setup", label: "Student Setup" },
];

export default function Header() {
  const { user, logout, isLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      <header className="bg-primary text-white shadow-sm relative">
        <div className="flex items-center justify-between px-4 md:px-6 py-4">
          <div className="flex items-center">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden mr-2 text-white hover:bg-white/20"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            
            <div className="w-8 h-8 bg-white rounded-full mr-3 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-lg font-semibold hidden sm:block">Project Based Learning</h1>
            <h1 className="text-lg font-semibold sm:hidden">PBL</h1>
          </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            <span className="font-medium">{user?.username || "admin"}</span>
            {user?.schoolCode && (
              <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded">
                {user.schoolCode}
              </span>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="text-white hover:bg-primary-dark flex items-center text-sm"
                disabled={isLoading}
              >
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-2">
                  <span className="text-sm font-medium text-white">
                    {user?.username?.charAt(0)?.toUpperCase() || "A"}
                  </span>
                </div>
                <ChevronDown className="ml-1 w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleLogout} disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-500"></div>
                    Signing out...
                  </div>
                ) : (
                  "Logout"
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-primary border-t border-white/20 z-50">
          <nav className="px-4 py-2">
            {navigationItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <a
                    className={`block px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
    </>
  );
}
