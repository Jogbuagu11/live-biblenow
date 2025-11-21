import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { format, isToday, isYesterday } from "date-fns";
import { toast } from "sonner";

interface Message {
  id: number;
  body: string;
  sender_id: string;
  recipient_id: string;
  created_at: string;
  read_at: string | null;
  sender_name?: string;
  sender_avatar?: string | null;
}

const Conversation = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("event");
  const { user, loading: authLoading } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [otherUser, setOtherUser] = useState<{
    id: string;
    name: string;
    avatar: string | null;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (user && userId) {
      loadConversation();
      setupRealtimeSubscription();
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user, userId, eventId, authLoading, navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversation = async () => {
    if (!user || !userId || !eventId) return;

    try {
      setLoading(true);

      // Load other user's profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("id", userId)
        .single();

      if (profile) {
        setOtherUser({
          id: profile.id,
          name: profile.full_name || "Unknown User",
          avatar: profile.avatar_url,
        });
      }

      // Load messages
      const { data: messagesData, error } = await supabase
        .from("event_messages")
        .select(
          `
          *,
          sender:profiles!event_messages_sender_id_fkey(id, full_name, avatar_url),
          recipient:profiles!event_messages_recipient_id_fkey(id, full_name, avatar_url)
        `
        )
        .eq("event_id", eventId)
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${user.id})`)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const formattedMessages: Message[] = (messagesData || []).map((msg: any) => ({
        id: msg.id,
        body: msg.body,
        sender_id: msg.sender_id,
        recipient_id: msg.recipient_id,
        created_at: msg.created_at,
        read_at: msg.read_at,
        sender_name: msg.sender?.full_name || "Unknown",
        sender_avatar: msg.sender?.avatar_url,
      }));

      setMessages(formattedMessages);

      // Mark messages as read
      await supabase
        .from("event_messages")
        .update({ read_at: new Date().toISOString() })
        .eq("event_id", eventId)
        .eq("recipient_id", user.id)
        .is("read_at", null);
    } catch (error) {
      console.error("Error loading conversation:", error);
      toast.error("Failed to load conversation");
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!user || !userId || !eventId) return;

    const channel = supabase
      .channel(`messages:${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "event_messages",
          filter: `event_id=eq.${eventId}`,
        },
        async (payload) => {
          const newMessage = payload.new as any;

          // Only add if it's from/to the current conversation
          if (
            (newMessage.sender_id === userId && newMessage.recipient_id === user.id) ||
            (newMessage.sender_id === user.id && newMessage.recipient_id === userId)
          ) {
            // Fetch sender profile
            const { data: senderProfile } = await supabase
              .from("profiles")
              .select("full_name, avatar_url")
              .eq("id", newMessage.sender_id)
              .single();

            setMessages((prev) => [
              ...prev,
              {
                id: newMessage.id,
                body: newMessage.body,
                sender_id: newMessage.sender_id,
                recipient_id: newMessage.recipient_id,
                created_at: newMessage.created_at,
                read_at: newMessage.read_at,
                sender_name: senderProfile?.full_name || "Unknown",
                sender_avatar: senderProfile?.avatar_url,
              },
            ]);

            // Mark as read if we're the recipient
            if (newMessage.recipient_id === user.id) {
              await supabase
                .from("event_messages")
                .update({ read_at: new Date().toISOString() })
                .eq("id", newMessage.id);
            }
          }
        }
      )
      .subscribe();

    channelRef.current = channel;
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !user || !userId || !eventId || sending) return;

    setSending(true);
    try {
      const { error } = await supabase.from("event_messages").insert({
        event_id: eventId,
        sender_id: user.id,
        recipient_id: userId,
        body: messageText.trim(),
      });

      if (error) throw error;

      setMessageText("");
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error(error.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (date: string) => {
    const messageDate = new Date(date);
    if (isToday(messageDate)) {
      return format(messageDate, "h:mm a");
    } else if (isYesterday(messageDate)) {
      return `Yesterday ${format(messageDate, "h:mm a")}`;
    } else {
      return format(messageDate, "MMM d, h:mm a");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!otherUser) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">User not found</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate("/messages")}
          >
            Back to Messages
          </Button>
        </Card>
      </div>
    );
  }

  const otherUserInitials = otherUser.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-gradient-soft flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/messages")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Avatar className="w-10 h-10">
            <AvatarImage src={otherUser.avatar || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {otherUserInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold">{otherUser.name}</p>
            {eventId && <p className="text-xs text-muted-foreground">Event conversation</p>}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.sender_id === user?.id;
              const senderInitials = (message.sender_name || "U")
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
                >
                  {!isOwn && (
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={message.sender_avatar || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {senderInitials}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"} max-w-[70%]`}>
                    <Card
                      className={`p-3 ${
                        isOwn
                          ? "bg-primary text-primary-foreground"
                          : "bg-card"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.body}
                      </p>
                    </Card>
                    <span className="text-xs text-muted-foreground mt-1 px-1">
                      {formatMessageTime(message.created_at)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="sticky bottom-0 bg-background/80 backdrop-blur-sm border-t">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <form onSubmit={sendMessage} className="flex gap-2">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type a message..."
              disabled={sending}
              className="flex-1"
            />
            <Button type="submit" disabled={sending || !messageText.trim()}>
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Conversation;

