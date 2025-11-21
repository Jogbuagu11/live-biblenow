import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Edit2,
  UserCircle,
  Users,
  Search,
  Bell,
  Camera,
  Calendar,
  Star,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { uploadProfilePhoto, uploadCoverPhoto } from "@/lib/storage";
import { Reviews } from "@/components/Reviews";
import { StarRating } from "@/components/StarRating";

const Profile = () => {
  const navigate = useNavigate();
  const {
    user,
    profile,
    currentRole,
    availableRoles,
    setCurrentRole,
    signOut,
    refreshProfile,
    loading,
  } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({
    completedEvents: 0,
    averageRating: 0,
    reviewCount: 0,
  });
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    bio: "",
    location_city: "",
    location_state: "",
    zip_code: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverPhotoFile, setCoverPhotoFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPhotoPreview, setCoverPhotoPreview] = useState<string | null>(null);
  const [showVerifyBanner, setShowVerifyBanner] = useState(false);
  const [startingVerification, setStartingVerification] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }

    if (profile) {
      setFormData({
        name: profile.full_name || "",
        phone: profile.phone || "",
        bio: profile.bio || "",
        location_city: profile.location_city || "",
        location_state: profile.location_state || "",
        zip_code: profile.zip_code || "",
      });
    }

    if (user && currentRole === "proxy") {
      loadProxyStats();
    }

    setShowVerifyBanner(Boolean(profile && currentRole === "proxy" && !profile.verified));
  }, [user, profile, loading, navigate, currentRole]);

  const loadProxyStats = async () => {
    if (!user) return;

    try {
      // Get completed events count
      const { data: eventsData, error: eventsError } = await supabase
        .from("event_assignments")
        .select("event_id", { count: "exact", head: true })
        .eq("stand_in_id", user.id)
        .eq("status", "completed");

      if (!eventsError) {
        setStats((prev) => ({
          ...prev,
          completedEvents: eventsData?.length || 0,
        }));
      }

      // Get average rating
      const { data: ratingData, error: ratingError } = await supabase.rpc(
        "get_proxy_rating",
        { p_proxy_id: user.id }
      );

      if (!ratingError && ratingData !== null) {
        setStats((prev) => ({
          ...prev,
          averageRating: Number(ratingData),
        }));
      }

      // Get review count
      const { data: countData, error: countError } = await supabase.rpc(
        "get_proxy_review_count",
        { p_proxy_id: user.id }
      );

      if (!countError && countData !== null) {
        setStats((prev) => ({
          ...prev,
          reviewCount: Number(countData),
        }));
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleRoleSwitch = async (role: "client" | "proxy") => {
    try {
      await setCurrentRole(role);
      toast.success(`Switched to ${role} mode`);
      if (role === "proxy") {
        loadProxyStats();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to switch role");
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      let newAvatarUrl = profile?.avatar_url;
      if (avatarFile) {
        newAvatarUrl = await uploadProfilePhoto(user.id, avatarFile);
      }

      let newCoverPhotoUrl = profile?.cover_photo_url;
      if (coverPhotoFile) {
        newCoverPhotoUrl = await uploadCoverPhoto(user.id, coverPhotoFile);
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.name,
          phone: formData.phone,
          bio: formData.bio,
          avatar_url: newAvatarUrl,
          cover_photo_url: newCoverPhotoUrl,
          location_city: formData.location_city,
          location_state: formData.location_state,
          zip_code: formData.zip_code,
        })
        .eq("id", user.id);

      if (error) throw error;

      await refreshProfile();
      setIsEditing(false);
      setAvatarFile(null);
      setCoverPhotoFile(null);
      setAvatarPreview(null);
      setCoverPhotoPreview(null);
      toast.success("Profile updated successfully");
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error(error.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleStartVerification = async () => {
    if (!user?.email) {
      toast.error("Please add an email address to your profile first.");
      return;
    }

    setStartingVerification(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-verified-checkout", {
        body: { email: user.email },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      throw new Error("Unable to start verification. No checkout URL returned.");
    } catch (error: any) {
      console.error("Verification error:", error);
      toast.error(error.message || "Unable to start verification");
    } finally {
      setStartingVerification(false);
    }
  };

  if (loading || !user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const initials = (profile.full_name || user.email || "U")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const hasBothRoles =
    availableRoles.includes("client") && availableRoles.includes("proxy");

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Button variant="outline" size="sm" onClick={signOut}>
            Sign Out
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-4">
        {showVerifyBanner && (
          <Card className="mx-4 mt-6 border border-dashed border-primary/40 bg-primary/5 shadow-none">
            <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center">
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-primary font-semibold text-lg">
                    Become a Verified Proxy
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Verified proxies are highlighted in feeds and are 10x more likely to be booked.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:ml-auto">
                <Button variant="outline" onClick={() => setShowVerifyBanner(false)}>
                  Dismiss
                </Button>
                <Button onClick={handleStartVerification} disabled={startingVerification}>
                  {startingVerification ? "Opening checkout..." : "Get Verified – $9.99/mo"}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Cover Photo Section */}
        <div className="relative h-64 bg-gradient-to-r from-primary/20 to-accent/20 rounded-b-2xl overflow-hidden group">
          {coverPhotoPreview ? (
            <img
              src={coverPhotoPreview}
              alt="Cover Preview"
              className="w-full h-full object-cover"
            />
          ) : profile.cover_photo_url ? (
            <img
              src={profile.cover_photo_url}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : null}
          <label className="absolute top-4 right-4 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="gap-2 bg-background/90 backdrop-blur-sm"
            >
              <Camera className="w-4 h-4" />
              {coverPhotoFile ? "Change Cover" : profile.cover_photo_url ? "Change Cover" : "Add Cover Photo"}
            </Button>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setCoverPhotoFile(file);
                if (file) {
                  setIsEditing(true);
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setCoverPhotoPreview(reader.result as string);
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
          </label>
        </div>

        {/* Profile Card */}
        <Card className="mx-4 -mt-20 shadow-lg border-0">
          <div className="p-6">
            {/* Profile Header */}
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Avatar */}
              <div className="relative -mt-20 sm:-mt-24 group/avatar">
                <Avatar className="w-32 h-32 sm:w-40 sm:h-40 border-4 border-background shadow-lg">
                  {avatarPreview ? (
                    <AvatarImage src={avatarPreview} alt="Avatar Preview" />
                  ) : profile.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt="Avatar" />
                  ) : (
                    <AvatarFallback className="bg-primary/10 text-primary text-4xl">
                      {initials}
                    </AvatarFallback>
                  )}
                </Avatar>
                <label className="absolute bottom-0 right-0 cursor-pointer opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="rounded-full h-10 w-10 bg-background/90 backdrop-blur-sm shadow-lg"
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setAvatarFile(file);
                      if (file) {
                        setIsEditing(true);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setAvatarPreview(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>

              {/* Profile Info */}
              <div className="flex-1 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">
                      {profile.full_name || user.email}
                    </h1>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        variant="secondary"
                        className="capitalize bg-primary/10 text-primary"
                      >
                        {currentRole}
                      </Badge>
                      {profile.verified && (
                        <Badge variant="outline" className="gap-1">
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    {profile.bio && (
                      <p className="text-muted-foreground mt-3 max-w-2xl">
                        {profile.bio}
                      </p>
                    )}
                  </div>
                  {!isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit Profile
                    </Button>
                  )}
                </div>

                {/* Role Toggle */}
                {hasBothRoles && (
                  <Card className="p-4 bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <UserCircle className="w-5 h-5 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">
                          Client
                        </span>
                      </div>
                      <Switch
                        checked={currentRole === "proxy"}
                        onCheckedChange={(checked) => {
                          handleRoleSwitch(checked ? "proxy" : "client");
                        }}
                      />
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-foreground">
                          Proxy
                        </span>
                        <Users className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                  </Card>
                )}

                {/* Stats (for proxies) */}
                {currentRole === "proxy" && (
                  <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">
                        {stats.completedEvents}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Completed
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <StarRating rating={stats.averageRating} size="sm" />
                        <span className="text-2xl font-bold text-foreground ml-1">
                          {stats.averageRating > 0
                            ? stats.averageRating.toFixed(1)
                            : "—"}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Rating
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">
                        {stats.reviewCount}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Reviews
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Navigation Tabs */}
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0">
              <TabsTrigger value="about" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                About
              </TabsTrigger>
              {currentRole === "proxy" && (
                <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                  Reviews
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="about" className="p-6 space-y-6">
              {/* Feed Navigation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentRole === "client" && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 h-auto py-4"
                    onClick={() => navigate("/proxy-feed")}
                  >
                    <Search className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-semibold">Browse Proxy Feed</div>
                      <div className="text-xs text-muted-foreground">
                        Find proxies for your events
                      </div>
                    </div>
                  </Button>
                )}
                {currentRole === "proxy" && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 h-auto py-4"
                    onClick={() => navigate("/request-feed")}
                  >
                    <Bell className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-semibold">Browse Request Feed</div>
                      <div className="text-xs text-muted-foreground">
                        Find events to attend
                      </div>
                    </div>
                  </Button>
                )}
              </div>

              {/* Profile Information */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-foreground">
                    Profile Information
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      <UserCircle className="w-4 h-4" />
                      Full Name
                    </Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                      />
                    ) : (
                      <p className="text-foreground">
                        {profile.full_name || "Not provided"}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </Label>
                    <p className="text-muted-foreground">{user.email}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number
                    </Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter your phone number"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                      />
                    ) : (
                      <p className="text-muted-foreground">
                        {profile.phone || "Not provided"}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="location_city"
                      className="flex items-center gap-2"
                    >
                      <MapPin className="w-4 h-4" />
                      Location
                    </Label>
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input
                          id="location_city"
                          placeholder="City"
                          value={formData.location_city}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              location_city: e.target.value,
                            })
                          }
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            id="location_state"
                            placeholder="State"
                            value={formData.location_state}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                location_state: e.target.value,
                              })
                            }
                          />
                          <Input
                            id="zip_code"
                            placeholder="Zip Code"
                            value={formData.zip_code}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                zip_code: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        {[
                          profile.location_city,
                          profile.location_state,
                          profile.zip_code,
                        ]
                          .filter(Boolean)
                          .join(", ") || "Not provided"}
                      </p>
                    )}
                  </div>
                </div>

                {(currentRole === "proxy" ||
                  availableRoles.includes("proxy")) && (
                  <div className="space-y-2">
                    <Label htmlFor="bio">About Me</Label>
                    {isEditing ? (
                      <Textarea
                        id="bio"
                        placeholder="Tell us about yourself and why you want to be a stand-in..."
                        value={formData.bio}
                        onChange={(e) =>
                          setFormData({ ...formData, bio: e.target.value })
                        }
                        rows={4}
                      />
                    ) : (
                      <p className="text-muted-foreground">
                        {profile.bio || "Not provided"}
                      </p>
                    )}
                  </div>
                )}

                {isEditing && (
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="warm"
                      onClick={handleSave}
                      className="flex-1"
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setAvatarFile(null);
                        setCoverPhotoFile(null);
                        setAvatarPreview(null);
                        setCoverPhotoPreview(null);
                      }}
                      className="flex-1"
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {currentRole === "proxy" && (
              <TabsContent value="reviews" className="p-6">
                <Reviews proxyId={user.id} />
              </TabsContent>
            )}
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
