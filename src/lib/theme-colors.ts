/**
 * Semantic Color Utilities
 * 
 * Provides consistent, theme-aware color utilities for status indicators,
 * badges, and other UI elements. These utilities automatically adapt to
 * light/dark mode changes.
 */

export const statusColors = {
    success: 'bg-success text-success-foreground',
    warning: 'bg-warning text-warning-foreground',
    error: 'bg-destructive text-destructive-foreground',
    info: 'bg-info text-info-foreground',
} as const;

export const statusColorsSoft = {
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    error: 'bg-destructive/10 text-destructive border-destructive/20',
    info: 'bg-info/10 text-info border-info/20',
} as const;

export const statusColorsSubtle = {
    success: 'bg-success/5 text-success-foreground/80',
    warning: 'bg-warning/5 text-warning-foreground/80',
    error: 'bg-destructive/5 text-destructive-foreground/80',
    info: 'bg-info/5 text-info-foreground/80',
} as const;

export type StatusType = keyof typeof statusColors;

/**
 * Helper function to get status color classes
 */
export function getStatusColor(status: StatusType, variant: 'default' | 'soft' | 'subtle' = 'default') {
    switch (variant) {
        case 'soft':
            return statusColorsSoft[status];
        case 'subtle':
            return statusColorsSubtle[status];
        default:
            return statusColors[status];
    }
}

/**
 * Health severity color mapping
 */
export const healthSeverityColors = {
    mild: 'bg-success/10 text-success',
    moderate: 'bg-warning/10 text-warning',
    severe: 'bg-destructive/10 text-destructive',
    critical: 'bg-destructive text-destructive-foreground',
} as const;

/**
 * Stock level color mapping
 */
export const stockLevelColors = {
    good: 'bg-success/10 text-success',
    low: 'bg-warning/10 text-warning',
    critical: 'bg-destructive/10 text-destructive',
    expired: 'bg-destructive text-destructive-foreground',
} as const;

/**
 * Animal status color mapping
 */
export const animalStatusColors = {
    healthy: 'bg-success/10 text-success',
    sick: 'bg-destructive/10 text-destructive',
    pregnant: 'bg-info/10 text-info',
    dry: 'bg-warning/10 text-warning',
    sold: 'bg-muted text-muted-foreground',
} as const;
