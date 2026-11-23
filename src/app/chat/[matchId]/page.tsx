"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Message, Profile } from "@/types/database";
import { ChevronLeft, Send } from "lucide-react";
import { format } from "date-fns";

export default function ChatRoomPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [other, setOther] = useState<Profile | null>(null);
  const [text, setText] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`match:${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const load = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    setUserId(user.id);

    const { data: match } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single();
    if (!match) return;

    const otherId =
      match.user1_id === user.id ? match.user2_id : match.user1_id;
    const { data: profile } = await supabase
      .from("profiles")
      .select("*, photos(url, is_primary)")
      .eq("id", otherId)
      .single();
    if (profile) {
      setOther({
        ...profile,
        primary_photo:
          (profile as any).photos?.find((p: any) => p.is_primary)?.url ||
          (profile as any).photos?.[0]?.url,
      });
    }

    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true });
    setMessages(msgs || []);

    // Mark as read
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("match_id", matchId)
      .neq("sender_id", user.id);
  };

  const send = async () => {
    if (!text.trim() || !userId || sending) return;
    setSending(true);
    const content = text.trim();
    setText("");
    const { error } = await supabase.from("messages").insert({
      match_id: matchId,
      sender_id: userId,
      content,
    });
    if (error) {
      setText(content);
    } else {
      await supabase
        .from("matches")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", matchId);
    }
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col max-w-md mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-xl border-b border-surface-100 px-4 h-14 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1 -ml-1">
          <ChevronLeft className="w-6 h-6 text-surface-700" />
        </button>
        <div className="w-9 h-9 rounded-full overflow-hidden bg-surface-200">
          {other?.primary_photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={other.primary_photo}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm text-surface-400">
              {other?.display_name?.[0]}
            </div>
          )}
        </div>
        <p className="font-semibold text-surface-900 truncate">
          {other?.display_name || "Chat"}
        </p>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((m) => {
          const mine = m.sender_id === userId;
          return (
            <div
              key={m.id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                  mine
                    ? "bg-brand-500 text-white rounded-br-md"
                    : "bg-white border border-surface-100 text-surface-800 rounded-bl-md"
                }`}
              >
                <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
                <p
                  className={`text-[10px] mt-1 ${
                    mine ? "text-white/70" : "text-surface-400"
                  }`}
                >
                  {format(new Date(m.created_at), "HH:mm")}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-white border-t border-surface-100 p-3 safe-bottom">
        <div className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Message..."
            className="flex-1 h-11 px-4 rounded-full bg-surface-100 border-0 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
          <button
            onClick={send}
            disabled={!text.trim() || sending}
            className="w-11 h-11 rounded-full bg-brand-500 text-white flex items-center justify-center disabled:opacity-40 hover:bg-brand-600 transition"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
