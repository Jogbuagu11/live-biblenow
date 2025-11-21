import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Menu,
  Home,
  User,
  MessageSquare,
  Search,
  LogOut,
  X,
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, currentRole, signOut } = useAuthStore();
  const [open, setOpen] = useState(false);

  // Don't show navigation on auth pages or landing page
  const hideNavPaths = ["/auth", "/check-email", "/"];
  if (!user || hideNavPaths.includes(location.pathname)) return null;

  const navItems = [
    { icon: Home, label: "Home", path: "/home", exact: true },
    {
      icon: Search,
      label: currentRole === "client" ? "Proxy Feed" : "Request Feed",
      path: currentRole === "client" ? "/proxy-feed" : "/request-feed",
    },
    { icon: MessageSquare, label: "Messages", path: "/messages" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    setOpen(false);
  };

  return (
    <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="font-bold text-lg"
          >
            TMWY
          </Button>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.path}
                variant={isActive(item.path, item.exact) ? "secondary" : "ghost"}
                size="sm"
                onClick={() => handleNavigate(item.path)}
                className={cn(
                  "gap-2",
                  isActive(item.path, item.exact) && "bg-primary/10"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Button>
            );
          })}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="gap-2 text-muted-foreground hover:text-destructive"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </nav>

        {/* Mobile Navigation */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <div className="flex flex-col gap-4 mt-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Navigation</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.path}
                    variant={isActive(item.path, item.exact) ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 h-auto py-3",
                      isActive(item.path, item.exact) && "bg-primary/10"
                    )}
                    onClick={() => handleNavigate(item.path)}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-base">{item.label}</span>
                  </Button>
                );
              })}
              <div className="border-t pt-4 mt-4">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-auto py-3 text-muted-foreground hover:text-destructive"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-base">Sign Out</span>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

