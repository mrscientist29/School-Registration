import { Link, useLocation } from "wouter";
import {
  BookOpen,
  Users,
  BookMarked,
  FileText,
  BarChart3,
  CheckCircle,
} from "lucide-react";

const navigationItems = [
  {
    href: "/school-setup",
    label: "School Setup",
    icon: BookOpen,
  },
  {
    href: "/class-setup",
    label: "Class Setup",
    icon: Users,
  },
  {
    href: "/subjects-setup",
    label: "Subjects Setup",
    icon: BookMarked,
  },
  {
    href: "/pbl-projects",
    label: "PBL Projects",
    icon: FileText,
  },
  {
    href: "/rubrics-setup",
    label: "Rubrics Setup",
    icon: CheckCircle,
  },
  {
    href: "/scores-setup",
    label: "Scores Setup",
    icon: BarChart3,
  },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 bg-white shadow-sm fixed h-full z-10">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Eb Admin</h2>
      </div>
      <nav className="mt-6">
        <div className="px-6 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link key={item.href} href={item.href}>
                <a
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </a>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
