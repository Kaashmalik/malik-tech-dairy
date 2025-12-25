import { z } from 'zod';

// Feature flag configuration schema
const featureFlagSchema = z.object({
  key: z.string(),
  enabled: z.boolean(),
  description: z.string(),
  rolloutPercentage: z.number().min(0).max(100).default(0),
  targetRoles: z.array(z.string()).optional(),
  targetTenants: z.array(z.string()).optional(),
  enabledAt: z.string().datetime().optional(),
  disabledAt: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
});

export type FeatureFlag = z.infer<typeof featureFlagSchema>;

// Enterprise upgrade feature flags
export const ENTERPRISE_FEATURE_FLAGS = {
  // Veterinary System
  VETERINARY_DISEASE_MANAGEMENT: 'veterinary_disease_management',
  VETERINARY_TREATMENT_TRACKING: 'veterinary_treatment_tracking',
  VETERINARY_VACCINATION_SCHEDULES: 'veterinary_vaccination_schedules',

  // Feed Management
  FEED_INVENTORY_TRACKING: 'feed_inventory_tracking',
  FEED_SCHEDULE_AUTOMATION: 'feed_schedule_automation',
  NUTRITION_TEMPLATES: 'nutrition_templates',

  // Staff Management
  STAFF_ATTENDANCE_TRACKING: 'staff_attendance_tracking',
  TASK_ASSIGNMENT_SYSTEM: 'task_assignment_system',
  PERFORMANCE_REVIEWS: 'performance_reviews',

  // IoT Integration
  IOT_DEVICE_MANAGEMENT: 'iot_device_management',
  SENSOR_DATA_INGESTION: 'sensor_data_ingestion',
  REAL_TIME_MONITORING: 'real_time_monitoring',

  // Milk Quality
  MILK_QUALITY_TESTING: 'milk_quality_testing',
  QUALITY_GRADING_SYSTEM: 'quality_grading_system',
  ADULTERATION_DETECTION: 'adulteration_detection',

  // Analytics & AI
  AI_PREDICTIVE_ANALYTICS: 'ai_predictive_analytics',
  PRODUCTION_FORECASTING: 'production_forecasting',
  HEALTH_MONITORING_AI: 'health_monitoring_ai',

  // UI/UX Enhancements
  DASHBOARD_REDESIGN: 'dashboard_redesign',
  MOBILE_RESPONSIVE_UI: 'mobile_responsive_ui',
  DARK_MODE_SUPPORT: 'dark_mode_support',

  // Compliance & Reporting
  COMPLIANCE_REPORTING: 'compliance_reporting',
  AUDIT_LOG_ENHANCEMENT: 'audit_log_enhancement',
  DATA_EXPORT_FEATURES: 'data_export_features',
} as const;

// Type representing the lowercase string values of feature flags
export type EnterpriseFeatureFlag = (typeof ENTERPRISE_FEATURE_FLAGS)[keyof typeof ENTERPRISE_FEATURE_FLAGS];

// Default feature flag configurations (keyed by feature flag values)
export const DEFAULT_FEATURE_FLAGS: Record<EnterpriseFeatureFlag, FeatureFlag> = {
  // Phase 1: Foundation (Database & APIs) - Roll out gradually
  [ENTERPRISE_FEATURE_FLAGS.VETERINARY_DISEASE_MANAGEMENT]: {
    key: ENTERPRISE_FEATURE_FLAGS.VETERINARY_DISEASE_MANAGEMENT,
    enabled: false,
    description: 'Enable veterinary disease management system',
    rolloutPercentage: 10, // Start with 10% rollout
    targetRoles: ['farm_owner', 'farm_manager', 'veterinarian'],
    metadata: {
      phase: 'phase_1',
      dependencies: ['database_migration_veterinary'],
      riskLevel: 'low',
    },
  },

  [ENTERPRISE_FEATURE_FLAGS.VETERINARY_TREATMENT_TRACKING]: {
    key: ENTERPRISE_FEATURE_FLAGS.VETERINARY_TREATMENT_TRACKING,
    enabled: false,
    description: 'Enable treatment record tracking and management',
    rolloutPercentage: 10,
    targetRoles: ['farm_owner', 'farm_manager', 'veterinarian'],
    metadata: {
      phase: 'phase_1',
      dependencies: ['veterinary_disease_management'],
      riskLevel: 'medium',
    },
  },

  [ENTERPRISE_FEATURE_FLAGS.VETERINARY_VACCINATION_SCHEDULES]: {
    key: ENTERPRISE_FEATURE_FLAGS.VETERINARY_VACCINATION_SCHEDULES,
    enabled: false,
    description: 'Enable vaccination schedule management',
    rolloutPercentage: 10,
    targetRoles: ['farm_owner', 'farm_manager', 'veterinarian'],
    metadata: {
      phase: 'phase_1',
      dependencies: ['veterinary_disease_management'],
      riskLevel: 'low',
    },
  },

  [ENTERPRISE_FEATURE_FLAGS.FEED_INVENTORY_TRACKING]: {
    key: ENTERPRISE_FEATURE_FLAGS.FEED_INVENTORY_TRACKING,
    enabled: false,
    description: 'Enable feed inventory management and tracking',
    rolloutPercentage: 15,
    targetRoles: ['farm_owner', 'farm_manager', 'feed_manager'],
    metadata: {
      phase: 'phase_1',
      dependencies: ['database_migration_feed'],
      riskLevel: 'low',
    },
  },

  [ENTERPRISE_FEATURE_FLAGS.FEED_SCHEDULE_AUTOMATION]: {
    key: ENTERPRISE_FEATURE_FLAGS.FEED_SCHEDULE_AUTOMATION,
    enabled: false,
    description: 'Enable automated feeding schedule management',
    rolloutPercentage: 10,
    targetRoles: ['farm_owner', 'farm_manager', 'feed_manager'],
    metadata: {
      phase: 'phase_1',
      dependencies: ['feed_inventory_tracking'],
      riskLevel: 'medium',
    },
  },

  [ENTERPRISE_FEATURE_FLAGS.NUTRITION_TEMPLATES]: {
    key: ENTERPRISE_FEATURE_FLAGS.NUTRITION_TEMPLATES,
    enabled: false,
    description: 'Enable nutrition template management',
    rolloutPercentage: 10,
    targetRoles: ['farm_owner', 'farm_manager', 'feed_manager'],
    metadata: {
      phase: 'phase_1',
      dependencies: ['feed_inventory_tracking'],
      riskLevel: 'low',
    },
  },

  [ENTERPRISE_FEATURE_FLAGS.STAFF_ATTENDANCE_TRACKING]: {
    key: ENTERPRISE_FEATURE_FLAGS.STAFF_ATTENDANCE_TRACKING,
    enabled: false,
    description: 'Enable staff attendance tracking system',
    rolloutPercentage: 20,
    targetRoles: ['farm_owner', 'farm_manager'],
    metadata: {
      phase: 'phase_1',
      dependencies: ['database_migration_staff'],
      riskLevel: 'low',
    },
  },

  [ENTERPRISE_FEATURE_FLAGS.TASK_ASSIGNMENT_SYSTEM]: {
    key: ENTERPRISE_FEATURE_FLAGS.TASK_ASSIGNMENT_SYSTEM,
    enabled: false,
    description: 'Enable task assignment and tracking system',
    rolloutPercentage: 15,
    targetRoles: ['farm_owner', 'farm_manager'],
    metadata: {
      phase: 'phase_1',
      dependencies: ['staff_attendance_tracking'],
      riskLevel: 'medium',
    },
  },

  [ENTERPRISE_FEATURE_FLAGS.PERFORMANCE_REVIEWS]: {
    key: ENTERPRISE_FEATURE_FLAGS.PERFORMANCE_REVIEWS,
    enabled: false,
    description: 'Enable staff performance review system',
    rolloutPercentage: 5, // Start very small for HR features
    targetRoles: ['farm_owner'],
    metadata: {
      phase: 'phase_2',
      dependencies: ['task_assignment_system'],
      riskLevel: 'high',
    },
  },

  [ENTERPRISE_FEATURE_FLAGS.IOT_DEVICE_MANAGEMENT]: {
    key: ENTERPRISE_FEATURE_FLAGS.IOT_DEVICE_MANAGEMENT,
    enabled: false,
    description: 'Enable IoT device registration and management',
    rolloutPercentage: 5, // Start small for IoT features
    targetRoles: ['farm_owner', 'farm_manager'],
    metadata: {
      phase: 'phase_2',
      dependencies: ['database_migration_iot'],
      riskLevel: 'high',
    },
  },

  [ENTERPRISE_FEATURE_FLAGS.SENSOR_DATA_INGESTION]: {
    key: ENTERPRISE_FEATURE_FLAGS.SENSOR_DATA_INGESTION,
    enabled: false,
    description: 'Enable real-time sensor data ingestion',
    rolloutPercentage: 5,
    targetRoles: ['farm_owner', 'farm_manager'],
    metadata: {
      phase: 'phase_2',
      dependencies: ['iot_device_management'],
      riskLevel: 'high',
    },
  },

  [ENTERPRISE_FEATURE_FLAGS.REAL_TIME_MONITORING]: {
    key: ENTERPRISE_FEATURE_FLAGS.REAL_TIME_MONITORING,
    enabled: false,
    description: 'Enable real-time monitoring dashboard',
    rolloutPercentage: 3,
    targetRoles: ['farm_owner', 'farm_manager'],
    metadata: {
      phase: 'phase_3',
      dependencies: ['sensor_data_ingestion'],
      riskLevel: 'high',
    },
  },

  [ENTERPRISE_FEATURE_FLAGS.MILK_QUALITY_TESTING]: {
    key: ENTERPRISE_FEATURE_FLAGS.MILK_QUALITY_TESTING,
    enabled: false,
    description: 'Enable milk quality testing management',
    rolloutPercentage: 15,
    targetRoles: ['farm_owner', 'farm_manager'],
    metadata: {
      phase: 'phase_1',
      dependencies: ['database_migration_milk_quality'],
      riskLevel: 'medium',
    },
  },

  [ENTERPRISE_FEATURE_FLAGS.QUALITY_GRADING_SYSTEM]: {
    key: ENTERPRISE_FEATURE_FLAGS.QUALITY_GRADING_SYSTEM,
    enabled: false,
    description: 'Enable automatic milk quality grading',
    rolloutPercentage: 10,
    targetRoles: ['farm_owner', 'farm_manager'],
    metadata: {
      phase: 'phase_1',
      dependencies: ['milk_quality_testing'],
      riskLevel: 'low',
    },
  },

  [ENTERPRISE_FEATURE_FLAGS.ADULTERATION_DETECTION]: {
    key: ENTERPRISE_FEATURE_FLAGS.ADULTERATION_DETECTION,
    enabled: false,
    description: 'Enable milk adulteration detection',
    rolloutPercentage: 10,
    targetRoles: ['farm_owner', 'farm_manager'],
    metadata: {
      phase: 'phase_1',
      dependencies: ['milk_quality_testing'],
      riskLevel: 'medium',
    },
  },

  // Phase 2-3: Advanced features (disabled by default)
  [ENTERPRISE_FEATURE_FLAGS.AI_PREDICTIVE_ANALYTICS]: {
    key: ENTERPRISE_FEATURE_FLAGS.AI_PREDICTIVE_ANALYTICS,
    enabled: false,
    description: 'Enable AI-powered predictive analytics',
    rolloutPercentage: 0,
    targetRoles: ['farm_owner'],
    metadata: {
      phase: 'phase_3',
      dependencies: ['sensor_data_ingestion', 'milk_quality_testing'],
      riskLevel: 'high',
    },
  },

  [ENTERPRISE_FEATURE_FLAGS.PRODUCTION_FORECASTING]: {
    key: ENTERPRISE_FEATURE_FLAGS.PRODUCTION_FORECASTING,
    enabled: false,
    description: 'Enable production forecasting system',
    rolloutPercentage: 0,
    targetRoles: ['farm_owner'],
    metadata: {
      phase: 'phase_3',
      dependencies: ['ai_predictive_analytics'],
      riskLevel: 'high',
    },
  },

  [ENTERPRISE_FEATURE_FLAGS.HEALTH_MONITORING_AI]: {
    key: ENTERPRISE_FEATURE_FLAGS.HEALTH_MONITORING_AI,
    enabled: false,
    description: 'Enable AI-powered health monitoring',
    rolloutPercentage: 0,
    targetRoles: ['farm_owner', 'farm_manager', 'veterinarian'],
    metadata: {
      phase: 'phase_3',
      dependencies: ['ai_predictive_analytics', 'sensor_data_ingestion'],
      riskLevel: 'high',
    },
  },

  [ENTERPRISE_FEATURE_FLAGS.DASHBOARD_REDESIGN]: {
    key: ENTERPRISE_FEATURE_FLAGS.DASHBOARD_REDESIGN,
    enabled: false,
    description: 'Enable new dashboard design',
    rolloutPercentage: 0,
    targetRoles: ['farm_owner', 'farm_manager'],
    metadata: {
      phase: 'phase_2',
      dependencies: [],
      riskLevel: 'medium',
    },
  },

  [ENTERPRISE_FEATURE_FLAGS.MOBILE_RESPONSIVE_UI]: {
    key: ENTERPRISE_FEATURE_FLAGS.MOBILE_RESPONSIVE_UI,
    enabled: false,
    description: 'Enable mobile-responsive UI components',
    rolloutPercentage: 0,
    targetRoles: [],
    metadata: {
      phase: 'phase_2',
      dependencies: [],
      riskLevel: 'low',
    },
  },

  [ENTERPRISE_FEATURE_FLAGS.DARK_MODE_SUPPORT]: {
    key: ENTERPRISE_FEATURE_FLAGS.DARK_MODE_SUPPORT,
    enabled: false,
    description: 'Enable dark mode support',
    rolloutPercentage: 0,
    targetRoles: [],
    metadata: {
      phase: 'phase_2',
      dependencies: [],
      riskLevel: 'low',
    },
  },

  [ENTERPRISE_FEATURE_FLAGS.COMPLIANCE_REPORTING]: {
    key: ENTERPRISE_FEATURE_FLAGS.COMPLIANCE_REPORTING,
    enabled: false,
    description: 'Enable compliance reporting features',
    rolloutPercentage: 0,
    targetRoles: ['farm_owner'],
    metadata: {
      phase: 'phase_3',
      dependencies: ['audit_log_enhancement'],
      riskLevel: 'medium',
    },
  },

  [ENTERPRISE_FEATURE_FLAGS.AUDIT_LOG_ENHANCEMENT]: {
    key: ENTERPRISE_FEATURE_FLAGS.AUDIT_LOG_ENHANCEMENT,
    enabled: false,
    description: 'Enable enhanced audit logging',
    rolloutPercentage: 0,
    targetRoles: ['farm_owner'],
    metadata: {
      phase: 'phase_2',
      dependencies: [],
      riskLevel: 'low',
    },
  },

  [ENTERPRISE_FEATURE_FLAGS.DATA_EXPORT_FEATURES]: {
    key: ENTERPRISE_FEATURE_FLAGS.DATA_EXPORT_FEATURES,
    enabled: false,
    description: 'Enable data export and reporting features',
    rolloutPercentage: 0,
    targetRoles: ['farm_owner', 'farm_manager'],
    metadata: {
      phase: 'phase_3',
      dependencies: ['compliance_reporting'],
      riskLevel: 'medium',
    },
  },
};

// Phase rollout order
export const PHASE_ROLLOUT_ORDER = {
  phase_1: [
    ENTERPRISE_FEATURE_FLAGS.VETERINARY_DISEASE_MANAGEMENT,
    ENTERPRISE_FEATURE_FLAGS.MILK_QUALITY_TESTING,
    ENTERPRISE_FEATURE_FLAGS.FEED_INVENTORY_TRACKING,
    ENTERPRISE_FEATURE_FLAGS.STAFF_ATTENDANCE_TRACKING,
    ENTERPRISE_FEATURE_FLAGS.QUALITY_GRADING_SYSTEM,
    ENTERPRISE_FEATURE_FLAGS.ADULTERATION_DETECTION,
    ENTERPRISE_FEATURE_FLAGS.NUTRITION_TEMPLATES,
    ENTERPRISE_FEATURE_FLAGS.VETERINARY_TREATMENT_TRACKING,
    ENTERPRISE_FEATURE_FLAGS.FEED_SCHEDULE_AUTOMATION,
    ENTERPRISE_FEATURE_FLAGS.TASK_ASSIGNMENT_SYSTEM,
    ENTERPRISE_FEATURE_FLAGS.VETERINARY_VACCINATION_SCHEDULES,
  ],
  phase_2: [
    ENTERPRISE_FEATURE_FLAGS.AUDIT_LOG_ENHANCEMENT,
    ENTERPRISE_FEATURE_FLAGS.MOBILE_RESPONSIVE_UI,
    ENTERPRISE_FEATURE_FLAGS.DARK_MODE_SUPPORT,
    ENTERPRISE_FEATURE_FLAGS.DASHBOARD_REDESIGN,
    ENTERPRISE_FEATURE_FLAGS.IOT_DEVICE_MANAGEMENT,
    ENTERPRISE_FEATURE_FLAGS.SENSOR_DATA_INGESTION,
    ENTERPRISE_FEATURE_FLAGS.PERFORMANCE_REVIEWS,
  ],
  phase_3: [
    ENTERPRISE_FEATURE_FLAGS.AI_PREDICTIVE_ANALYTICS,
    ENTERPRISE_FEATURE_FLAGS.REAL_TIME_MONITORING,
    ENTERPRISE_FEATURE_FLAGS.PRODUCTION_FORECASTING,
    ENTERPRISE_FEATURE_FLAGS.HEALTH_MONITORING_AI,
    ENTERPRISE_FEATURE_FLAGS.COMPLIANCE_REPORTING,
    ENTERPRISE_FEATURE_FLAGS.DATA_EXPORT_FEATURES,
  ],
} as const;
