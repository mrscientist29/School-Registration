import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include"
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Login failed");
      } else {
        // Store user data along with authentication
        const userData = {
          username: username,
          schoolCode: data.schoolCode
        };
        login(userData);
        window.location.href = "/";
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex">
      {/* Left: Login Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center bg-white p-8">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-6">
            <img src="/logo.png" alt="Logo" className="h-16 mb-2" />
            <h2 className="font-bold text-xl mb-1 text-center">Login</h2>
            <p className="text-gray-500 text-sm text-center">Enter your credentials to access your account</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-1">Username</label>
              <Input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Password</label>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <div className="flex justify-between items-center">
              <a href="#" className="text-primary text-sm hover:underline">Forgot Password?</a>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary-dark text-white" 
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Signing in...
                </div>
              ) : (
                "Login"
              )}
            </Button>
          </form>
        </div>
      </div>
      {/* Right: Info Section */}
      <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-green-500 text-white p-8">
        <div className="max-w-md">
          <h2 className="text-3xl font-bold mb-4">Project Based Learning</h2>
          <p className="mb-6">A comprehensive platform for Project Based Learning assessment in high-stakes environments. Manage certificates, schools, students, teachers, and more from a single interface.</p>
          <div className="bg-green-600 bg-opacity-20 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Key Features</h3>
            <ul className="list-disc list-inside space-y-1 text-base">
              <li>Centralized certificate management</li>
              <li>School and student registration</li>
              <li>Teacher-student assignment</li>
              <li>Project-based assessment with rubrics</li>
              <li>Data export for analysis</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
