import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import { XIcon, SparkIcon } from "./Icons.jsx";

const ACCENT = "#ff5a3c";

export default function CoachChat({ open, onClose, selectedDate }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [bootLoading, setBootLoading] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setBootLoading(true);
    api
      .getCoachThread()
      .then(async (data) => {
        if (cancelled) return;
        if (!data.messages || data.messages.length === 0) {
          const opened = await api.coachOpener(selectedDate);
          if (!cancelled) setMessages(opened.messages);
        } else {
          setMessages(data.messages);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setBootLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, bootLoading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    try {
      const data = await api.sendCoachMessage(text, selectedDate);
      setMessages(data.messages);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Coach is having trouble responding. Try again." },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  async function reset() {
    if (!confirm("Clear conversation and start fresh?")) return;
    await api.resetCoach();
    setMessages([]);
    setBootLoading(true);
    try {
      const opened = await api.coachOpener(selectedDate);
      setMessages(opened.messages);
    } finally {
      setBootLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(23,20,15,0.55)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 560,
          height: "88vh",
          background: "#17140f",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: "0 0 0",
          color: "#f4efe5",
          display: "flex",
          flexDirection: "column",
          animation: "slideUp 280ms cubic-bezier(.2,.7,.3,1)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 22px 14px",
            borderBottom: "1px solid rgba(244,239,229,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: `${ACCENT}22`,
                color: ACCENT,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <SparkIcon size={16} />
            </span>
            <div>
              <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 22, lineHeight: 1 }}>
                Coach
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "rgba(244,239,229,0.45)",
                  fontFamily: "var(--mono)",
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  marginTop: 2,
                }}
              >
                grounded in your training data
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={reset}
              title="reset conversation"
              style={{
                fontSize: 11,
                padding: "6px 10px",
                borderRadius: 999,
                color: "rgba(244,239,229,0.6)",
                background: "rgba(244,239,229,0.06)",
                fontFamily: "var(--mono)",
                letterSpacing: 0.4,
              }}
            >
              reset
            </button>
            <button
              onClick={onClose}
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "rgba(244,239,229,0.08)",
                color: "#f4efe5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <XIcon size={16} />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {bootLoading && messages.length === 0 && (
            <div style={{ color: "rgba(244,239,229,0.5)", fontSize: 13 }}>
              <span className="log-blink">●</span> coach is reviewing your week…
            </div>
          )}
          {messages.map((m, i) => (
            <Bubble key={i} role={m.role} content={m.content} />
          ))}
          {loading && <Bubble role="assistant" content="…" loading />}
        </div>

        <div
          style={{
            padding: "12px 14px calc(14px + env(safe-area-inset-bottom))",
            borderTop: "1px solid rgba(244,239,229,0.08)",
            display: "flex",
            gap: 8,
            alignItems: "flex-end",
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="ask the coach anything…"
            rows={1}
            style={{
              flex: 1,
              minHeight: 44,
              maxHeight: 140,
              padding: "12px 14px",
              background: "rgba(244,239,229,0.06)",
              border: "1px solid rgba(244,239,229,0.1)",
              borderRadius: 16,
              color: "#f4efe5",
              fontSize: 16,
              outline: "none",
              resize: "none",
              fontFamily: "var(--sans)",
              lineHeight: 1.4,
            }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            style={{
              padding: "12px 18px",
              minHeight: 44,
              borderRadius: 16,
              background: input.trim() && !loading ? ACCENT : "rgba(244,239,229,0.1)",
              color: input.trim() && !loading ? "#fff" : "rgba(244,239,229,0.4)",
              fontSize: 14,
              fontWeight: 600,
              transition: "all 120ms",
            }}
          >
            send
          </button>
        </div>
      </div>
    </div>
  );
}

function Bubble({ role, content, loading }) {
  const isUser = role === "user";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
      }}
    >
      <div
        style={{
          maxWidth: "82%",
          padding: "10px 14px",
          borderRadius: 18,
          background: isUser ? ACCENT : "rgba(244,239,229,0.06)",
          color: isUser ? "#fff" : "rgba(244,239,229,0.9)",
          fontSize: 14,
          lineHeight: 1.5,
          whiteSpace: "pre-wrap",
          border: isUser ? "1px solid transparent" : "1px solid rgba(244,239,229,0.06)",
        }}
      >
        {loading ? <span className="log-blink">●</span> : content}
      </div>
    </div>
  );
}
