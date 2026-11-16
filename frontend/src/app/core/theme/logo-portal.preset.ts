import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

export const LogoPortalPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{red.50}',
      100: '{red.100}',
      200: '{red.200}',
      300: '{red.300}',
      400: '{red.400}',
      500: '{red.500}',
      600: '{red.600}',
      700: '{red.700}',
      800: '{red.800}',
      900: '{red.900}',
      950: '{red.950}',
    },
    colorScheme: {
      light: {
        primary: {
          color: '{red.700}',
          contrastColor: '#ffffff',
          hoverColor: '{red.800}',
          activeColor: '{red.900}',
        },
        surface: {
          0: '#ffffff',
          50: '{zinc.50}',
          100: '{zinc.100}',
          200: '{zinc.200}',
          300: '{zinc.300}',
          400: '{zinc.400}',
          500: '{zinc.500}',
          600: '{zinc.600}',
          700: '{zinc.700}',
          800: '{zinc.800}',
          900: '{zinc.900}',
          950: '{zinc.950}',
        },
        highlight: {
          background: '{red.50}',
          focusBackground: '{red.100}',
          color: '{red.800}',
          focusColor: '{red.900}',
        },
      },
    },
  },
});
