import { useColorScheme } from '@/hooks/use-color-scheme';
import { DrawerActions } from 'expo-router/react-navigation';
import { Stack, useNavigation } from 'expo-router';
import React from 'react';
import { Image, TouchableOpacity } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';

export default function HomeStackLayout() {
  const colorScheme = useColorScheme();
  const navigation = useNavigation();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Stack
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen 
        name="index"
        options={{
          title: 'Boabă',
          // logo-ul în locul textului din header (varianta deschisă pe fundal închis)
          headerTitle: () => (
            <Image
              source={
                colorScheme === 'dark'
                  ? require('@/assets/images/logo-boaba-dark.png')
                  : require('@/assets/images/logo-boaba.png')
              }
              style={{ height: 30, width: 89 }}
              resizeMode="contain"
              accessibilityLabel="Boabă"
            />
          ),
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
              style={{ height: 36, width: 36, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <IconSymbol size={28} name="line.3.horizontal" color={colors.icon} />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen 
        name="product/[id]"
        options={{
          title: 'Product Details',
          presentation: 'card',
          headerBackButtonDisplayMode: "minimal"
        }}
      />
    </Stack>
  );
}

