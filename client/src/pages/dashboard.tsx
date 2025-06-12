import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  BookOpen,
  Users,
  BookMarked,
  FileText,
  BarChart3,
  CheckCircle,
} from "lucide-react";

const quickStartModules = [
  {
    id: "school-setup",
    title: "School Setup",
    icon: BookOpen,
    description: "Manage school registrations and setup",
    path: "/school-setup",
  },
  {
    id: "class-setup",
    title: "Class Setup",
    icon: Users,
    description: "Configure classes and student groups",
    path: "/class-setup",
  },
  {
    id: "subjects-setup",
    title: "Subjects Setup",
    icon: BookMarked,
    description: "Manage subjects and curriculum",
    path: "/subjects-setup",
  },
  {
    id: "pbl-projects",
    title: "PBL Projects Setup",
    icon: FileText,
    description: "Configure project-based learning projects",
    path: "/pbl-projects",
  },
  {
    id: "scores-setup",
    title: "Scores Setup",
    icon: BarChart3,
    description: "Manage scoring and assessment",
    path: "/scores-setup",
  },
  {
    id: "rubrics-setup",
    title: "Rubrics Setup",
    icon: CheckCircle,
    description: "Configure assessment rubrics",
    path: "/rubrics-setup",
  },
];

export default function Dashboard() {
  const [, setLocation] = useLocation();

  const handleModuleClick = (path: string) => {
    setLocation(path);
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to Project Based Learning
            </h2>
            <p className="text-gray-600">
              Manage various aspects of the project-based learning process as an admin.
            </p>
          </div>

          {/* Quick Start Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Start</h3>
            <p className="text-gray-600 mb-6">
              Welcome to the Project Based Learning system. As an admin user, you can manage various aspects of the project-based learning process.
            </p>
            <p className="text-gray-600 mb-6">
              Please select one of the modules below to get started, or use the sidebar for navigation.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quickStartModules.map((module) => {
                const Icon = module.icon;
                return (
                  <Card
                    key={module.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleModuleClick(module.path)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mr-4">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900">
                          {module.title}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        {module.description}
                      </p>
                      <Button
                        variant="ghost"
                        className="text-primary hover:text-primary-dark p-0 h-auto font-medium text-sm"
                      >
                        Access Module →
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
