import React from "react";
import { Image, ImageSourcePropType, StyleSheet, View } from "react-native";

// Falls du TypeScript nutzt, definieren wir die Props
interface HeaderLogoProps {
  source?: ImageSourcePropType;
}

export const HeaderLogo = ({ source }: HeaderLogoProps) => {
  return (
    <View style={styles.container}>
      <Image
        // Nutze das übergebene Bild oder standardmäßig dein CISM Logo
        source={source || require("@/assets/images/CISM_logo_RGB-1024x409.png")}
        style={styles.logo}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "flex-start", // Zwingt das Logo nach links
    justifyContent: "center", // Zentriert es vertikal im Header-Bereich
  },
  logo: {
    width: "100%",
    aspectRatio: 551 / 220,
    resizeMode: "contain",
    marginTop: 20,
    marginLeft: 20,
    marginBottom: 20,
    maxWidth: 551,
  },
});
