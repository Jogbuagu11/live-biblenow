import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Calendar, DollarSign, CheckCircle2, XCircle, ArrowUpDown, Navigation } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { format } from "date-fns";

interface Request {
  event_id: string;
  title: string;
  event_type: string;
  description: string | null;
  location_city: string | null;
  location_state: string | null;
  location_country: string | null;
  location_address: string | null;
  event_zip_code: string | null;
  start_time: string;
  end_time: string | null;
  budget_cents: number | null;
  currency: string;
  rate_type: "free" | "listed" | "negotiable" | null;
  status: string;
  requested_at: string;
  client_id: string;
  client_name: string;
  client_avatar: string | null;
  client_verified: boolean;
  has_responded: boolean;
  response_status: string | null;
  invited_count: number;
  accepted_count: number;
  distance_km: number | null;
}

const RequestFeed = () => {
  const navigate = useNavigate();
  const { user, currentRole } = useAuthStore();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("city_date"); // Default: city first, then date

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    // Only show request feed if user is in proxy mode
    if (currentRole !== "proxy") {
      navigate("/profile");
      return;
    }

    loadRequests();
  }, [user, currentRole, navigate]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_request_feed", {
        p_limit: 50,
        p_offset: 0,
        p_event_type: eventTypeFilter === "all" ? null : eventTypeFilter,
        p_location_city: null,
        p_location_state: null,
        p_min_budget_cents: null,
        p_sort_by: sortBy,
      });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      console.error("Error loading requests:", error);
      toast.error("Failed to load request feed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && currentRole === "proxy") {
      loadRequests();
    }
  }, [eventTypeFilter, sortBy]);

  const handleRespond = async (eventId: string, response: "accept" | "decline") => {
    try {
      const { error } = await supabase.rpc("respond_to_proxy_request", {
        p_event_id: eventId,
        p_response: response,
      });

      if (error) throw error;

      toast.success(
        response === "accept"
          ? "Request accepted! The client will be notified."
          : "Request declined."
      );

      // Reload requests
      loadRequests();
    } catch (error: any) {
      console.error("Error responding to request:", error);
      toast.error(error.message || "Failed to respond to request");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <div className="text-muted-foreground">Loading request feed...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="pt-4">
          <h1 className="text-3xl font-bold text-foreground mb-2">Request Feed</h1>
          <p className="text-muted-foreground">
            Browse client requests for stand-in services
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="funeral">Funeral</SelectItem>
                <SelectItem value="wedding">Wedding</SelectItem>
                <SelectItem value="court">Court</SelectItem>
                <SelectItem value="hospital">Hospital</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="city_date">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>City, then Date</span>
                  </div>
                </SelectItem>
                <SelectItem value="distance">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4" />
                    <span>Closest to Me</span>
                  </div>
                </SelectItem>
                <SelectItem value="date">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Soonest Date</span>
                  </div>
                </SelectItem>
                <SelectItem value="event_type">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4" />
                    <span>Event Type</span>
                  </div>
                </SelectItem>
                <SelectItem value="city">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>City</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          {requests.length === 0 ? (
            <Card className="p-8 text-center">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No requests found</p>
            </Card>
          ) : (
            requests.map((request) => (
              <Card key={request.event_id} className="p-6 shadow-card">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-semibold text-foreground">
                          {request.title}
                        </h3>
                        <Badge variant="secondary" className="capitalize">
                          {request.event_type}
                        </Badge>
                      </div>
                      {request.description && (
                        <p className="text-muted-foreground mb-3">
                          {request.description}
                        </p>
                      )}
                    </div>
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={request.client_avatar || undefined} />
                      <AvatarFallback>
                        {request.client_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <div className="flex flex-col">
                        <span>
                          {[request.location_city, request.location_state]
                            .filter(Boolean)
                            .join(", ") || "Location TBD"}
                        </span>
                        {request.event_zip_code && (
                          <span className="text-xs">{request.event_zip_code}</span>
                        )}
                      </div>
                    </div>
                    {request.distance_km !== null && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Navigation className="w-4 h-4" />
                        <span>
                          {request.distance_km < 1
                            ? `${Math.round(request.distance_km * 1000)}m`
                            : `${request.distance_km.toFixed(1)}km`}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {format(new Date(request.start_time), "MMM d, yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="w-4 h-4" />
                      <span>
                        {request.rate_type === "free" ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            Free
                          </Badge>
                        ) : request.rate_type === "negotiable" ? (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                            Negotiable
                          </Badge>
                        ) : request.budget_cents ? (
                          `$${(request.budget_cents / 100).toLocaleString()}`
                        ) : (
                          "Not specified"
                        )}
                      </span>
                    </div>
                    <div className="text-muted-foreground">
                      {request.accepted_count} accepted
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Requested by {request.client_name}
                      </span>
                      {request.client_verified && (
                        <Badge variant="secondary" className="text-xs">
                          Verified
                        </Badge>
                      )}
                    </div>
                    {request.has_responded ? (
                      <div className="flex items-center gap-2">
                        {request.response_status === "accepted" ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                            <span className="text-sm text-green-600">Accepted</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-red-500" />
                            <span className="text-sm text-red-600">Declined</span>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRespond(request.event_id, "decline")}
                        >
                          Decline
                        </Button>
                        <Button
                          variant="warm"
                          size="sm"
                          onClick={() => handleRespond(request.event_id, "accept")}
                        >
                          Accept
                        </Button>
                      </div>
                    )}
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

export default RequestFeed;

