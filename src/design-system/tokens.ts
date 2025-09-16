// Design Tokens for Crypto Trading Platform
// Based on Tailwind V4 CSS variables and extended for trading-specific needs

export const designTokens = {
  // Colors
  colors: {
    // Base colors
    background: {
      primary: 'var(--background)',
      secondary: 'var(--card)',
      tertiary: 'var(--muted)',
    },
    foreground: {
      primary: 'var(--foreground)',
      secondary: 'var(--muted-foreground)',
      tertiary: 'var(--accent-foreground)',
    },
    
    // Trading-specific colors
    trading: {
      buy: '#22c55e',      // Green for buy orders
      sell: '#ef4444',     // Red for sell orders
      bullish: '#16a34a',  // Darker green for uptrends
      bearish: '#dc2626',  // Darker red for downtrends
      neutral: '#6b7280', // Gray for neutral states
      warning: '#f59e0b',  // Yellow for warnings
      info: '#3b82f6',     // Blue for info
    },
    
    // Status colors
    status: {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6',
      pending: '#8b5cf6',
    },
    
    // Chart colors
    chart: {
      primary: 'var(--chart-1)',
      secondary: 'var(--chart-2)',
      tertiary: 'var(--chart-3)',
      quaternary: 'var(--chart-4)',
      quinary: 'var(--chart-5)',
      grid: 'var(--border)',
      axis: 'var(--muted-foreground)',
    },
    
    // Order book colors
    orderBook: {
      bid: 'rgba(34, 197, 94, 0.1)',     // Light green background
      ask: 'rgba(239, 68, 68, 0.1)',     // Light red background
      bidText: '#22c55e',
      askText: '#ef4444',
      spread: '#6b7280',
    },
  },

  // Spacing
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '0.75rem',    // 12px
    lg: '1rem',       // 16px
    xl: '1.5rem',     // 24px
    '2xl': '2rem',    // 32px
    '3xl': '3rem',    // 48px
    '4xl': '4rem',    // 64px
    
    // Component-specific spacing
    component: {
      padding: {
        card: '1.5rem',
        button: '0.75rem 1rem',
        input: '0.5rem 0.75rem',
        modal: '2rem',
      },
      margin: {
        section: '2rem',
        element: '1rem',
        tight: '0.5rem',
      },
      gap: {
        grid: '1.5rem',
        list: '0.5rem',
        inline: '0.25rem',
      },
    },
  },

  // Typography
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      display: ['Inter', 'system-ui', 'sans-serif'],
    },
    
    fontSize: {
      xs: '0.75rem',     // 12px
      sm: '0.875rem',    // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',    // 18px
      xl: '1.25rem',     // 20px
      '2xl': '1.5rem',   // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
    },
    
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
    
    // Trading-specific typography
    trading: {
      price: {
        fontSize: '1.125rem',
        fontWeight: '600',
        fontFamily: 'mono',
      },
      amount: {
        fontSize: '0.875rem',
        fontWeight: '500',
        fontFamily: 'mono',
      },
      percentage: {
        fontSize: '0.75rem',
        fontWeight: '500',
      },
    },
  },

  // Borders & Radius
  borders: {
    width: {
      none: '0',
      thin: '1px',
      medium: '2px',
      thick: '4px',
    },
    radius: {
      none: '0',
      sm: '0.25rem',
      md: '0.375rem',
      lg: 'var(--radius)',
      xl: '0.75rem',
      full: '9999px',
    },
    color: 'var(--border)',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    
    // Trading-specific shadows
    trading: {
      card: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      modal: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      dropdown: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    },
  },

  // Animations
  animations: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
      slower: '1000ms',
    },
    
    easing: {
      linear: 'linear',
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
      spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
    
    // Trading-specific animations
    trading: {
      priceFlash: {
        duration: '300ms',
        easing: 'ease-out',
      },
      orderBook: {
        duration: '150ms',
        easing: 'ease-in-out',
      },
      chart: {
        duration: '500ms',
        easing: 'ease-out',
      },
    },
  },

  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
    
    // Trading-specific breakpoints
    trading: {
      mobile: '480px',
      tablet: '768px',
      desktop: '1024px',
      wide: '1440px',
    },
  },

  // Z-Index
  zIndex: {
    base: 0,
    dropdown: 10,
    overlay: 20,
    modal: 30,
    popover: 40,
    tooltip: 50,
    notification: 60,
  },

  // Component-specific tokens
  components: {
    button: {
      height: {
        sm: '2rem',
        md: '2.5rem',
        lg: '3rem',
      },
      padding: {
        sm: '0.5rem 0.75rem',
        md: '0.75rem 1rem',
        lg: '1rem 1.5rem',
      },
    },
    
    input: {
      height: {
        sm: '2rem',
        md: '2.5rem',
        lg: '3rem',
      },
      padding: '0.5rem 0.75rem',
    },
    
    card: {
      padding: '1.5rem',
      borderRadius: 'var(--radius)',
      shadow: 'var(--shadow-md)',
    },
    
    // Trading-specific components
    orderBook: {
      rowHeight: '1.5rem',
      padding: '0.25rem 0.5rem',
      fontSize: '0.75rem',
    },
    
    chart: {
      minHeight: '300px',
      defaultHeight: '400px',
      padding: '1rem',
    },
    
    priceDisplay: {
      fontSize: '1.125rem',
      fontWeight: '600',
      fontFamily: 'mono',
    },
  },
} as const;

// Type exports for TypeScript support
export type DesignTokens = typeof designTokens;
export type ColorTokens = typeof designTokens.colors;
export type SpacingTokens = typeof designTokens.spacing;
export type TypographyTokens = typeof designTokens.typography;

// Helper functions
export const getColor = (path: string): string => {
  const keys = path.split('.');
  let current: any = designTokens.colors;
  
  for (const key of keys) {
    if (current[key]) {
      current = current[key];
    } else {
      console.warn(`Color token not found: ${path}`);
      return '#000000';
    }
  }
  
  return current;
};

export const getSpacing = (size: keyof typeof designTokens.spacing): string => {
  return designTokens.spacing[size] || designTokens.spacing.md;
};

export const getAnimation = (
  property: string,
  duration: keyof typeof designTokens.animations.duration = 'normal',
  easing: keyof typeof designTokens.animations.easing = 'ease'
): string => {
  return `${property} ${designTokens.animations.duration[duration]} ${designTokens.animations.easing[easing]}`;
};