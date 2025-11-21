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
    priceType: "free" as "free" | "paid" | "negotiable",
    priceAmount: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      formData.priceType === "paid" &&
      (!formData.priceAmount || Number(formData.priceAmount) <= 0)
    ) {
      alert("Please enter a valid payment amount for paid requests.");
      return;
    }
    // Navigate to proxy selection
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
            Share the details so we can find the perfect proxy for you
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
                  placeholder="Any message you'd like your proxy to deliver or remember"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="rounded-xl border-2 focus:border-primary min-h-24"
                />
              </div>

              <div>
                <Label className="text-navy mb-2 block">Pricing</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Let proxies know if the request is paid or volunteer-based.
                </p>
                <div className="grid gap-3 md:grid-cols-3">
                  {["free", "paid", "negotiable"].map((option) => (
                    <label
                      key={option}
                      className={`border rounded-xl px-4 py-3 cursor-pointer flex items-center gap-3 transition ${formData.priceType === option ? "border-primary bg-primary/5" : "border-border"}`}
                    >
                      <input
                        type="radio"
                        name="priceType"
                        value={option}
                        checked={formData.priceType === option}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            priceType: e.target.value as "free" | "paid" | "negotiable",
                          })
                        }
                        className="accent-primary"
                      />
                      <span className="capitalize">
                        {option === "paid" ? "Paid (set amount)" : option}
                      </span>
                    </label>
                  ))}
                </div>

                {formData.priceType === "paid" && (
                  <div className="mt-4">
                    <Label htmlFor="priceAmount" className="text-navy mb-2 block">
                      Payment Amount (USD)
                    </Label>
                    <Input
                      id="priceAmount"
                      type="number"
                      min="1"
                      step="1"
                      placeholder="e.g., 150"
                      value={formData.priceAmount}
                      onChange={(e) => setFormData({ ...formData, priceAmount: e.target.value })}
                      required
                      className="rounded-xl border-2 focus:border-primary"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This amount will be shown to proxies when they review your request.
                    </p>
                  </div>
                )}
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
              Find My Proxy
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventDetails;
