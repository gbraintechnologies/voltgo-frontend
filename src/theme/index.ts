// ─────────────────────────────────────────────
//  VoltGO Design System
//  Single source of truth for all design tokens
// ─────────────────────────────────────────────

export const Colors = {
  // Brand
  primary: '#3EE06A',        // main green (splash / buttons)
  primaryDark: '#2BC757',    // pressed state
  primaryLight: '#6EED91',   // light tint
  primaryBg: '#3EE06A',      // green section background

  // Navy (logo / headings)
  navy: '#0F1F3D',
  navyLight: '#1A3060',

  // Neutrals
  white: '#FFFFFF',
  offWhite: '#F7F7F7',
  inputBg: '#F2F2F2',
  border: '#E5E5E5',
  placeholder: '#AAAAAA',

  // Text
  textPrimary: '#0F1F3D',
  textSecondary: '#555555',
  textMuted: '#888888',
  textLink: '#3EE06A',

  // Status
  error: '#FF4444',
  success: '#3EE06A',

  // Overlay / watermark
  logoWatermark: 'rgba(15, 31, 61, 0.08)',
};

export const Typography = {
  fontBold: 'Poppins-Bold',
  fontExtraBold: 'Poppins-ExtraBold',      // fallback if no ExtraBold
  fontSemiBold: 'Poppins-SemiBold',
  fontRegular: 'Poppins-Regular',
  fontMedium: 'Poppins-Medium',
  fontCondensed: 'helvetica-compressed',  // headings

  xs: 9,
  sm: 12,
  base: 13,
  md: 15,
  lg: 18,
  xl: 22, 
  xxl: 26,
  display: 32,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const Shadow = {
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
};

export default { Colors, Typography, Spacing, Radius, Shadow };
