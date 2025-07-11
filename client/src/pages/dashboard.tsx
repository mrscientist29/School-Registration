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

const availableModules = [
  {
    id: "school-setup",
    title: "School Setup",
    icon: BookOpen,
    description: "Manage school registrations, resources, and fees. Complete school setup workflow.",
    path: "/school-setup",
    status: "active",
  },
  {
    id: "student-setup",
    title: "Student Setup",
    icon: Users,
    description: "Manage student registration, import data, and track enrollment fees.",
    path: "/student-setup",
    status: "active",
  },
];

const comingSoonModules = [
  {
    id: "class-setup",
    title: "Class Setup",
    icon: Users,
    description: "Configure classes and student groups",
    status: "coming-soon",
  },
  {
    id: "subjects-setup",
    title: "Subjects Setup",
    icon: BookMarked,
    description: "Manage subjects and curriculum",
    status: "coming-soon",
  },
  {
    id: "pbl-projects",
    title: "PBL Projects Setup",
    icon: FileText,
    description: "Configure project-based learning projects",
    status: "coming-soon",
  },
  {
    id: "rubrics-setup",
    title: "Rubrics Setup",
    icon: CheckCircle,
    description: "Configure assessment rubrics",
    status: "coming-soon",
  },
  {
    id: "scores-setup",
    title: "Scores Setup",
    icon: BarChart3,
    description: "Manage scoring and assessment",
    status: "coming-soon",
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
      <div className="flex-1 ml-0 md:ml-64">
        <Header />
        <main className="p-4 md:p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to Project Based Learning
            </h2>
            <p className="text-gray-600">
              Manage various aspects of the project-based learning process as an admin.
            </p>
          </div>

          {/* Available Modules Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Modules</h3>
            <p className="text-gray-600 mb-6">
              Start with these fully functional modules to manage your school and student data.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {availableModules.map((module) => {
                const Icon = module.icon;
                return (
                  <Card
                    key={module.id}
                    className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-primary/20"
                    onClick={() => handleModuleClick(module.path)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start mb-4">
                        <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">
                            {module.title}
                          </h4>
                          <p className="text-sm text-gray-600 mb-4">
                            {module.description}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full text-primary border-primary hover:bg-primary hover:text-white transition-colors"
                      >
                        Access Module →
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Coming Soon Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Coming Soon</h3>
            <p className="text-gray-600 mb-6">
              These modules are under development and will be available in future updates.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {comingSoonModules.map((module) => {
                const Icon = module.icon;
                return (
                  <Card
                    key={module.id}
                    className="opacity-60"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
                          <Icon className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-700">
                            {module.title}
                          </h4>
                        </div>
                        <span className="text-xs bg-gray-200 text-gray-500 px-2 py-1 rounded">
                          Soon
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {module.description}
                      </p>
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
