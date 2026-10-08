-- =============================================================================
-- ShivariVel Construction & Interiors
-- Purge Unneeded Legacy Modules & Decouple Core Tables
-- =============================================================================

-- 1. Drop unwanted views
DROP VIEW IF EXISTS v_dashboard_actions_summary CASCADE;
DROP VIEW IF EXISTS v_dashboard_financial_summary CASCADE;
DROP VIEW IF EXISTS v_dashboard_project_summary CASCADE;
DROP VIEW IF EXISTS v_dashboard_workforce_summary CASCADE;
DROP VIEW IF EXISTS v_my_day CASCADE;
DROP VIEW IF EXISTS v_expense_summary CASCADE;
DROP VIEW IF EXISTS v_project_expense_summary CASCADE;
DROP VIEW IF EXISTS v_project_recorded_cost CASCADE;
DROP VIEW IF EXISTS v_customer_payment_summary CASCADE;
DROP VIEW IF EXISTS v_project_customer_payment_balance CASCADE;
DROP VIEW IF EXISTS v_project_work_progress CASCADE;

-- 2. Drop unwanted tables with CASCADE
DROP TABLE IF EXISTS daily_site_report_expenses CASCADE;
DROP TABLE IF EXISTS daily_site_report_materials CASCADE;
DROP TABLE IF EXISTS daily_site_report_photos CASCADE;
DROP TABLE IF EXISTS daily_site_report_workers CASCADE;
DROP TABLE IF EXISTS daily_site_reports CASCADE;
DROP TABLE IF EXISTS project_work_items CASCADE;
DROP TABLE IF EXISTS work_progress CASCADE;
DROP VIEW IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS attachments CASCADE;
DROP TABLE IF EXISTS weekly_reports CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS follow_ups CASCADE;
DROP TABLE IF EXISTS site_visits CASCADE;
DROP TABLE IF EXISTS estimate_items CASCADE;
DROP TABLE IF EXISTS estimates CASCADE;
DROP TABLE IF EXISTS enquiries CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS customer_payments CASCADE;
DROP TABLE IF EXISTS service_types CASCADE;

-- 3. Decouple projects table from deleted enquiry and estimate tables
ALTER TABLE projects DROP CONSTRAINT IF EXISTS fk_projects_enquiry_company_customer;
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_enquiry_id_fkey;
ALTER TABLE projects DROP CONSTRAINT IF EXISTS fk_projects_estimate_company_customer;
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_estimate_id_fkey;
ALTER TABLE projects DROP COLUMN IF EXISTS enquiry_id;
ALTER TABLE projects DROP COLUMN IF EXISTS estimate_id;

-- 4. Drop unwanted legacy RPC functions
DROP FUNCTION IF EXISTS get_dashboard() CASCADE;
DROP FUNCTION IF EXISTS get_my_day(date) CASCADE;
DROP FUNCTION IF EXISTS get_weekly_report(date) CASCADE;
DROP FUNCTION IF EXISTS generate_weekly_report(date) CASCADE;
