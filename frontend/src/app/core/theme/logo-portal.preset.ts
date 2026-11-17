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
      dark: {
        primary: {
          color: '{red.400}',
          contrastColor: '{zinc.950}',
          hoverColor: '{red.300}',
          activeColor: '{red.200}',
        },
        surface: {
          0: '#ffffff',
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#141416',
          950: '#09090b',
        },
        highlight: {
          background: 'rgba(248, 113, 113, 0.14)',
          focusBackground: 'rgba(248, 113, 113, 0.22)',
          color: '{red.300}',
          focusColor: '{red.200}',
        },
      },
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
