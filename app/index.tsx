import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

import client from '@/scripts/tst/client';
import { useEffect, useState } from "react";

export default function HomeScreen() {

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const u = await client.getUser();
        setUser(u);
      } catch (err) {
        console.error("User konnte nicht geladen werden:", err);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  // ⛔ Solange User geladen wird → nichts anzeigen oder Loader
  if (loading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ThemedText type="default">Loading…</ThemedText>
      </ThemedView>
    );
  }

  // ✅ Erst jetzt wird die Seite angezeigt
  return (
    <>
      <ParallaxScrollView
        headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
        headerImage={
          <Image
            source={require('@/assets/images/partial-react-logo.png')}
            style={styles.reactLogo}
          />
        }>

        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">
            Welcome, {user.firstname}!
          </ThemedText>

          <HelloWave />
        </ThemedView>

      </ParallaxScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
