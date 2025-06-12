import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Project Based Learning
          </CardTitle>
          <p className="text-gray-600 text-sm">
            Admin Dashboard
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-gray-700 text-sm">
            Welcome to the Project Based Learning administration panel. 
            Please sign in to manage school registrations and system settings.
          </p>
          <Button 
            onClick={handleLogin}
            className="w-full bg-primary hover:bg-primary-dark text-white"
          >
            Sign In with Replit
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
