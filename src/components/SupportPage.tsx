import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useChatMessages, useAppliances, useMeterReadings } from "@/hooks/useUserData";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "How can I save on my AC bill?",
  "What's the most efficient refrigerator?",
  "Tips for reducing peak-hour usage",
  "How do electricity brackets work?",
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export function SupportPage() {
  const { user } = useAuth();
  const { data: savedMessages } = useChatMessages();
  const { data: appliances } = useAppliances();
  const { data: readings } = useMeterReadings();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "👋 أهلاً! أنا **Wafer Bot**، مساعدك الذكي لتوفير الطاقة.\n\nأقدر أساعدك في:\n• نصائح توفير مخصصة ليك\n• فهم فاتورة الكهرباء والشرائح\n• اقتراح أجهزة موفرة\n• تخطيط تحديات التوفير\n\nإيه اللي عايز تعرفه؟",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load saved messages
  useEffect(() => {
    if (savedMessages && savedMessages.length > 0) {
      const loaded: Message[] = savedMessages.map((m: any) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
      }));
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: "👋 أهلاً! أنا **Wafer Bot**، مساعدك الذكي لتوفير الطاقة.\n\nأقدر أساعدك في:\n• نصائح توفير مخصصة ليك\n• فهم فاتورة الكهرباء والشرائح\n• اقتراح أجهزة موفرة\n• تخطيط تحديات التوفير\n\nإيه اللي عايز تعرفه؟",
        },
        ...loaded,
      ]);
    }
  }, [savedMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Save user message to DB
    if (user) {
      supabase.from("chat_messages").insert({ user_id: user.id, role: "user", content: text.trim() }).then();
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const chatMessages = messages
        .filter((m) => m.id !== "welcome")
        .concat(userMsg)
        .map((m) => ({ role: m.role, content: m.content }));

      const userContext = {
        appliances: appliances || [],
        recentReadings: readings || [],
      };

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ messages: chatMessages, userContext }),
      });

      if (!resp.ok || !resp.body) {
        throw new Error(`Error ${resp.status}`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantSoFar = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && last.id === "streaming") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { id: "streaming", role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Finalize
      setMessages((prev) =>
        prev.map((m) => m.id === "streaming" ? { ...m, id: (Date.now() + 1).toString() } : m)
      );

      // Save to DB
      if (user && assistantSoFar) {
        supabase.from("chat_messages").insert({ user_id: user.id, role: "assistant", content: assistantSoFar }).then();
      }
    } catch (e) {
      console.error("Chat error:", e);
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: "عذراً، حصل خطأ. حاول تاني بعد شوية 🙏" },
      ]);
    }

    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
          <Bot className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground flex items-center gap-1.5">
            Wafer Bot <Sparkles className="w-4 h-4 text-energy-amber" />
          </h1>
          <p className="text-xs text-muted-foreground">AI-powered energy assistant</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-energy-green-light text-primary"
            }`}>
              {msg.role === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-primary text-primary-foreground rounded-tr-sm"
                : "bg-card text-card-foreground rounded-tl-sm shadow-sm"
            }`} style={msg.role === "assistant" ? { boxShadow: "var(--shadow-card)" } : undefined}>
              {msg.role === "assistant" ? (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : msg.content}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.id !== "streaming" && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-energy-green-light text-primary flex items-center justify-center">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-card rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 py-3">
          {SUGGESTIONS.map((s, i) => (
            <button key={i} onClick={() => sendMessage(s)} className="text-xs px-3 py-2 rounded-full border border-border text-foreground hover:bg-muted transition-colors">
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 pt-3 border-t border-border">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
          placeholder="اسأل Wafer Bot..."
          className="flex-1 px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || isLoading}
          className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
