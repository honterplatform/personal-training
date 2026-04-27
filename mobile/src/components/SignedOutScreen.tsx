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
import { useSignIn, useSignUp } from "@clerk/clerk-expo";
import { colors, fonts } from "../lib/theme";

type Mode = "signup" | "login";
type Step = "credentials" | "verify";

export default function SignedOutScreen() {
  const { signUp, setActive: setSignUpActive, isLoaded: signUpLoaded } = useSignUp();
  const { signIn, setActive: setSignInActive, isLoaded: signInLoaded } = useSignIn();

  const [mode, setMode] = useState<Mode>("signup");
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset(next: Mode) {
    setMode(next);
    setStep("credentials");
    setError(null);
    setCode("");
  }

  async function startSignUp() {
    if (!signUpLoaded || !email.trim() || !password) return;
    setLoading(true); setError(null);
    try {
      await signUp.create({ emailAddress: email.trim(), password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setStep("verify");
    } catch (e: any) {
      setError(extractClerkError(e));
    } finally { setLoading(false); }
  }

  async function completeSignUp() {
    if (!signUpLoaded || !code.trim()) return;
    setLoading(true); setError(null);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code: code.trim() });
      if (result.status === "complete") {
        await setSignUpActive({ session: result.createdSessionId });
      } else {
        setError("Verification failed. Try again.");
      }
    } catch (e: any) {
      setError(extractClerkError(e));
    } finally { setLoading(false); }
  }

  async function logIn() {
    if (!signInLoaded || !email.trim() || !password) return;
    setLoading(true); setError(null);
    try {
      const result = await signIn.create({ identifier: email.trim(), password });
      if (result.status === "complete") {
        await setSignInActive({ session: result.createdSessionId });
      } else {
        setError("Sign in incomplete.");
      }
    } catch (e: any) {
      setError(extractClerkError(e));
    } finally { setLoading(false); }
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
          {step === "credentials" ? (
            <>
              <View style={styles.toggle}>
                <Pressable
                  onPress={() => reset("signup")}
                  style={[styles.toggleTab, mode === "signup" && styles.toggleTabActive]}
                >
                  <Text style={[styles.toggleText, mode === "signup" && styles.toggleTextActive]}>
                    sign up
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => reset("login")}
                  style={[styles.toggleTab, mode === "login" && styles.toggleTabActive]}
                >
                  <Text style={[styles.toggleText, mode === "login" && styles.toggleTextActive]}>
                    log in
                  </Text>
                </Pressable>
              </View>

              <Field
                placeholder="email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
              />
              <Field
                placeholder="password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                textContentType={mode === "signup" ? "newPassword" : "password"}
              />

              {error && <Text style={styles.error}>{error}</Text>}

              <Pressable
                style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }]}
                onPress={mode === "signup" ? startSignUp : logIn}
                disabled={loading || !email.trim() || !password}
              >
                <Text style={styles.buttonText}>
                  {loading ? "…" : mode === "signup" ? "create account" : "enter"}
                </Text>
              </Pressable>

              <Text style={styles.legal}>
                Apple + Google sign-in coming after the next dev build.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.verifyTitle}>check your email</Text>
              <Text style={styles.verifyBody}>
                We sent a 6-digit code to {email}. Enter it below to finish signing up.
              </Text>
              <Field
                placeholder="000000"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="oneTimeCode"
                maxLength={6}
              />
              {error && <Text style={styles.error}>{error}</Text>}
              <Pressable
                style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }]}
                onPress={completeSignUp}
                disabled={loading || code.trim().length < 6}
              >
                <Text style={styles.buttonText}>{loading ? "…" : "verify"}</Text>
              </Pressable>
              <Pressable onPress={() => reset(mode)}>
                <Text style={styles.legal}>← change email</Text>
              </Pressable>
            </>
          )}
        </View>
      </KeyboardAvoidingView>

      <Text style={styles.footer}>free · secured by clerk</Text>
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

function extractClerkError(e: any): string {
  const msg = e?.errors?.[0]?.longMessage || e?.errors?.[0]?.message || e?.message;
  if (msg) return msg;
  return "Something went wrong";
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.inkDark, paddingHorizontal: 32 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  brand: { fontFamily: fonts.serif, fontSize: 88, lineHeight: 92, color: colors.cream, letterSpacing: -3 },
  tag: { fontFamily: fonts.mono, fontSize: 12, letterSpacing: 2, color: colors.cream50, marginTop: 10, textTransform: "uppercase" },
  form: { width: "100%", maxWidth: 340, marginTop: 40, gap: 10 },
  toggle: {
    flexDirection: "row", backgroundColor: colors.cream08, borderRadius: 999,
    padding: 4, marginBottom: 10,
  },
  toggleTab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 999 },
  toggleTabActive: { backgroundColor: colors.accent },
  toggleText: {
    fontFamily: fonts.sansSemibold, fontSize: 13, color: colors.cream50,
    letterSpacing: 0.4, textTransform: "lowercase",
  },
  toggleTextActive: { color: "#fff" },
  field: {
    backgroundColor: colors.cream08, borderRadius: 14, paddingHorizontal: 14,
    paddingVertical: 14, borderWidth: 1, borderColor: "rgba(244,239,229,0.1)",
  },
  input: { color: colors.cream, fontSize: 16, fontFamily: fonts.sans, padding: 0 },
  error: { color: colors.accent, fontFamily: fonts.mono, fontSize: 11, letterSpacing: 0.3 },
  button: {
    marginTop: 4, backgroundColor: colors.accent, borderRadius: 14,
    paddingVertical: 14, alignItems: "center",
  },
  buttonText: { color: "#fff", fontFamily: fonts.sansSemibold, fontSize: 14 },
  legal: {
    marginTop: 6, textAlign: "center",
    fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.6, color: colors.cream35,
  },
  verifyTitle: {
    fontFamily: fonts.serif, fontSize: 32, color: colors.cream,
    textAlign: "center", lineHeight: 36, letterSpacing: -0.5,
  },
  verifyBody: {
    fontFamily: fonts.sans, fontSize: 14, color: colors.cream70,
    textAlign: "center", lineHeight: 20, marginBottom: 8,
  },
  footer: {
    position: "absolute", bottom: 40, left: 0, right: 0, textAlign: "center",
    fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.5, color: colors.cream35,
  },
});
