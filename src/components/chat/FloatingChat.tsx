"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "./ChatProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { MessageCircle, X, Send, ArrowLeft } from "lucide-react";

export default function FloatingChat() {
  const { user } = useAuth();
  const chat = useChat();
  const [message, setMessage] = useState("");
  const messagesEnd = useRef<HTMLDivElement>(null);

  // Draggable state
  const [pos, setPos] = useState({ x: 24, y: typeof window !== "undefined" ? window.innerHeight - 72 : 600 });
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  // Initialize position on mount
  useEffect(() => {
    setPos({ x: 24, y: window.innerHeight - 72 });
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    setDragging(true);
    hasMoved.current = false;
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [pos]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    hasMoved.current = true;
    const newX = Math.max(0, Math.min(window.innerWidth - 48, e.clientX - dragOffset.current.x));
    const newY = Math.max(0, Math.min(window.innerHeight - 48, e.clientY - dragOffset.current.y));
    setPos({ x: newX, y: newY });
  }, [dragging]);

  const onPointerUp = useCallback(() => {
    setDragging(false);
    // Only toggle chat if we didn't drag
    if (!hasMoved.current && chat) {
      chat.setMinimized(!chat.minimized);
    }
  }, [chat]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages]);

  if (!user || !chat) return null;

  const handleSend = async () => {
    if (!message.trim()) return;
    await chat.sendMessage(message);
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // Panel position — above or beside the bubble
  const panelX = Math.min(pos.x, window.innerWidth - 330);
  const panelY = pos.y > 500 ? pos.y - 450 : pos.y + 56;

  return (
    <>
      {/* Draggable floating button */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className={`fixed z-[70] flex h-12 w-12 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30 cursor-grab active:cursor-grabbing select-none touch-none ${dragging ? "scale-110" : "hover:scale-105"} transition-transform`}
        style={{ left: pos.x, top: pos.y }}
      >
        <MessageCircle className="h-5 w-5 text-black pointer-events-none" />
        {chat.totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 font-body text-[10px] text-white font-bold pointer-events-none">
            {chat.totalUnread > 9 ? "9+" : chat.totalUnread}
          </span>
        )}
      </div>

      {/* Chat panel — positioned near bubble */}
      <AnimatePresence>
        {!chat.minimized && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed z-[70] w-[320px] h-[440px] rounded-[16px] border border-dark-gray/30 bg-surface/95 backdrop-blur-sm shadow-2xl flex flex-col overflow-hidden"
            style={{ left: panelX, top: panelY }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-dark-gray/20 px-4 py-3">
              {chat.activeChat ? (
                <button onClick={chat.closeChat} className="flex items-center gap-2 font-body text-[13px] text-white hover:text-primary">
                  <ArrowLeft className="h-4 w-4" />
                  {chat.conversations.find(c => c.friendId === chat.activeChat)?.friendName || "Chat"}
                </button>
              ) : (
                <span className="font-body text-[14px] font-semibold text-white">Messages</span>
              )}
              <button onClick={() => chat.setMinimized(true)} className="text-offwhite/50 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {!chat.activeChat ? (
                // Conversation list
                <div className="flex flex-col">
                  {chat.conversations.length === 0 ? (
                    <div className="p-6 text-center">
                      <MessageCircle className="h-8 w-8 text-offwhite/20 mx-auto mb-2" />
                      <p className="font-body text-[12px] text-offwhite/40">No friends yet.</p>
                      <p className="font-body text-[11px] text-offwhite/20 mt-1">Add friends from the feed to chat!</p>
                    </div>
                  ) : (
                    chat.conversations.map(convo => (
                      <button key={convo.friendId} onClick={() => chat.openChat(convo.friendId)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-primary/5 transition-colors border-b border-dark-gray/10 w-full text-left">
                        <div className="relative shrink-0">
                          {convo.friendAvatar ? (
                            <img src={convo.friendAvatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center font-body text-[14px] text-primary font-bold">{convo.friendName[0]}</div>
                          )}
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-surface" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-body text-[12px] font-semibold text-white truncate">{convo.friendName}</p>
                          <p className="font-body text-[10px] text-offwhite/40 truncate">{convo.lastMessage}</p>
                        </div>
                        {convo.unreadCount > 0 && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary font-body text-[9px] text-black font-bold shrink-0">{convo.unreadCount}</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              ) : (
                // Messages view
                <div className="flex flex-col gap-2 p-3">
                  {chat.messages.map(msg => {
                    const isMine = msg.sender_id === user.id;
                    return (
                      <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] rounded-[12px] px-3 py-2 ${isMine ? "bg-primary/20 text-white" : "bg-dark-gray/20 text-offwhite"}`}>
                          {msg.image_url && <img src={msg.image_url} alt="" className="mb-1 rounded-[8px] max-h-[120px] object-cover" />}
                          <p className="font-body text-[12px] break-words">{msg.content}</p>
                          <p className="font-body text-[8px] text-offwhite/30 mt-0.5">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            {isMine && msg.is_read && " ✓✓"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEnd} />
                </div>
              )}
            </div>

            {/* Input (only when in active chat) */}
            {chat.activeChat && (
              <div className="border-t border-dark-gray/20 px-3 py-2 flex items-center gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  className="flex-1 bg-background/40 rounded-full px-3 py-2 font-body text-[12px] text-white placeholder:text-offwhite/30 focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
                <button onClick={handleSend} disabled={!message.trim()} className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/80 text-black disabled:opacity-30 hover:bg-primary">
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
