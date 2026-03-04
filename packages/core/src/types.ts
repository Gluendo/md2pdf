export interface BrandColors {
  primary: string;
  accent: string;
  secondary: string;
  warning: string;
  lightGrey: string;
  borderGrey: string;
}

export interface BrandFont {
  family: string;
  url: string | null;
}

export interface BrandConfig {
  name: string;
  header: string;
  footer: string;
  colors: BrandColors;
  font: BrandFont;
}

export const DEFAULT_BRAND: BrandConfig = {
  name: 'Document',
  header: '',
  footer: '',
  colors: {
    primary: '#1a365d',
    accent: '#3182ce',
    secondary: '#2c7a7b',
    warning: '#c53030',
    lightGrey: '#f7fafc',
    borderGrey: '#e2e8f0',
  },
  font: {
    family: 'system-ui, -apple-system, sans-serif',
    url: null,
  },
};
