import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, CheckCircle, MessageSquare, Video } from "lucide-react";

const PresenceMode = () => {
  const navigate = useNavigate();
  const { standInId } = useParams();

  const updates = [
    {
      time: "2:45 PM",
      status: "Arrived",
      message: "I've arrived at the venue. Everything looks peaceful and well-organized.",
      location: "St. Mary's Church, Downtown",
    },
    {
      time: "3:15 PM",
      status: "Check-in",
      message: "The ceremony has begun. I'm seated in the third row as requested. The atmosphere is warm and respectful.",
    },
    {
      time: "3:45 PM",
      status: "Update",
      message: "Your message was delivered to the family. They were very appreciative and send their thanks.",
    },
    {
      time: "4:20 PM",
      status: "Departing",
      message: "The ceremony has concluded beautifully. I'm heading out now. Full summary will be sent shortly.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <button 
          onClick={() => navigate("/")}
          className="text-navy-light hover:text-navy transition-colors mb-4 flex items-center gap-2"
        >
          ← Back to Home
        </button>

        <div className="mb-8">
          <Badge className="mb-3 bg-accent text-accent-foreground rounded-full px-4 py-1">
            Active Event
          </Badge>
          <h1 className="text-3xl md:text-4xl font-semibold text-navy mb-3">
            Presence Mode
          </h1>
          <p className="text-navy-light text-lg">
            Real-time updates from your stand-in
          </p>
        </div>

        <Card className="p-6 mb-6 border-2 border-primary/20 bg-gradient-glow shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-navy">Sarah Mitchell</h3>
                <p className="text-sm text-navy-light">Currently attending for you</p>
              </div>
            </div>
            <Badge variant="secondary" className="rounded-full">
              In Progress
            </Badge>
          </div>
          
          <div className="flex gap-4 text-sm">
            <Button variant="outline" size="sm" className="flex-1">
              <MessageSquare className="w-4 h-4 mr-2" />
              Message
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <Video className="w-4 h-4 mr-2" />
              Live Preview
            </Button>
          </div>
        </Card>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-navy mb-4">Event Timeline</h2>
          
          {updates.map((update, index) => (
            <Card 
              key={index} 
              className="p-5 hover:shadow-card transition-all duration-300 border-border"
            >
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                  {index < updates.length - 1 && (
                    <div className="w-0.5 flex-1 bg-primary/20 mt-2" style={{ minHeight: "40px" }} />
                  )}
                </div>
                
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs rounded-full">
                      {update.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {update.time}
                    </span>
                  </div>
                  <p className="text-navy-light mb-2 leading-relaxed">
                    {update.message}
                  </p>
                  {update.location && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {update.location}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-6 mt-8 bg-muted/30 border-border">
          <div className="text-center">
            <p className="text-navy-light mb-4">
              You'll receive a detailed summary and photos after the event concludes
            </p>
            <Button variant="outline" onClick={() => navigate("/")}>
              Return to Home
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PresenceMode;
