import { MD3LightTheme as DefaultTheme } from "react-native-paper";
import { colors } from "./colors";

// Tema com cores mais frias e vibrantes
export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.purple,
    secondary: colors.blue,
  },
};

// Estilos de tema adicionais
export const themeStyles = {
  // Gradientes de fundo
  gradients: {
    main: [colors.darkest, colors.dark],
    card: [colors.purple + '15', colors.blue + '10'],
  },
  
  // Cards e containers
  card: {
    background: colors.cardBg,
    backgroundStrong: colors.cardBgStrong,
    border: colors.border,
    borderStrong: colors.borderStrong,
  },
  
  // Ícones coloridos
  icons: {
    purple: {
      bg: colors.purpleLight,
      color: colors.purple,
      border: colors.purple + '40',
    },
    blue: {
      bg: colors.blueLight,
      color: colors.blue,
      border: colors.blue + '40',
    },
    green: {
      bg: 'rgba(16, 185, 129, 0.2)',
      color: colors.green,
      border: colors.green + '40',
    },
    red: {
      bg: 'rgba(244, 63, 94, 0.2)',
      color: colors.red,
      border: colors.red + '40',
    },
    orange: {
      bg: 'rgba(245, 158, 11, 0.2)',
      color: colors.orange,
      border: colors.orange + '40',
    },
  },
  
  // Botões
  buttons: {
    primary: {
      background: colors.purple,
      text: colors.white,
    },
    secondary: {
      background: colors.blue,
      text: colors.white,
    },
    outline: {
      background: 'transparent',
      border: colors.border,
      text: colors.whiteOpacity80,
    },
  },
  
  // Textos
  text: {
    primary: colors.white,
    secondary: colors.whiteOpacity60,
    strong: colors.whiteOpacity80,
  },
  
  // Status
  status: {
    success: colors.green,
    error: colors.red,
    warning: colors.orange,
    info: colors.blue,
  },
};

