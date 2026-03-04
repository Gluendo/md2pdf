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
export declare const DEFAULT_BRAND: BrandConfig;
