-- Create missing tables for MTK Dairy
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/gdditqkvzlpnklcoxspj/sql

-- Email Subscriptions Table
CREATE TABLE IF NOT EXISTS public.email_subscriptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text NOT NULL,
    tenant_id text NOT NULL,
    type text NOT NULL CHECK (
        type IN (
            'marketing',
            'product_updates',
            'tips_and_tricks',
            'milk_production_alerts',
            'health_reminders',
            'breeding_alerts',
            'expense_alerts',
            'subscription_renewals',
            'system_notifications',
            'security_alerts'
        )
    ),
    enabled boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    
    UNIQUE(user_id, tenant_id, type)
);

-- Create indexes for email_subscriptions
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_user_tenant ON public.email_subscriptions(user_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_tenant_type ON public.email_subscriptions(tenant_id, type);
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_enabled ON public.email_subscriptions(enabled) WHERE enabled = true;

-- Enable RLS
ALTER TABLE public.email_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_subscriptions
CREATE POLICY "Users can view their own subscriptions" ON public.email_subscriptions
    FOR SELECT USING (
        auth.uid()::text = user_id
    );

CREATE POLICY "Users can update their own subscriptions" ON public.email_subscriptions
    FOR UPDATE USING (
        auth.uid()::text = user_id
    );

CREATE POLICY "Service role can manage all subscriptions" ON public.email_subscriptions
    FOR ALL USING (
        current_setting('app.config.service_role', true) = 'true'
    );

-- Predictions Table
CREATE TABLE IF NOT EXISTS public.predictions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id text NOT NULL,
    animal_id text,
    type text NOT NULL CHECK (
        type IN (
            'milk_yield',
            'health_risk',
            'breeding_success',
            'feed_optimization',
            'disease_outbreak'
        )
    ),
    model_version text NOT NULL DEFAULT 'v1.0',
    prediction_data jsonb NOT NULL,
    confidence_score numeric CHECK (confidence_score >= 0 AND confidence_score <= 1),
    predicted_at timestamp with time zone DEFAULT now() NOT NULL,
    valid_until timestamp with time zone,
    actual_value numeric,
    is_accurate boolean,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create indexes for predictions
CREATE INDEX IF NOT EXISTS idx_predictions_tenant_animal ON public.predictions(tenant_id, animal_id);
CREATE INDEX IF NOT EXISTS idx_predictions_type ON public.predictions(type);
CREATE INDEX IF NOT EXISTS idx_predictions_predicted_at ON public.predictions(predicted_at);
CREATE INDEX IF NOT EXISTS idx_predictions_valid_until ON public.predictions(valid_until) WHERE valid_until IS NOT NULL;

-- Enable RLS
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for predictions
CREATE POLICY "Users can view predictions for their tenant" ON public.predictions
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_members 
            WHERE user_id = auth.uid()::text
        )
    );

CREATE POLICY "Service role can manage all predictions" ON public.predictions
    FOR ALL USING (
        current_setting('app.config.service_role', true) = 'true'
    );

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER handle_email_subscriptions_updated_at
    BEFORE UPDATE ON public.email_subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_predictions_updated_at
    BEFORE UPDATE ON public.predictions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Grant permissions
GRANT ALL ON public.email_subscriptions TO authenticated;
GRANT ALL ON public.email_subscriptions TO service_role;
GRANT ALL ON public.predictions TO authenticated;
GRANT ALL ON public.predictions TO service_role;

-- Add comments
COMMENT ON TABLE public.email_subscriptions IS 'User email subscription preferences for different notification types';
COMMENT ON TABLE public.predictions IS 'AI/ML predictions for various farm metrics including milk yield, health risks, etc.';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Email subscriptions and predictions tables created successfully!';
    RAISE NOTICE '📊 Tables are now ready for use with RLS policies enabled';
END $$;
