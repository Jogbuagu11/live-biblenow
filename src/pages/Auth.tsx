import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { UserCircle, Users, Eye, EyeOff } from "lucide-react";
import { auth } from "@/lib/supabase";
import { useAuthStore } from "@/lib/store";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

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
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleOAuthSignIn = async (provider: 'google' | 'apple') => {
    console.log(`[Auth Page] Starting ${provider} sign-in...`);
    setOauthLoading(provider);
    try {
      if (provider === 'google') {
        console.log('[Auth Page] Calling signInWithGoogle...');
        const { error, data } = await auth.signInWithGoogle();
        console.log('[Auth Page] Google sign-in response:', { error, data });
        if (error) {
          console.error('[Auth Page] Google sign-in error:', error);
          throw error;
        }
        console.log('[Auth Page] Google sign-in successful, redirecting...');
      } else {
        console.log('[Auth Page] Calling signInWithApple...');
        const { error, data } = await auth.signInWithApple();
        console.log('[Auth Page] Apple sign-in response:', { error, data });
        if (error) {
          console.error('[Auth Page] Apple sign-in error:', error);
          throw error;
        }
        console.log('[Auth Page] Apple sign-in successful, redirecting...');
      }
      // OAuth redirects automatically, so we don't need to navigate
    } catch (error: any) {
      console.error(`[Auth Page] ${provider} sign-in failed:`, error);
      toast.error(error.message || `Failed to sign in with ${provider}`);
      setOauthLoading(null);
    }
  };

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
        
        const { data, error } = await auth.signUp(email, password, {
          data: {
            full_name: name,
            role: selectedRole,
          },
        });
        
        if (error) throw error;
        
        // Navigate to check email page
        navigate(`/check-email?email=${encodeURIComponent(email)}`);
      } else {
        const { data, error } = await auth.signIn(email, password);
        
        if (error) throw error;
        
        if (data.user) {
          setUser(data.user);
          toast.success("Signed in successfully!");
          navigate("/home");
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
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <img 
              src="/2.png" 
              alt="TMWY Logo" 
              className="h-20 w-20 object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold text-navy">Welcome</h1>
          <div className="flex items-center justify-center gap-3">
            <span className={`text-sm font-medium transition-colors ${!isSignUp ? "text-foreground" : "text-muted-foreground"}`}>
              Sign In
            </span>
            <Switch
              checked={isSignUp}
              onCheckedChange={(checked) => {
                setAuthMode(checked ? "signup" : "signin");
                setSelectedRole(null);
              }}
            />
            <span className={`text-sm font-medium transition-colors ${isSignUp ? "text-foreground" : "text-muted-foreground"}`}>
              Sign Up
            </span>
          </div>
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
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
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

            <div className="mt-6 space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or sign in with
                  </span>
                </div>
              </div>

              {/* OAuth Buttons */}
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleOAuthSignIn('google')}
                  disabled={oauthLoading !== null}
                >
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  {oauthLoading === 'google' ? 'Signing in...' : 'Sign in with Google'}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleOAuthSignIn('apple')}
                  disabled={oauthLoading !== null}
                >
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  {oauthLoading === 'apple' ? 'Signing in...' : 'Sign in with Apple'}
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Auth;
