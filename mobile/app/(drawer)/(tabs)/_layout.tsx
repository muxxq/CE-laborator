import { useColorScheme } from '@/hooks/use-color-scheme';
import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useCart } from '@/context/cart-context';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { cart } = useCart();

  const itemCount = cart?.items?.length || 0;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: true,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Boabă',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color as string} />,
          headerShown: false, // Let the home stack manage its own headers
        }}
      />
      <Tabs.Screen
        name="(cart)"
        options={{
          title: 'Coș',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="cart.fill" color={color as string} />,
          tabBarBadge: itemCount > 0 ? itemCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: Colors[colorScheme ?? 'light'].tint,
          },
          headerShown: false, // Let the cart stack manage its own headers
        }}
      />
    </Tabs>
  );
}

