import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, UserCircle, Star, Calendar } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Proxy {
  proxy_id: string;
  proxy_name: string;
  avatar_url: string | null;
  bio: string | null;
  verified: boolean;
  member_since: string;
  completed_events: number;
  rating: number;
  is_active: boolean;
}

const ProxyFeed = () => {
  const navigate = useNavigate();
  const { user, currentRole } = useAuthStore();
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    // Only show proxy feed if user is in client mode
    if (currentRole !== "client") {
      navigate("/profile");
      return;
    }

    loadProxies();
  }, [user, currentRole, navigate]);

  const loadProxies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_proxy_feed", {
        p_limit: 50,
        p_offset: 0,
        p_search: searchQuery || null,
        p_min_rating: null,
      });

      if (error) throw error;
      setProxies(data || []);
    } catch (error: any) {
      console.error("Error loading proxies:", error);
      toast.error("Failed to load proxy feed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (user && currentRole === "client") {
        loadProxies();
      }
    }, 500);

    return () => clearTimeout(debounce);
  }, [searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <div className="text-muted-foreground">Loading proxy feed...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="pt-4">
          <h1 className="text-3xl font-bold text-foreground mb-2">Proxy Feed</h1>
          <p className="text-muted-foreground">
            Browse verified proxies offering their services
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search proxies by name or bio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {proxies.length === 0 ? (
            <Card className="p-8 text-center col-span-2">
              <UserCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No proxies found</p>
            </Card>
          ) : (
            proxies.map((proxy) => (
              <Card key={proxy.proxy_id} className="p-6 shadow-card hover:shadow-glow transition-shadow">
                <div className="flex items-start gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={proxy.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {proxy.proxy_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg text-foreground">
                        {proxy.proxy_name}
                      </h3>
                      {proxy.verified && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                          Verified
                        </Badge>
                      )}
                    </div>

                    {proxy.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {proxy.bio}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span>{proxy.rating.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{proxy.completed_events} events</span>
                      </div>
                    </div>

                    <Button
                      variant="warm"
                      size="sm"
                      className="w-full mt-4"
                      onClick={() => navigate(`/proxy/${proxy.proxy_id}`)}
                    >
                      View Profile
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ProxyFeed;

