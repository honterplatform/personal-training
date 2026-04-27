import { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { api, type ChatMessage } from "../lib/api";
import { colors, fonts } from "../lib/theme";
import { SparkIcon, XIcon } from "./Icons";
import { useStore } from "../lib/store";

export default function CoachChat({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { selectedDate } = useStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [booting, setBooting] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setBooting(true);
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
      } catch {
        // swallow — user can still try sending
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => { cancelled = true; };
  }, [visible]);

  useEffect(() => {
    if (scrollRef.current) {
      // scroll to bottom on every render of messages
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    }
  }, [messages, sending, booting]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    setMessages((m) => [...m, { role: "user", content: text }]);
    try {
      const t = await api.sendCoachMessage(text, selectedDate);
      setMessages(t.messages);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Coach is having trouble responding. Try again." },
      ]);
    } finally {
      setSending(false);
    }
  }

  function reset() {
    Alert.alert("Reset coach?", "Clears the conversation and starts fresh.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: async () => {
          try {
            await api.resetCoach();
            setMessages([]);
            setBooting(true);
            const opened = await api.coachOpener(selectedDate);
            setMessages(opened.messages);
          } finally {
            setBooting(false);
          }
        },
      },
    ]);
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.spark}>
              <SparkIcon size={16} color={colors.accent} strokeWidth={2} />
            </View>
            <View>
              <Text style={styles.title}>Coach</Text>
              <Text style={styles.tag}>grounded in your training data</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 6 }}>
            <Pressable onPress={reset} style={styles.resetBtn}>
              <Text style={styles.resetText}>reset</Text>
            </Pressable>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <XIcon size={16} color={colors.cream} strokeWidth={1.8} />
            </Pressable>
          </View>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={20}
        >
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() =>
              scrollRef.current?.scrollToEnd({ animated: true })
            }
          >
            {booting && messages.length === 0 ? (
              <Text style={styles.loading}>● coach is reviewing your week…</Text>
            ) : null}
            {messages.map((m, i) => (
              <Bubble key={i} role={m.role} content={m.content} />
            ))}
            {sending ? <Bubble role="assistant" content="…" /> : null}
          </ScrollView>

          <View style={styles.inputRow}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="ask the coach anything…"
              placeholderTextColor={colors.cream35}
              multiline
              style={styles.input}
            />
            <Pressable
              onPress={send}
              disabled={!input.trim() || sending}
              style={[
                styles.sendBtn,
                (!input.trim() || sending) && styles.sendBtnIdle,
              ]}
            >
              <Text
                style={[
                  styles.sendText,
                  (!input.trim() || sending) && { color: colors.cream35 },
                ]}
              >
                send
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function Bubble({ role, content }: { role: string; content: string }) {
  const isUser = role === "user";
  return (
    <View
      style={[
        styles.bubbleRow,
        { justifyContent: isUser ? "flex-end" : "flex-start" },
      ]}
    >
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleAssistant,
        ]}
      >
        <Text style={isUser ? styles.userText : styles.assistantText}>
          {content}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.inkDark },
  header: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(244,239,229,0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  spark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,90,60,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 22,
    color: colors.cream,
    lineHeight: 24,
  },
  tag: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: "rgba(244,239,229,0.45)",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 2,
  },
  resetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(244,239,229,0.06)",
  },
  resetText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: "rgba(244,239,229,0.6)",
    letterSpacing: 0.4,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(244,239,229,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { padding: 18, gap: 10 },
  loading: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: "rgba(244,239,229,0.5)",
  },
  bubbleRow: { flexDirection: "row" },
  bubble: {
    maxWidth: "82%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
  },
  bubbleAssistant: {
    backgroundColor: "rgba(244,239,229,0.06)",
    borderColor: "rgba(244,239,229,0.06)",
  },
  bubbleUser: {
    backgroundColor: colors.accent,
    borderColor: "transparent",
  },
  userText: {
    color: "#fff",
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
  },
  assistantText: {
    color: "rgba(244,239,229,0.9)",
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(244,239,229,0.08)",
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 140,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    borderRadius: 16,
    backgroundColor: "rgba(244,239,229,0.06)",
    borderWidth: 1,
    borderColor: "rgba(244,239,229,0.1)",
    color: colors.cream,
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 20,
  },
  sendBtn: {
    paddingHorizontal: 18,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
  },
  sendBtnIdle: { backgroundColor: "rgba(244,239,229,0.1)" },
  sendText: {
    fontFamily: fonts.sansSemibold,
    fontSize: 14,
    color: "#fff",
  },
});
