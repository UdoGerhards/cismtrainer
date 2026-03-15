import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from "@/context/AuthContext";
import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';


export default function HomeScreen() {

  const { token, user, loading } = useAuth();

  if (loading) {
    return null;
  }
  
  return (
  
    <>
      {/* 🔥 Erzwingt den Header-Titel für diesen Screen */}

      <ParallaxScrollView
        headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
        headerImage={
          <Image
            source={require('@/assets/images/CISMw.png')}
            style={styles.reactLogo}
          />
        }>

        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Performance!</ThemedText>
        </ThemedView>


        <ThemedView style={styles.fixToText}>

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
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 200,
    width: 290,
  },
  fixToText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});