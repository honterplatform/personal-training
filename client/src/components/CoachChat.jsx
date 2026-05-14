import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api.js";
import { useStore } from "../lib/store.jsx";
import { SparkIcon, XIcon } from "./Icons.jsx";

export default function CoachChat({ onClose }) {
  const { selectedDate } = useStore();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const t = await api.getCoachThread();
        if (cancelled) return;
        if (!t.messages || t.messages.length === 0) {
          const opened = await api.coachOpener(selectedDate);
          if (!cancelled) setMessages(opened.messages);
        } else {
          setMessages(t.messages);
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || "coach unavailable");
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedDate]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending, booting]);

  async function send(e) {
    e?.preventDefault?.();
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    try {
      const t = await api.sendCoachMessage(text, selectedDate);
      setMessages(t.messages);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Coach is having trouble responding. Try again." },
      ]);
    } finally {
      setSending(false);
    }
  }

  async function reset() {
    if (!confirm("Reset coach conversation? Starts fresh.")) return;
    try {
      await api.resetCoach();
      setMessages([]);
      setBooting(true);
      const opened = await api.coachOpener(selectedDate);
      setMessages(opened.messages);
    } finally {
      setBooting(false);
    }
  }

  function onKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="coach-backdrop" onClick={onClose}>
      <div className="coach-sheet" onClick={(e) => e.stopPropagation()}>
        <header className="coach-header">
          <div className="coach-title-row">
            <span className="coach-spark">
              <SparkIcon size={16} stroke={2} />
            </span>
            <div>
              <div className="coach-title">Coach</div>
              <div className="coach-subtitle">grounded in your training data</div>
            </div>
          </div>
          <div className="coach-header-actions">
            <button className="coach-reset" onClick={reset}>reset</button>
            <button className="coach-close" onClick={onClose} aria-label="close">
              <XIcon size={16} />
            </button>
          </div>
        </header>

        <div className="coach-body" ref={scrollRef}>
          {booting && messages.length === 0 ? (
            <div className="coach-loading">● coach is reviewing your week…</div>
          ) : null}
          {messages.map((m, i) => (
            <Bubble key={i} role={m.role} content={m.content} />
          ))}
          {sending ? <Bubble role="assistant" content="…" /> : null}
          {error ? <div className="coach-error">{error}</div> : null}
        </div>

        <form className="coach-composer" onSubmit={send}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="ask the coach anything…"
            rows={1}
          />
          <button
            type="submit"
            className="coach-send"
            disabled={!input.trim() || sending}
          >
            send
          </button>
        </form>
      </div>
    </div>
  );
}

function Bubble({ role, content }) {
  const isUser = role === "user";
  return (
    <div className={`coach-bubble-row ${isUser ? "user" : "assistant"}`}>
      <div className={`coach-bubble ${isUser ? "user" : "assistant"}`}>
        {content}
      </div>
    </div>
  );
}
