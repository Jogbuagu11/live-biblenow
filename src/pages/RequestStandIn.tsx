import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, Users, GraduationCap, Hospital, Scale, Church, Home, Plane, Package } from "lucide-react";

const eventTypes = [
  { id: "funeral", name: "Funeral", icon: Heart, description: "Be there to honor and remember" },
  { id: "wedding", name: "Wedding", icon: Users, description: "Share in the celebration" },
  { id: "graduation", name: "Graduation", icon: GraduationCap, description: "Witness their achievement" },
  { id: "hospital", name: "Hospital Visit", icon: Hospital, description: "Offer comfort and support" },
  { id: "court", name: "Court Appearance", icon: Scale, description: "Provide professional presence" },
  { id: "religious", name: "Religious Ceremony", icon: Church, description: "Honor spiritual moments" },
  { id: "family", name: "Family Event", icon: Home, description: "Represent you at gatherings" },
  { id: "travel", name: "Travel Companion", icon: Plane, description: "Journey together with you" },
  { id: "errand", name: "Personal Errand", icon: Package, description: "Handle what matters" },
];

const RequestStandIn = () => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const handleSelectType = (typeId: string) => {
    setSelectedType(typeId);
    // Navigate to event details page
    setTimeout(() => {
      navigate(`/event-details/${typeId}`);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <button 
            onClick={() => navigate("/")}
            className="text-navy-light hover:text-navy transition-colors mb-4 flex items-center gap-2"
          >
            ← Back
          </button>
          <h1 className="text-3xl md:text-4xl font-semibold text-navy mb-3">
            What brings you here today?
          </h1>
          <p className="text-navy-light text-lg">
            Choose the type of event where you need a trusted presence
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {eventTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Card
                key={type.id}
                className={`p-6 cursor-pointer transition-all duration-300 hover:shadow-soft border-2 ${
                  selectedType === type.id
                    ? "border-primary shadow-glow bg-primary/5"
                    : "border-border hover:border-primary/30 bg-card"
                }`}
                onClick={() => handleSelectType(type.id)}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-gradient-glow">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-navy mb-1">
                      {type.name}
                    </h3>
                    <p className="text-sm text-navy-light">
                      {type.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RequestStandIn;
