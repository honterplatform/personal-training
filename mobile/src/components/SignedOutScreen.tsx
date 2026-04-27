import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Circle, Defs, RadialGradient as SvgRadial, Stop } from "react-native-svg";
import { colors, fonts } from "../lib/theme";
import { useStore } from "../lib/store";

type Mode = "login" | "signup";

export default function SignedOutScreen() {
  const { signup, login } = useStore();
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (loading || !email.trim() || !password) return;
    setLoading(true);
    setError(null);
    try {
      if (mode === "signup") {
        await signup(email.trim(), password, displayName.trim() || undefined);
      } else {
        await login(email.trim(), password);
      }
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <SvgRadial id="glow" cx="20%" cy="22%" r="40%">
            <Stop offset="0" stopColor={colors.accent} stopOpacity="0.3" />
            <Stop offset="1" stopColor={colors.accent} stopOpacity="0" />
          </SvgRadial>
        </Defs>
        <Circle cx="0" cy="0" r="500" fill="url(#glow)" />
      </Svg>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.center}
      >
        <Text style={styles.brand}>LOG</Text>
        <Text style={styles.tag}>training daily</Text>

        <View style={styles.form}>
          <View style={styles.toggle}>
            <Pressable
              onPress={() => { setMode("signup"); setError(null); }}
              style={[styles.toggleTab, mode === "signup" && styles.toggleTabActive]}
            >
              <Text style={[styles.toggleText, mode === "signup" && styles.toggleTextActive]}>
                sign up
              </Text>
            </Pressable>
            <Pressable
              onPress={() => { setMode("login"); setError(null); }}
              style={[styles.toggleTab, mode === "login" && styles.toggleTabActive]}
            >
              <Text style={[styles.toggleText, mode === "login" && styles.toggleTextActive]}>
                log in
              </Text>
            </Pressable>
          </View>

          {mode === "signup" && (
            <Field
              placeholder="display name (optional)"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
            />
          )}
          <Field
            placeholder="email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Field
            placeholder="password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={submit}
            returnKeyType="go"
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }]}
            onPress={submit}
            disabled={loading || !email.trim() || !password}
          >
            <Text style={styles.buttonText}>
              {loading ? "…" : mode === "signup" ? "create account" : "enter"}
            </Text>
          </Pressable>

          <Text style={styles.legal}>
            Apple + Google sign-in coming after the next dev build.
          </Text>
        </View>
      </KeyboardAvoidingView>

      <Text style={styles.footer}>
        {mode === "signup" ? "free · gated · bogotá" : "welcome back"}
      </Text>
    </View>
  );
}

function Field(props: React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.field}>
      <TextInput
        placeholderTextColor={colors.cream35}
        style={styles.input}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.inkDark, paddingHorizontal: 32 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  brand: {
    fontFamily: fonts.serif,
    fontSize: 88,
    lineHeight: 92,
    color: colors.cream,
    letterSpacing: -3,
  },
  tag: {
    fontFamily: fonts.mono,
    fontSize: 12,
    letterSpacing: 2,
    color: colors.cream50,
    marginTop: 10,
    textTransform: "uppercase",
  },
  form: { width: "100%", maxWidth: 340, marginTop: 40, gap: 10 },
  toggle: {
    flexDirection: "row",
    backgroundColor: colors.cream08,
    borderRadius: 999,
    padding: 4,
    marginBottom: 10,
  },
  toggleTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 999,
  },
  toggleTabActive: { backgroundColor: colors.accent },
  toggleText: {
    fontFamily: fonts.sansSemibold,
    fontSize: 13,
    color: colors.cream50,
    letterSpacing: 0.4,
    textTransform: "lowercase",
  },
  toggleTextActive: { color: "#fff" },
  field: {
    backgroundColor: colors.cream08,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(244,239,229,0.1)",
  },
  input: {
    color: colors.cream,
    fontSize: 16,
    fontFamily: fonts.sans,
    padding: 0,
  },
  error: {
    color: colors.accent,
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 0.3,
  },
  button: {
    marginTop: 4,
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontFamily: fonts.sansSemibold,
    fontSize: 14,
  },
  legal: {
    marginTop: 6,
    textAlign: "center",
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.6,
    color: colors.cream35,
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    textAlign: "center",
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.cream35,
  },
});
