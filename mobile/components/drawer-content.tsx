import { DrawerContentComponentProps, DrawerContentScrollView } from "expo-router/drawer";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { RegionSelector } from "./region-selector";

export function DrawerContent(props: DrawerContentComponentProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <DrawerContentScrollView {...props}>
      <View style={[styles.logoContainer, { borderBottomColor: colors.border }]}>
        <Image
          source={
            colorScheme === "dark"
              ? require("@/assets/images/logo-boaba-dark.png")
              : require("@/assets/images/logo-boaba.png")
          }
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="Boabă"
        />
      </View>
      <View style={styles.container}>
        <RegionSelector onRegionChange={() => props.navigation.closeDrawer()} />
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logoContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    marginBottom: 8,
    borderBottomWidth: 1,
  },
  logo: {
    height: 40,
    width: 119,
  },
});

