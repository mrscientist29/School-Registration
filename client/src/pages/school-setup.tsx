import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import SchoolsList from "@/components/school/schools-list";
import DraftsList from "@/components/school/drafts-list";
import SchoolRegistrationForm from "@/components/school/school-registration-form";
import ResourcesForm from "@/components/school/resources-form";
import FeesForm from "@/components/school/fees-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

type Tab = "schools" | "register-school" | "resources" | "fees";

export default function SchoolSetup() {
  const [activeTab, setActiveTab] = useState<Tab>("schools");
  const [currentSchoolCode, setCurrentSchoolCode] = useState<string>("");
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  const tabs = [
    { id: "schools" as Tab, label: "Schools" },
    { id: "register-school" as Tab, label: "Register School" },
    { id: "resources" as Tab, label: "Resources and Support" },
    { id: "fees" as Tab, label: "Fees" },
  ];

  const handleTabChange = (tabId: Tab) => {
    setActiveTab(tabId);
  };

  const handleNextTab = (schoolCode?: string, editMode: boolean = false) => {
    if (schoolCode) {
      setCurrentSchoolCode(schoolCode);
    }
    setIsEditMode(editMode);

    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1].id);
    }
  };

  const handlePreviousTab = () => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1].id);
    }
  };

  const handleCompleteRegistration = () => {
    setActiveTab("schools");
    setCurrentSchoolCode("");
    setIsEditMode(false);
  };

  const renderTabContent = () => {
    if (activeTab === "schools") {
      return (
        <div>
          <DraftsList
            onEdit={(schoolCode) => {
              setCurrentSchoolCode(schoolCode);
              setIsEditMode(false); // Draft mode
              setActiveTab("register-school");
            }}
          />
          <SchoolsList
            onNext={(schoolCode) => {
              handleNextTab(schoolCode, true); // Registered schools = editMode = true
            }}
          />
        </div>
      );
    }

    const commonProps = {
      onNext: handleNextTab,
      onPrevious: handlePreviousTab,
      onComplete: handleCompleteRegistration,
      schoolCode: currentSchoolCode,
      isEditMode: isEditMode,
    };

    switch (activeTab) {
      case "register-school":
        return <SchoolRegistrationForm {...commonProps} />;
      case "resources":
        return <ResourcesForm {...commonProps} />;
      case "fees":
        return <FeesForm {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-0 md:ml-64">
        <Header />
        <main className="p-4 md:p-6">
          {/* Tab Navigation */}
          <div className="mb-6">
            <nav className="flex space-x-8 border-b border-gray-200">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant="ghost"
                  className={`border-b-2 rounded-none px-1 py-2 text-sm font-medium ${
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  onClick={() => handleTabChange(tab.id)}
                >
                  {tab.label}
                </Button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
}
