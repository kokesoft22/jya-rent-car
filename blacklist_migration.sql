-- ============================================
-- Migration: Add Blacklist fields to customers
-- Run this in the Supabase SQL Editor
-- ============================================

-- Add blacklist columns to customers table
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS is_blacklisted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS blacklist_reason TEXT,
ADD COLUMN IF NOT EXISTS blacklisted_at TIMESTAMP WITH TIME ZONE;
