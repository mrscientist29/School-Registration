import { Link, useLocation } from "wouter";
import {
  BookOpen,
  Users,
  BookMarked,
  FileText,
  BarChart3,
  CheckCircle,
  FileX,
} from "lucide-react";

const navigationItems = [
  {
    href: "/",
    label: "Dashboard",
    icon: BarChart3,
  },
  {
    href: "/school-setup",
    label: "School Setup",
    icon: BookOpen,
  },
  {
    href: "/student-setup",
    label: "Student Setup",
    icon: Users,
  },
  {
    href: "/class-setup",
    label: "Class Setup",
    icon: Users,
    disabled: true,
  },
  {
    href: "/subjects-setup",
    label: "Subjects Setup",
    icon: BookMarked,
    disabled: true,
  },
  {
    href: "/pbl-projects",
    label: "PBL Projects",
    icon: FileText,
    disabled: true,
  },
  {
    href: "/rubrics-setup",
    label: "Rubrics Setup",
    icon: CheckCircle,
    disabled: true,
  },
  {
    href: "/scores-setup",
    label: "Scores Setup",
    icon: BarChart3,
    disabled: true,
  },
  {
    href: "/audit-logs",
    label: "Audit Logs",
    icon: FileX,
  },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 bg-white shadow-sm fixed h-full z-10 hidden md:block">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">PBL Admin</h2>
      </div>
      <nav className="mt-6">
        <div className="px-6 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            const isDisabled = item.disabled;
            
            if (isDisabled) {
              return (
                <div
                  key={item.href}
                  className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-400 cursor-not-allowed"
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                  <span className="ml-auto text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded">
                    Soon
                  </span>
                </div>
              );
            }
            
            return (
              <Link key={item.href} href={item.href}>
                <a
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? "text-primary bg-primary/10 border-r-2 border-primary"
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
