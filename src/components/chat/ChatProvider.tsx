"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";

export interface Message {
  id: number;
  sender_id: string;
  receiver_id: string;
  content: string;
  image_url?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  friendId: string;
  friendName: string;
  friendAvatar: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  isOnline: boolean;
}

interface ChatContextType {
  conversations: Conversation[];
  activeChat: string | null;
  messages: Message[];
  openChat: (friendId: string) => void;
  closeChat: () => void;
  sendMessage: (content: string, imageUrl?: string) => Promise<void>;
  markAsRead: (friendId: string) => void;
  totalUnread: number;
  isTyping: boolean;
  setTyping: (typing: boolean) => void;
  minimized: boolean;
  setMinimized: (m: boolean) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);
export const useChat = () => useContext(ChatContext)!;

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [minimized, setMinimized] = useState(true);
  const supabase = useRef(createClient());

  // Fetch conversations (friends with last message)
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    const sb = supabase.current;

    // Get accepted friends
    const { data: friendships } = await sb.from("friendships")
      .select("requester_id, addressee_id")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .eq("status", "accepted");

    if (!friendships || friendships.length === 0) return;

    const friendIds = friendships.map(f => f.requester_id === user.id ? f.addressee_id : f.requester_id);
    const { data: profiles } = await sb.from("profiles").select("id, full_name, avatar_url").in("id", friendIds);

    // Get last messages
    const { data: msgs } = await sb.from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(100);

    const convos: Conversation[] = (profiles || []).map(p => {
      const friendMsgs = (msgs || []).filter(m =>
        (m.sender_id === user.id && m.receiver_id === p.id) ||
        (m.sender_id === p.id && m.receiver_id === user.id)
      );
      const last = friendMsgs[0];
      const unread = friendMsgs.filter(m => m.sender_id === p.id && !m.is_read).length;

      return {
        friendId: p.id,
        friendName: p.full_name || "Mage",
        friendAvatar: p.avatar_url,
        lastMessage: last?.content || "",
        lastMessageAt: last?.created_at || "",
        unreadCount: unread,
        isOnline: false,
      };
    }).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

    setConversations(convos);
  }, [user]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // Realtime subscription for new messages
  useEffect(() => {
    if (!user) return;
    const sb = supabase.current;
    const channel = sb.channel("messages-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new as Message;
        if (msg.sender_id === user.id || msg.receiver_id === user.id) {
          if (activeChat && (msg.sender_id === activeChat || msg.receiver_id === activeChat)) {
            setMessages(prev => [...prev, msg]);
          }
          fetchConversations();
        }
      })
      .subscribe();

    return () => { sb.removeChannel(channel); };
  }, [user, activeChat, fetchConversations]);

  const openChat = useCallback(async (friendId: string) => {
    if (!user) return;
    setActiveChat(friendId);
    setMinimized(false);
    const sb = supabase.current;
    const { data } = await sb.from("messages")
      .select("*")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`)
      .order("created_at", { ascending: true })
      .limit(50);
    setMessages(data || []);
    // Mark as read
    await sb.from("messages").update({ is_read: true }).eq("sender_id", friendId).eq("receiver_id", user.id).eq("is_read", false);
    fetchConversations();
  }, [user, fetchConversations]);

  const closeChat = () => { setActiveChat(null); setMessages([]); };

  const sendMessage = useCallback(async (content: string, imageUrl?: string) => {
    if (!user || !activeChat || !content.trim()) return;
    const sb = supabase.current;
    await sb.from("messages").insert({ sender_id: user.id, receiver_id: activeChat, content: content.trim(), image_url: imageUrl || null, is_read: false });
  }, [user, activeChat]);

  const markAsRead = useCallback(async (friendId: string) => {
    if (!user) return;
    const sb = supabase.current;
    await sb.from("messages").update({ is_read: true }).eq("sender_id", friendId).eq("receiver_id", user.id);
    fetchConversations();
  }, [user, fetchConversations]);

  const setTyping = (typing: boolean) => setIsTyping(typing);
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <ChatContext.Provider value={{ conversations, activeChat, messages, openChat, closeChat, sendMessage, markAsRead, totalUnread, isTyping, setTyping, minimized, setMinimized }}>
      {children}
    </ChatContext.Provider>
  );
}
