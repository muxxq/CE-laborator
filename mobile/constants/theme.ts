/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// Paleta Boaba: crem + espresso + accent teracota
const tintColorLight = '#C0583A'; // teracota
const tintColorDark = '#E07A5A'; // teracota deschisa

export const Colors = {
  light: {
    text: '#2B1D14', // espresso
    background: '#F7F1E8', // crem
    tint: tintColorLight,
    onTint: '#FFFFFF', // textul de pe butoanele cu fundal teracota
    icon: '#8A7A6C', // gri cald (text secundar, iconite)
    tabIconDefault: '#8A7A6C',
    tabIconSelected: tintColorLight,
    border: '#E6DACB',
    cardBackground: '#FFFBF5',
    error: '#B3261E',
    warning: '#D9822B',
    success: '#4F7A3A',
    imagePlaceholder: '#EDE3D6',
    toastBackground: '#2B1D14',
    toastText: '#F7F1E8',
  },
  dark: {
    text: '#F2E8DC', // crem
    background: '#1A1411', // espresso
    tint: tintColorDark,
    onTint: '#1A1411', // pe teracota deschisa, textul inchis se citeste mai bine
    icon: '#A89888',
    tabIconDefault: '#A89888',
    tabIconSelected: tintColorDark,
    border: '#3A2E26',
    cardBackground: '#241C17',
    error: '#E5736B',
    warning: '#E8A25A',
    success: '#8DB36F',
    imagePlaceholder: '#2E241E',
    toastBackground: '#F2E8DC',
    toastText: '#1A1411',
  },
};

// Fonturile Boabă (încărcate în app/_layout.tsx cu useFonts).
export const FontFamily = {
  title: 'Fraunces_700Bold', // titluri mari (serif, „de cafenea”)
  titleSemiBold: 'Fraunces_600SemiBold', // subtitluri, prețuri mari
  regular: 'Inter_400Regular', // text normal
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold', // butoane, etichete
  bold: 'Inter_700Bold',
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
