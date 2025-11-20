import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, MapPin, Shirt, Heart, MessageSquare } from "lucide-react";

const EventDetails = () => {
  const navigate = useNavigate();
  const { eventType } = useParams();
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    location: "",
    dressCode: "",
    emotionalTone: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Navigate to stand-in selection
    navigate("/select-standin");
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <button 
          onClick={() => navigate("/request")}
          className="text-navy-light hover:text-navy transition-colors mb-4 flex items-center gap-2"
        >
          ← Back
        </button>

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-semibold text-navy mb-3">
            Tell us about your event
          </h1>
          <p className="text-navy-light text-lg">
            Share the details so we can find the perfect stand-in for you
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6 shadow-card border-border">
            <div className="space-y-5">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="date" className="flex items-center gap-2 text-navy mb-2">
                    <Calendar className="w-4 h-4" />
                    Date
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="rounded-xl border-2 focus:border-primary"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="time" className="text-navy mb-2 block">
                    Time
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="rounded-xl border-2 focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="location" className="flex items-center gap-2 text-navy mb-2">
                  <MapPin className="w-4 h-4" />
                  Location
                </Label>
                <Input
                  id="location"
                  type="text"
                  placeholder="Enter the venue address"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="rounded-xl border-2 focus:border-primary"
                />
              </div>

              <div>
                <Label htmlFor="dressCode" className="flex items-center gap-2 text-navy mb-2">
                  <Shirt className="w-4 h-4" />
                  Dress Code
                </Label>
                <Input
                  id="dressCode"
                  type="text"
                  placeholder="e.g., Formal, Business casual, All black"
                  value={formData.dressCode}
                  onChange={(e) => setFormData({ ...formData, dressCode: e.target.value })}
                  className="rounded-xl border-2 focus:border-primary"
                />
              </div>

              <div>
                <Label htmlFor="emotionalTone" className="flex items-center gap-2 text-navy mb-2">
                  <Heart className="w-4 h-4" />
                  Emotional Tone
                </Label>
                <Input
                  id="emotionalTone"
                  type="text"
                  placeholder="e.g., Quiet, Warm, Professional, Neutral"
                  value={formData.emotionalTone}
                  onChange={(e) => setFormData({ ...formData, emotionalTone: e.target.value })}
                  className="rounded-xl border-2 focus:border-primary"
                />
              </div>

              <div>
                <Label htmlFor="message" className="flex items-center gap-2 text-navy mb-2">
                  <MessageSquare className="w-4 h-4" />
                  Special Message (Optional)
                </Label>
                <Textarea
                  id="message"
                  placeholder="Any message you'd like your stand-in to deliver or remember"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="rounded-xl border-2 focus:border-primary min-h-24"
                />
              </div>
            </div>
          </Card>

          <div className="flex gap-3">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => navigate("/request")}
              className="flex-1"
            >
              Back
            </Button>
            <Button type="submit" variant="warm" className="flex-1">
              Find My Stand-In
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventDetails;
