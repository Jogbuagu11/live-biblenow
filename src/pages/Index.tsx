import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserPlus, MapPin, MessageSquare, Calendar } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import heroBackground from "@/assets/hero-background.jpg";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuthStore();

  useEffect(() => {
    // Redirect authenticated users to home page
    if (!loading && user) {
      navigate("/home", { replace: true });
    }
  }, [user, loading, navigate]);

  const mainActions = [
    {
      icon: UserPlus,
      title: "Request a Proxy",
      description: "Find someone to be there for you",
      action: () => navigate("/request"),
      variant: "warm" as const,
    },
    {
      icon: MapPin,
      title: "Track My Proxy",
      description: "See real-time updates",
      action: () => navigate("/presence/1"),
      variant: "soft" as const,
    },
    {
      icon: MessageSquare,
      title: "Messages",
      description: "Chat with your proxy",
      action: () => {},
      variant: "outline" as const,
    },
    {
      icon: Calendar,
      title: "Upcoming Events",
      description: "View your scheduled events",
      action: () => {},
      variant: "outline" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Hero Section */}
      <div 
        className="relative h-[50vh] flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `url(${heroBackground})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-navy/40 via-navy/60 to-background" />
        <div className="absolute top-4 right-4 z-20">
          <Button variant="outline" onClick={() => navigate("/auth")} className="text-white border-white/40 hover:bg-white/10">
            Sign In
          </Button>
        </div>
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <div className="mb-6 flex justify-center">
            <img 
              src="/2.png" 
              alt="TMWY Logo" 
              className="h-16 w-16 md:h-20 md:w-20 object-contain drop-shadow-lg"
            />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-lg">
            Where do you need us to be for you?
          </h1>
          <p className="text-lg md:text-xl text-white/90 font-light">
            Trusted companions for life's important moments
          </p>
        </div>
      </div>

      {/* Main Actions */}
      <div className="container max-w-5xl mx-auto px-4 -mt-16 relative z-20 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {mainActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Card
                key={index}
                className="p-6 cursor-pointer transition-all duration-300 hover:shadow-soft border-2 border-border hover:border-primary/30 bg-card group"
                onClick={action.action}
              >
                <div className="flex items-start gap-4">
                  <div className="p-4 rounded-2xl bg-gradient-glow group-hover:shadow-glow transition-all duration-300">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-navy mb-1 group-hover:text-primary transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-navy-light">
                      {action.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* About Section */}
        <Card className="p-8 text-center shadow-card border-border bg-card/50 backdrop-blur-sm">
          <h2 className="text-2xl font-semibold text-navy mb-4">
            We're there when you can't be
          </h2>
          <p className="text-navy-light max-w-2xl mx-auto leading-relaxed mb-6">
            Life moves fast, and sometimes you can't be everywhere at once. 
            Whether it's a funeral, wedding, court date, or hospital visit, 
            we connect you with compassionate proxies who show up with care.
          </p>
          <Button variant="warm" size="lg" onClick={() => navigate("/request")}>
            Get Started
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default Index;
