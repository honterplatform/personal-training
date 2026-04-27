import { useEffect, useRef, useState } from "react";
import {
  Animated,
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

export default function LoginScreen() {
  const { login } = useStore();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!error) return;
    Animated.sequence([
      Animated.timing(shake, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [error, shake]);

  async function submit() {
    if (loading || !password) return;
    setLoading(true);
    setError(false);
    try {
      await login(password);
    } catch {
      setError(true);
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

        <Animated.View style={[styles.form, { transform: [{ translateX: shake }] }]}>
          <View style={[styles.field, error && { borderColor: colors.accent }]}>
            <Text style={styles.lock}>🔒</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="password"
              placeholderTextColor={colors.cream35}
              secureTextEntry
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              onSubmitEditing={submit}
              returnKeyType="go"
            />
          </View>
          <Pressable
            style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }]}
            onPress={submit}
            disabled={loading || !password}
          >
            <Text style={styles.buttonText}>{loading ? "…" : "enter"}</Text>
          </Pressable>
        </Animated.View>
      </KeyboardAvoidingView>

      <Text style={styles.footer}>one user · gated · bogotá</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.inkDark,
    paddingHorizontal: 32,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    fontFamily: fonts.serif,
    fontSize: 96,
    lineHeight: 100,
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
  form: {
    width: "100%",
    maxWidth: 320,
    marginTop: 56,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.cream08,
    borderColor: colors.cream08,
    borderWidth: 1,
    borderRadius: 16,
  },
  lock: { color: colors.cream50, fontSize: 16 },
  input: {
    flex: 1,
    color: colors.cream,
    fontSize: 16,
    fontFamily: fonts.sans,
    padding: 0,
  },
  button: {
    marginTop: 12,
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontFamily: fonts.sansSemibold,
    fontSize: 14,
    letterSpacing: -0.1,
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
