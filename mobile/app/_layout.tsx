import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { Colors, FontFamily } from '@/constants/theme';
import { Fraunces_600SemiBold, Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';

import { CartProvider } from '@/context/cart-context';
import { RegionProvider } from '@/context/region-context';

// Fonturile folosite de navigație (titlurile din header, etichetele din tab-uri și din meniu)
const boabaFonts = {
  regular: { fontFamily: FontFamily.regular, fontWeight: '400' as const },
  medium: { fontFamily: FontFamily.medium, fontWeight: '500' as const },
  bold: { fontFamily: FontFamily.titleSemiBold, fontWeight: '600' as const },
  heavy: { fontFamily: FontFamily.title, fontWeight: '700' as const },
};

// Tema navigației (header-e, bara de tab-uri, meniul lateral) construită din paleta Boabă
const BoabaLightTheme = {
  ...DefaultTheme,
  fonts: boabaFonts,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.tint,
    background: Colors.light.background,
    card: Colors.light.cardBackground,
    text: Colors.light.text,
    border: Colors.light.border,
    notification: Colors.light.tint,
  },
};

const BoabaDarkTheme = {
  ...DarkTheme,
  fonts: boabaFonts,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.tint,
    background: Colors.dark.background,
    card: Colors.dark.cardBackground,
    text: Colors.dark.text,
    border: Colors.dark.border,
    notification: Colors.dark.tint,
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Până se încarcă fonturile nu afișăm nimic (durează o fracțiune de secundă)
  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? BoabaDarkTheme : BoabaLightTheme}>
        <RegionProvider>
          <CartProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
              <Stack.Screen
                name="checkout"
                options={{
                  headerShown: true,
                  title: 'Finalizare comandă',
                  presentation: 'card',
                  headerBackButtonDisplayMode: "minimal",
                }}
              />
              <Stack.Screen
                name="order-confirmation/[id]"
                options={{
                  headerShown: true,
                  title: 'Comandă confirmată',
                  headerLeft: () => null,
                  gestureEnabled: false,
                  headerBackVisible: false,
                }}
              />
            </Stack>
            <StatusBar style="auto" />
          </CartProvider>
        </RegionProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
