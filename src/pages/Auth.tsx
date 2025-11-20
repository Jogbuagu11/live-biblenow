import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { UserCircle, Users } from "lucide-react";
import { auth } from "@/lib/supabase";
import { useAuthStore } from "@/lib/store";
import { toast } from "sonner";

type UserRole = "proxy" | "client" | null;
type AuthMode = "signin" | "signup";

const Auth = () => {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (authMode === "signup") {
        if (!selectedRole) {
          toast.error("Please select a role");
          setLoading(false);
          return;
        }
        
        const { data, error } = await auth.signUp(email, password);
        
        if (error) throw error;
        
        // Store user metadata (role, name) in Supabase user metadata
        if (data.user) {
          // You can update user metadata here if needed
          // This would typically be done via a Supabase function or API
        }
        
        toast.success("Account created! Please check your email to verify your account.");
        // Note: User will need to verify email before signing in
      } else {
        const { data, error } = await auth.signIn(email, password);
        
        if (error) throw error;
        
        if (data.user) {
          setUser(data.user);
          toast.success("Signed in successfully!");
          navigate("/profile");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const isSignUp = authMode === "signup";

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-navy">Welcome</h1>
          <p className="text-muted-foreground">
            {isSignUp ? "Create your account" : "Sign in to continue"}
          </p>
        </div>

        {isSignUp && !selectedRole && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center text-foreground">
              I want to join as a
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <Card
                className="p-6 cursor-pointer transition-all hover:shadow-glow hover:border-primary/40 group"
                onClick={() => setSelectedRole("client")}
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <UserCircle className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-foreground">Client</h3>
                    <p className="text-sm text-muted-foreground">
                      Request a stand-in for important moments
                    </p>
                  </div>
                </div>
              </Card>

              <Card
                className="p-6 cursor-pointer transition-all hover:shadow-glow hover:border-primary/40 group"
                onClick={() => setSelectedRole("proxy")}
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <Users className="w-8 h-8 text-accent" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-foreground">Proxy</h3>
                    <p className="text-sm text-muted-foreground">
                      Be present for others in meaningful ways
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {(authMode === "signin" || selectedRole) && (
          <Card className="p-6 shadow-card">
            <form onSubmit={handleAuth} className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {isSignUp && selectedRole && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Joining as:{" "}
                    <span className="font-semibold text-foreground capitalize">
                      {selectedRole}
                    </span>
                  </p>
                </div>
              )}

              <Button 
                type="submit" 
                variant="warm" 
                className="w-full" 
                size="lg"
                disabled={loading}
              >
                {loading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setAuthMode(isSignUp ? "signin" : "signup");
                  setSelectedRole(null);
                }}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {isSignUp
                  ? "Already have an account? Sign in"
                  : "Don't have an account? Sign up"}
              </button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Auth;
