import { BrandConfig } from './types';
/**
 * Load brand configuration from a JSON file, merging with defaults.
 */
export declare function loadBrandFromFile(filePath: string): BrandConfig;
/**
 * Merge a partial brand config with defaults.
 */
export declare function mergeBrandWithDefaults(partial: Partial<BrandConfig>): BrandConfig;
