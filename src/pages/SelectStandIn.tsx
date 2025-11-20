import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Heart, Languages, Book } from "lucide-react";

const standIns = [
  {
    id: 1,
    name: "Sarah Mitchell",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
    rating: 4.9,
    reviews: 127,
    specialties: ["Funerals", "Religious Ceremonies"],
    languages: ["English", "Spanish"],
    bio: "With over 5 years of experience, I bring a calm, respectful presence to every event. I understand the weight of these moments.",
    faith: "Interfaith",
    availability: "Available this week",
  },
  {
    id: 2,
    name: "Michael Chen",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    rating: 5.0,
    reviews: 94,
    specialties: ["Court Appearances", "Professional Events"],
    languages: ["English", "Mandarin"],
    bio: "Former legal professional who understands the importance of representation. Professional, discrete, and dependable.",
    faith: "Non-denominational",
    availability: "Available today",
  },
  {
    id: 3,
    name: "Emma Rodriguez",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
    rating: 4.8,
    reviews: 156,
    specialties: ["Weddings", "Family Events"],
    languages: ["English", "Portuguese"],
    bio: "I celebrate life's joyful moments with warmth and genuine care. Your happiness is my mission.",
    faith: "Christian",
    availability: "Available this week",
  },
];

const SelectStandIn = () => {
  const navigate = useNavigate();

  const handleSelect = (standInId: number) => {
    navigate(`/presence/${standInId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <button 
          onClick={() => navigate(-1)}
          className="text-navy-light hover:text-navy transition-colors mb-4 flex items-center gap-2"
        >
          ← Back
        </button>

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-semibold text-navy mb-3">
            Meet your potential stand-ins
          </h1>
          <p className="text-navy-light text-lg">
            Carefully selected individuals who will represent you with care
          </p>
        </div>

        <div className="space-y-4">
          {standIns.map((standIn) => (
            <Card key={standIn.id} className="p-6 hover:shadow-soft transition-all duration-300 border-2 border-border">
              <div className="flex flex-col md:flex-row gap-6">
                <img
                  src={standIn.image}
                  alt={standIn.name}
                  className="w-32 h-32 rounded-2xl object-cover shadow-card"
                />
                
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-semibold text-navy">{standIn.name}</h3>
                      <div className="flex items-center gap-1 text-accent">
                        <Star className="w-4 h-4 fill-accent" />
                        <span className="font-semibold">{standIn.rating}</span>
                        <span className="text-sm text-muted-foreground">({standIn.reviews})</span>
                      </div>
                    </div>
                    <p className="text-navy-light text-sm leading-relaxed">{standIn.bio}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {standIn.specialties.map((specialty) => (
                      <Badge key={specialty} variant="secondary" className="rounded-full">
                        {specialty}
                      </Badge>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-navy-light">
                      <Languages className="w-4 h-4" />
                      {standIn.languages.join(", ")}
                    </div>
                    <div className="flex items-center gap-2 text-navy-light">
                      <Book className="w-4 h-4" />
                      {standIn.faith}
                    </div>
                    <div className="flex items-center gap-2 text-accent font-medium">
                      <Heart className="w-4 h-4" />
                      {standIn.availability}
                    </div>
                  </div>

                  <Button 
                    variant="warm" 
                    className="w-full md:w-auto"
                    onClick={() => handleSelect(standIn.id)}
                  >
                    Select {standIn.name.split(" ")[0]}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SelectStandIn;
