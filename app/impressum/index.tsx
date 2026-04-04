import { StyleSheet, View } from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Image } from "expo-image";

import Footer from "@/components/Footer";
import { useTheme } from "@react-navigation/native";
import * as Linking from "expo-linking";

// 🔒 einfache Obfuskation
const getEmail = () => {
  const user = ["udo", "gerhards"].join("");
  const domain = ["online", "de"].join(".");
  return `${user}@${domain}`;
};

export default function ImpressumScreen() {
  const { colors } = useTheme();

  const email = getEmail();

  const handleEmailPress = () => {
    Linking.openURL(`mailto:${email}`);
  };

  return (
    <View style={{ flex: 1 }}>
      <ParallaxScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{
          backgroundColor: colors.background,
          flexGrow: 1,
        }}
        headerBackgroundColor={{
          light: colors.card,
          dark: colors.card,
        }}
        headerImage={
          <Image
            source={require("@/assets/images/CISM_logo_RGB-1024x409.png")}
            style={styles.reactLogo}
          />
        }
      >
        <ThemedView
          style={[styles.container, { backgroundColor: colors.background }]}
        >
          <ThemedText style={styles.title}>Impressum</ThemedText>

          <ThemedText style={styles.text}>
            Udo Gerhards{"\n"}
            Vogelherdstraße 8{"\n"}
            90559 Burgthann / Oberferrieden{"\n\n"}
            E-Mail:
          </ThemedText>

          {/* 🔥 Klickbare, obfuskierte Mail */}
          <ThemedText
            style={[styles.link, { color: colors.primary }]}
            onPress={handleEmailPress}
          >
            {email}
          </ThemedText>
        </ThemedView>
      </ParallaxScrollView>
      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
  },

  title: {
    fontSize: 20,
    fontWeight: "bold",
  },

  text: {
    fontSize: 16,
    lineHeight: 22,
  },

  link: {
    fontSize: 16,
    textDecorationLine: "underline",
  },

  reactLogo: {
    height: 163,
    width: 408,
    marginTop: 40,
    marginLeft: 30,
  },
});
