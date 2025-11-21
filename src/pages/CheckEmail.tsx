import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const CheckEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    // Get email from URL params or localStorage
    const emailParam = searchParams.get("email");
    const storedEmail = localStorage.getItem("signup_email");
    
    if (emailParam) {
      setEmail(emailParam);
      localStorage.setItem("signup_email", emailParam);
    } else if (storedEmail) {
      setEmail(storedEmail);
    } else {
      // No email found, redirect to auth
      navigate("/auth");
    }
  }, [searchParams, navigate]);

  const handleResendEmail = async () => {
    if (!email) return;
    
    setResending(true);
    try {
      // Resend confirmation email
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth?verified=true`,
        },
      });
      
      if (error) {
        // If resend fails, it might not be available in this Supabase version
        // Show a helpful message
        console.warn("Resend not available:", error);
        throw new Error("Resend email feature may not be available. Please check your email or try signing up again.");
      }
      
      setResent(true);
      setTimeout(() => setResent(false), 5000);
    } catch (error: any) {
      console.error("Error resending email:", error);
      toast.error(error.message || "Failed to resend email. Please check your inbox or try signing up again.");
    } finally {
      setResending(false);
    }
  };

  const handleBackToSignIn = () => {
    localStorage.removeItem("signup_email");
    navigate("/auth");
  };

  if (!email) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <Card className="p-8 shadow-card">
          <div className="flex flex-col items-center space-y-6 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="w-10 h-10 text-primary" />
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">
                Check your email
              </h1>
              <p className="text-muted-foreground">
                We've sent a verification link to
              </p>
              <p className="font-semibold text-foreground break-all">
                {email}
              </p>
            </div>

            <div className="w-full space-y-4 bg-muted/50 p-4 rounded-lg">
              <div className="flex items-start gap-3 text-left">
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    Click the link in the email
                  </p>
                  <p className="text-xs text-muted-foreground">
                    This will verify your account and activate it
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-left">
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    Check your spam folder
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Sometimes verification emails end up there
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-left">
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    Link expires in 24 hours
                  </p>
                  <p className="text-xs text-muted-foreground">
                    You can request a new link if needed
                  </p>
                </div>
              </div>
            </div>

            <div className="w-full space-y-3 pt-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleResendEmail}
                disabled={resending || resent}
              >
                {resending
                  ? "Sending..."
                  : resent
                  ? "Email sent! ✓"
                  : "Resend verification email"}
              </Button>

              <Button
                variant="ghost"
                className="w-full gap-2"
                onClick={handleBackToSignIn}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </Button>
            </div>
          </div>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Already verified?{" "}
          <button
            onClick={handleBackToSignIn}
            className="text-primary hover:underline font-medium"
          >
            Sign in here
          </button>
        </p>
      </div>
    </div>
  );
};

export default CheckEmail;

