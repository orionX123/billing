
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Eye, EyeOff, User, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { login } = useAuth();
  const navigate = useNavigate();

  const demoCredentials = [
    {
      role: "Super Admin",
      email: "superadmin@system.com",
      password: "password123",
      description: "Full system access",
      icon: Shield,
      color: "text-purple-600"
    },
    {
      role: "Tenant Admin", 
      email: "admin@tenant1.com",
      password: "password123",
      description: "Tenant management & settings",
      icon: User,
      color: "text-blue-600"
    },
    {
      role: "Manager",
      email: "manager@tenant1.com", 
      password: "password123",
      description: "Store operations & reports",
      icon: User,
      color: "text-green-600"
    },
    {
      role: "Cashier",
      email: "cashier@tenant1.com",
      password: "password123", 
      description: "POS & basic operations",
      icon: User,
      color: "text-orange-600"
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const success = await login(formData);
      
      if (success) {
        toast({
          title: "Login Successful",
          description: "Welcome to IRD Billing System",
        });
        navigate("/dashboard");
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid email or password",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Login Error",
        description: "An error occurred during login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleDemoLogin = (email: string, password: string) => {
    setFormData({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Login Form */}
        <Card className="shadow-lg bg-gradient-card">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-primary">
                <FileText className="w-8 h-8 text-white" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">IRD Billing System</CardTitle>
              <CardDescription>
                Sign in to your account to access the billing dashboard
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <Card className="shadow-lg bg-gradient-card">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Demo Accounts</CardTitle>
            <CardDescription>
              Click any credential below to auto-fill the login form
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {demoCredentials.map((cred, index) => {
              const IconComponent = cred.icon;
              return (
                <div
                  key={index}
                  className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleDemoLogin(cred.email, cred.password)}
                >
                  <div className="flex items-center gap-3">
                    <IconComponent className={`w-5 h-5 ${cred.color}`} />
                    <div className="flex-1">
                      <div className="font-medium">{cred.role}</div>
                      <div className="text-sm text-muted-foreground">{cred.description}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {cred.email}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            <div className="mt-4 p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">
                All demo accounts use password: <strong>password123</strong>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
