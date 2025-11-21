import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, Search } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

interface Conversation {
  id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string | null;
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number;
  event_id: string | null;
  event_title: string | null;
}

const Messages = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      loadConversations();
    }
  }, [user, loading, navigate]);

  const loadConversations = async () => {
    if (!user) return;

    try {
      setLoadingConversations(true);

      // Get all unique conversations (messages where user is sender or recipient)
      const { data: messages, error } = await supabase
        .from("event_messages")
        .select(
          `
          id,
          event_id,
          sender_id,
          recipient_id,
          body,
          created_at,
          events!inner(id, title)
        `
        )
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group messages by conversation (other user + event)
      const conversationMap = new Map<string, Conversation>();

      messages?.forEach((msg: any) => {
        const otherUserId =
          msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
        const conversationKey = `${otherUserId}_${msg.event_id || "general"}`;

        if (!conversationMap.has(conversationKey)) {
          conversationMap.set(conversationKey, {
            id: conversationKey,
            other_user_id: otherUserId,
            other_user_name: "", // Will fetch from profiles
            other_user_avatar: null,
            last_message: msg.body,
            last_message_time: msg.created_at,
            unread_count: msg.recipient_id === user.id ? 1 : 0,
            event_id: msg.event_id,
            event_title: msg.events?.title || null,
          });
        } else {
          const conv = conversationMap.get(conversationKey)!;
          if (new Date(msg.created_at) > new Date(conv.last_message_time!)) {
            conv.last_message = msg.body;
            conv.last_message_time = msg.created_at;
          }
          if (msg.recipient_id === user.id) {
            conv.unread_count += 1;
          }
        }
      });

      // Fetch user profiles for all conversations
      const userIds = Array.from(
        new Set(Array.from(conversationMap.values()).map((c) => c.other_user_id))
      );

      if (userIds.length > 0) {
        const { data: profiles, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", userIds);

        if (!profileError && profiles) {
          const profileMap = new Map(
            profiles.map((p) => [p.id, p])
          );

          conversationMap.forEach((conv) => {
            const profile = profileMap.get(conv.other_user_id);
            if (profile) {
              conv.other_user_name = profile.full_name || "Unknown User";
              conv.other_user_avatar = profile.avatar_url;
            }
          });
        }
      }

      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoadingConversations(false);
    }
  };

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.other_user_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      conv.event_title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading || loadingConversations) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <div className="text-muted-foreground">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="pt-4">
          <h1 className="text-3xl font-bold text-foreground mb-2">Messages</h1>
          <p className="text-muted-foreground">
            Chat with your stand-ins and clients
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="space-y-2">
          {filteredConversations.length === 0 ? (
            <Card className="p-12 text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                {searchQuery
                  ? "No conversations found"
                  : "No messages yet. Start a conversation from an event."}
              </p>
            </Card>
          ) : (
            filteredConversations.map((conversation) => {
              const initials = conversation.other_user_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

              return (
                <Card
                  key={conversation.id}
                  className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    // Navigate to conversation detail page
                    navigate(
                      `/messages/${conversation.other_user_id}${conversation.event_id ? `?event=${conversation.event_id}` : ""}`
                    );
                  }}
                >
                  <div className="flex gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage
                        src={conversation.other_user_avatar || undefined}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground truncate">
                            {conversation.other_user_name}
                          </p>
                          {conversation.unread_count > 0 && (
                            <Badge
                              variant="default"
                              className="h-5 min-w-5 px-1.5 flex items-center justify-center text-xs"
                            >
                              {conversation.unread_count}
                            </Badge>
                          )}
                        </div>
                        {conversation.last_message_time && (
                          <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                            {format(
                              new Date(conversation.last_message_time),
                              "MMM d"
                            )}
                          </span>
                        )}
                      </div>
                      {conversation.event_title && (
                        <p className="text-xs text-muted-foreground mb-1">
                          {conversation.event_title}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.last_message || "No messages yet"}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;

