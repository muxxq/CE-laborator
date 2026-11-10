import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { CartProvider } from '@/context/cart-context';
import { RegionProvider } from '@/context/region-context';

// Tema navigației (header-e, bara de tab-uri, meniul lateral) construită din paleta Boabă
const BoabaLightTheme = {
  ...DefaultTheme,
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
                  title: 'Checkout',
                  presentation: 'card',
                  headerBackButtonDisplayMode: "minimal",
                }}
              />
              <Stack.Screen
                name="order-confirmation/[id]"
                options={{
                  headerShown: true,
                  title: 'Order Confirmed',
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
