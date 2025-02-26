/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

/**
 * GameOn color theme - Retro gaming inspired with bright and engaging colors
 */

const primaryColor = '#FF5252'; // Bright red
const secondaryColor = '#4CAF50'; // Bright green
const accentColor = '#2196F3'; // Bright blue
const highlightColor = '#FFEB3B'; // Bright yellow

export const Colors = {
  light: {
    text: '#11181C',
    background: '#F5F5F5',
    tint: primaryColor,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: primaryColor,
    primary: primaryColor,
    secondary: secondaryColor,
    accent: accentColor,
    highlight: highlightColor,
    card: '#FFFFFF',
    border: '#E0E0E0',
  },
  dark: {
    text: '#ECEDEE',
    background: '#121212', // Dark background
    tint: primaryColor,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: primaryColor,
    primary: primaryColor,
    secondary: secondaryColor,
    accent: accentColor,
    highlight: highlightColor,
    card: '#1E1E1E',
    border: '#333333',
  },
};
