import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useFonts as useInter, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { useFonts as useSerif, InstrumentSerif_400Regular_Italic } from "@expo-google-fonts/instrument-serif";
import { useFonts as useMono, JetBrainsMono_400Regular, JetBrainsMono_500Medium } from "@expo-google-fonts/jetbrains-mono";
import { ClerkProvider } from "@clerk/clerk-expo";
import Constants from "expo-constants";
import { StoreProvider } from "../src/lib/store";
import { tokenCache } from "../src/lib/tokenCache";
import { colors } from "../src/lib/theme";
import { View, Text, StyleSheet } from "react-native";

SplashScreen.preventAutoHideAsync().catch(() => {});

const publishableKey =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  ((Constants.expoConfig?.extra as any)?.clerkPublishableKey as string | undefined);

export default function RootLayout() {
  const [interLoaded] = useInter({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  const [serifLoaded] = useSerif({ InstrumentSerif_400Regular_Italic });
  const [monoLoaded] = useMono({ JetBrainsMono_400Regular, JetBrainsMono_500Medium });
  const ready = interLoaded && serifLoaded && monoLoaded;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.inkDark }} />;

  if (!publishableKey) {
    return (
      <SafeAreaProvider>
        <View style={styles.missingKey}>
          <Text style={styles.h}>Clerk publishable key missing</Text>
          <Text style={styles.b}>
            Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in the environment, or add{" "}
            <Text style={{ fontWeight: "700" }}>expo.extra.clerkPublishableKey</Text> in app.json,
            then restart Metro with --clear.
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <SafeAreaProvider>
        <StoreProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.cream } }} />
        </StoreProvider>
      </SafeAreaProvider>
    </ClerkProvider>
  );
}

const styles = StyleSheet.create({
  missingKey: {
    flex: 1, backgroundColor: "#17140f",
    alignItems: "center", justifyContent: "center", padding: 28, gap: 16,
  },
  h: { color: "#f4efe5", fontSize: 18, fontWeight: "700", textAlign: "center" },
  b: { color: "rgba(244,239,229,0.7)", fontSize: 13, lineHeight: 20, textAlign: "center" },
});
