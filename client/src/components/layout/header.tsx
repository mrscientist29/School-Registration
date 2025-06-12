import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { BookOpen, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <header className="bg-primary text-white shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-white rounded-full mr-3 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-lg font-semibold">Project Based Learning</h1>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm">admin</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-white hover:bg-primary-dark flex items-center text-sm">
                <span>{user?.firstName?.charAt(0) || user?.email?.charAt(0) || "A"}</span>
                <ChevronDown className="ml-1 w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleLogout}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
