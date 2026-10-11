-- =============================================================================
-- ShivariVel Construction & Interiors
-- Phase Single-Tenant: Materials Category Defaults
-- =============================================================================

ALTER TABLE public.materials ALTER COLUMN category SET DEFAULT 'General';
ALTER TABLE public.materials ALTER COLUMN category DROP NOT NULL;
