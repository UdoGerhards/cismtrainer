import ParallaxScrollView from '@/components/parallax-scroll-view';
import { Image } from 'expo-image';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Stack, useRouter } from "expo-router";

import client from '@/scripts/client';
import { useEffect, useState } from "react";

export default function HomeScreen() {

  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      try {

        // Login über Zertifikat → JWT holen
        const loggedUser = await client.login();

        setUser(loggedUser);

        // 👉 Weiterleitung zur Questions-Seite
        router.replace("/question");

      } catch (err: any) {

        console.log(err);

        if (err?.status === 401) {
          router.replace("/unauthorized");
        }

      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <>
      {/* Header Titel setzen */}
      <Stack.Screen
        options={{
          title: "Random Question",
        }}
      />

      <ParallaxScrollView
        headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
        headerImage={
          <Image
            source={require('@/assets/images/CISMw.png')}
            style={styles.reactLogo}
          />
        }
      >
        <div>Unauthorized!</div>
      </ParallaxScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  fixToText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});