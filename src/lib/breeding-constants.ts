/**
 * Breeding Constants for MTK Dairy
 * 
 * Species-specific gestation periods, pregnancy check windows,
 * and breeding-related constants for professional farm management.
 */

import type { AnimalSpecies } from '@/types/database';

// =============================================================================
// GESTATION PERIODS (in days)
// =============================================================================

export interface GestationPeriod {
    average: number;
    min: number;
    max: number;
    label: string; // 'Gestation' or 'Incubation' for eggs
}

export const GESTATION_PERIODS: Record<AnimalSpecies, GestationPeriod> = {
    chicken: { average: 21, min: 19, max: 23, label: 'Incubation' },
    goat: { average: 150, min: 145, max: 155, label: 'Gestation' },
    sheep: { average: 150, min: 144, max: 157, label: 'Gestation' },
    cow: { average: 283, min: 279, max: 292, label: 'Gestation' },
    buffalo: { average: 310, min: 300, max: 340, label: 'Gestation' },
    horse: { average: 340, min: 320, max: 370, label: 'Gestation' },
};


// =============================================================================
// PREGNANCY CHECK WINDOWS (days after AI/breeding)
// =============================================================================

export interface CheckWindow {
    min: number;
    max: number;
    recommended?: boolean;
}

export interface PregnancyCheckWindows {
    ultrasound?: CheckWindow;
    blood_test?: CheckWindow;
    rectal_palpation?: CheckWindow;
    behavioral?: CheckWindow;
}

export const PREGNANCY_CHECK_WINDOWS: Partial<Record<AnimalSpecies, PregnancyCheckWindows>> = {
    cow: {
        ultrasound: { min: 26, max: 30, recommended: true },
        blood_test: { min: 28, max: 30 },
        rectal_palpation: { min: 35, max: 50 },
        behavioral: { min: 18, max: 24 },
    },
    buffalo: {
        ultrasound: { min: 30, max: 40, recommended: true },
        blood_test: { min: 28, max: 31 },
        rectal_palpation: { min: 45, max: 60 },
        behavioral: { min: 18, max: 24 },
    },
    goat: {
        ultrasound: { min: 25, max: 35, recommended: true },
        blood_test: { min: 28, max: 30 },
        behavioral: { min: 18, max: 21 },
    },
    sheep: {
        ultrasound: { min: 25, max: 35, recommended: true },
        blood_test: { min: 28, max: 30 },
        behavioral: { min: 16, max: 20 },
    },
    horse: {
        ultrasound: { min: 14, max: 16, recommended: true },
        rectal_palpation: { min: 18, max: 25 },
        behavioral: { min: 15, max: 21 },
    },
};

// =============================================================================
// BREEDING METHOD TYPES
// =============================================================================

export type BreedingMethod = 'natural' | 'artificial_insemination';

export const BREEDING_METHODS: { value: BreedingMethod; label: string; description: string }[] = [
    {
        value: 'natural',
        label: 'Natural Mating',
        description: 'Breeding with a bull/sire present on the farm',
    },
    {
        value: 'artificial_insemination',
        label: 'Artificial Insemination (AI)',
        description: 'Using frozen semen from a certified semen bank',
    },
];

// =============================================================================
// PREGNANCY CHECK METHODS
// =============================================================================

export type PregnancyCheckMethod =
    | 'ultrasound'
    | 'blood_test'
    | 'rectal_palpation'
    | 'behavioral';

export const PREGNANCY_CHECK_METHODS: {
    value: PregnancyCheckMethod;
    label: string;
    description: string;
    accuracy: string;
}[] = [
        {
            value: 'ultrasound',
            label: 'Ultrasound',
            description: 'Veterinary ultrasound examination - can detect heartbeat',
            accuracy: '95-99%',
        },
        {
            value: 'blood_test',
            label: 'Blood/Milk Test (PAG)',
            description: 'Pregnancy-Associated Glycoprotein test',
            accuracy: '98-99%',
        },
        {
            value: 'rectal_palpation',
            label: 'Rectal Palpation',
            description: 'Veterinary manual examination (for larger animals)',
            accuracy: '85-95%',
        },
        {
            value: 'behavioral',
            label: 'Behavioral (Non-Return to Heat)',
            description: 'Animal fails to return to heat after breeding',
            accuracy: '70-80%',
        },
    ];

// =============================================================================
// PREGNANCY CHECK RESULT TYPES
// =============================================================================

export type PregnancyCheckResult = 'positive' | 'negative' | 'inconclusive';

export const PREGNANCY_CHECK_RESULTS: { value: PregnancyCheckResult; label: string; color: string }[] = [
    { value: 'positive', label: 'Pregnant', color: 'green' },
    { value: 'negative', label: 'Not Pregnant', color: 'red' },
    { value: 'inconclusive', label: 'Inconclusive', color: 'yellow' },
];

// =============================================================================
// BREEDING STATUS TYPES
// =============================================================================

export type BreedingStatus =
    | 'inseminated'      // Just bred, waiting for confirmation
    | 'check_pending'    // Time for pregnancy check
    | 'confirmed'        // Pregnancy confirmed
    | 'not_pregnant'     // Check was negative
    | 'pregnant'         // Actively pregnant (confirmed)
    | 'delivered'        // Successfully gave birth
    | 'failed'           // Pregnancy failed/aborted
    | 'overdue';         // Past expected due date

export const BREEDING_STATUSES: { value: BreedingStatus; label: string; color: string; icon: string }[] = [
    { value: 'inseminated', label: 'Inseminated', color: 'blue', icon: '💉' },
    { value: 'check_pending', label: 'Check Due', color: 'orange', icon: '🔍' },
    { value: 'confirmed', label: 'Confirmed', color: 'teal', icon: '✅' },
    { value: 'not_pregnant', label: 'Not Pregnant', color: 'gray', icon: '❌' },
    { value: 'pregnant', label: 'Pregnant', color: 'green', icon: '🤰' },
    { value: 'delivered', label: 'Delivered', color: 'purple', icon: '🎉' },
    { value: 'failed', label: 'Failed', color: 'red', icon: '⚠️' },
    { value: 'overdue', label: 'Overdue', color: 'red', icon: '⏰' },
];

// =============================================================================
// SEMEN INVENTORY STATUS
// =============================================================================

export type SemenStatus = 'available' | 'used' | 'expired' | 'damaged';

export const SEMEN_STATUSES: { value: SemenStatus; label: string; color: string }[] = [
    { value: 'available', label: 'Available', color: 'green' },
    { value: 'used', label: 'Used', color: 'blue' },
    { value: 'expired', label: 'Expired', color: 'red' },
    { value: 'damaged', label: 'Damaged', color: 'gray' },
];

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate expected due date based on species and breeding date
 */
export function calculateExpectedDueDate(
    breedingDate: Date,
    species: AnimalSpecies
): Date {
    const gestation = GESTATION_PERIODS[species];
    if (!gestation) {
        // Default to cow gestation if species not found
        return new Date(breedingDate.getTime() + 283 * 24 * 60 * 60 * 1000);
    }
    return new Date(breedingDate.getTime() + gestation.average * 24 * 60 * 60 * 1000);
}

/**
 * Calculate days remaining until expected due date
 */
export function calculateDaysRemaining(expectedDueDate: Date): number {
    const now = new Date();
    const diffTime = expectedDueDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate pregnancy progress percentage
 */
export function calculatePregnancyProgress(
    breedingDate: Date,
    species: AnimalSpecies
): number {
    const gestation = GESTATION_PERIODS[species];
    if (!gestation) return 0;

    const now = new Date();
    const daysPassed = Math.floor(
        (now.getTime() - breedingDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return Math.min(100, Math.max(0, (daysPassed / gestation.average) * 100));
}

/**
 * Get recommended pregnancy check window for species
 */
export function getRecommendedCheckWindow(
    breedingDate: Date,
    species: AnimalSpecies
): { startDate: Date; endDate: Date; method: PregnancyCheckMethod } | null {
    const windows = PREGNANCY_CHECK_WINDOWS[species];
    if (!windows) return null;

    // Find the recommended method or default to ultrasound
    const recommendedMethod = (Object.entries(windows) as [PregnancyCheckMethod, CheckWindow][])
        .find(([, window]) => window.recommended)?.[0] || 'ultrasound';

    const window = windows[recommendedMethod];
    if (!window) return null;

    const startDate = new Date(breedingDate.getTime() + window.min * 24 * 60 * 60 * 1000);
    const endDate = new Date(breedingDate.getTime() + window.max * 24 * 60 * 60 * 1000);

    return { startDate, endDate, method: recommendedMethod };
}

/**
 * Determine current breeding status based on dates and checks
 */
export function determineBreedingStatus(
    breedingDate: Date,
    species: AnimalSpecies,
    pregnancyConfirmed: boolean,
    actualBirthDate?: Date,
    lastCheckResult?: PregnancyCheckResult
): BreedingStatus {
    const now = new Date();
    const expectedDue = calculateExpectedDueDate(breedingDate, species);
    const checkWindow = getRecommendedCheckWindow(breedingDate, species);

    // Check if delivered
    if (actualBirthDate) {
        return 'delivered';
    }

    // Check if pregnancy was confirmed negative
    if (lastCheckResult === 'negative') {
        return 'not_pregnant';
    }

    // Check if pregnancy is confirmed
    if (pregnancyConfirmed) {
        // Check if overdue
        if (now > expectedDue) {
            return 'overdue';
        }
        return 'pregnant';
    }

    // Check if we're in the check window
    if (checkWindow && now >= checkWindow.startDate && now <= checkWindow.endDate) {
        return 'check_pending';
    }

    // Just inseminated
    return 'inseminated';
}

/**
 * Format days remaining in human-readable format
 */
export function formatDaysRemaining(days: number): string {
    if (days < 0) {
        return `${Math.abs(days)} days overdue`;
    }
    if (days === 0) {
        return 'Due today';
    }
    if (days === 1) {
        return '1 day remaining';
    }
    if (days <= 7) {
        return `${days} days remaining`;
    }
    if (days <= 30) {
        const weeks = Math.floor(days / 7);
        return `${weeks} week${weeks > 1 ? 's' : ''} remaining`;
    }
    const months = Math.floor(days / 30);
    return `${months} month${months > 1 ? 's' : ''} remaining`;
}

/**
 * Get species-specific breeding tips
 */
export function getBreedingTips(species: AnimalSpecies): string[] {
    const tips: Record<string, string[]> = {
        cow: [
            'Best AI success rate when done 12-18 hours after heat detection',
            'Monitor for return to heat at 18-24 days post-AI',
            'Schedule ultrasound at 28-30 days for early confirmation',
        ],
        buffalo: [
            'Buffalo have longer and more variable gestation (300-340 days)',
            'Heat detection is more challenging - watch for subtle signs',
            'Ultrasound recommended at 30-40 days post-AI',
        ],
        goat: [
            'Does can be bred seasonally (fall) for spring kidding',
            'Multiple births are common - ultrasound can detect twins',
            'Gestation is consistently around 150 days',
        ],
        sheep: [
            'Ewes are seasonal breeders - most fertile in autumn',
            'Twin births are common in many breeds',
            'Watch for pregnancy toxemia in late gestation',
        ],
        horse: [
            'Mares have the longest and most variable gestation (320-370 days)',
            'Early ultrasound at 14-16 days can detect pregnancy',
            'Watch for twin pregnancies - often requires reduction',
        ],
        chicken: [
            'Eggs must be collected and incubated within 7 days of laying',
            'Maintain incubator at 99.5°F (37.5°C) with 55-60% humidity',
            'Turn eggs 3-5 times daily for first 18 days',
        ],
    };

    return tips[species] || tips['cow'];
}
