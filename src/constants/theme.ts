// Central design tokens for SCCRM.
// Corporate identity roots: Blue #0000FE, Yellow #FCFF59, White #FFFFFF.
// These are the refined, premium-grade derivatives — less harsh, more trustworthy.

export const theme = {
  colors: {
    // ── Brand ──────────────────────────────────────────────────────────────
    brand: '#0B1FB8',         // deep royal blue — primary CTA, key headings
    brandAccent: '#1D3CFF',   // brighter blue — active / focused states
    brandYellow: '#F6E96B',   // soft premium yellow — reserved for badge/accent use

    // ── Surfaces ───────────────────────────────────────────────────────────
    pageBackground: '#FAFAF4', // warm ivory — app shell background
    cardBackground: '#FFFFFF', // card / section surfaces
    inputBackground: '#F9FAFB', // text input fields

    // ── Text ───────────────────────────────────────────────────────────────
    textHeading: '#111827',    // titles, big numbers, primary labels
    textBody: '#374151',       // body text, data rows
    textMuted: '#6B7280',      // subtitles, helpers, meta timestamps
    textPlaceholder: '#9CA3AF',// input placeholder text
    textOnBrand: '#FFFFFF',    // any text placed on brand blue

    // ── Borders & dividers ─────────────────────────────────────────────────
    border: '#E5E7EB',         // card outlines, input strokes
    borderLight: '#F3F4F6',    // interior list dividers

    // ── Progress ───────────────────────────────────────────────────────────
    progressTrack: '#E0E7FF',  // tier bar background (light indigo)

    // ── Buttons ────────────────────────────────────────────────────────────
    primaryBg: '#0B1FB8',
    primaryText: '#FFFFFF',
    secondaryBg: '#EEF1FF',    // light indigo wash
    secondaryText: '#0B1FB8',
    ghostBorder: '#C7D2FE',    // indigo-200
    ghostText: '#0B1FB8',
    accentYellowBg: '#FFF3CD', // warm cream — register / accent CTA
    accentYellowText: '#7A4500', // dark amber — text on accentYellow

    // ── Status banner ──────────────────────────────────────────────────────
    messageBg: '#EEF2FF',      // indigo-50
    messageText: '#0B1FB8',

    // ── Semantic feedback ──────────────────────────────────────────────────
    success: '#16A34A',
    warning: '#D97706',
    error: '#DC2626',

    // ── Destructive / logout ───────────────────────────────────────────────
    logoutText: '#991B1B',      // dark red — logout label
    logoutBg: '#FEF2F2',        // very light red wash — logout section bg

    // ── Tier badge ─────────────────────────────────────────────────────────
    brandYellowText: '#78350F', // amber-900 — dark text on brandYellow for contrast
  },

  radius: {
    sm: 10,
    md: 14,
    lg: 18,
    full: 999,
  },

  spacing: {
    xs: 8,
    sm: 12,
    md: 18,
    lg: 24,
  },

  // Android elevation + iOS shadow (subtle depth for cards)
  shadow: {
    card: {
      elevation: 2,
      shadowColor: '#0B1FB8',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
    },
  },
} as const;
