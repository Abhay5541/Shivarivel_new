/**
 * Database type definitions.
 *
 * This file provides the Database type used by the Supabase client
 * for TypeScript auto-completion and type safety.
 *
 * In a production workflow, this file would be generated from the
 * Supabase schema using:
 *   npx supabase gen types typescript --local > src/types/database.ts
 *
 * For Phase 0, we define the foundation tables manually.
 * This will be regenerated as modules are added.
 */

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          logo_url: string | null;
          address: string | null;
          phone: string | null;
          alternate_phone: string | null;
          email: string | null;
          website: string | null;
          gst_number: string | null;
          owner_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          logo_url?: string | null;
          address?: string | null;
          phone?: string | null;
          alternate_phone?: string | null;
          email?: string | null;
          website?: string | null;
          gst_number?: string | null;
          owner_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          logo_url?: string | null;
          address?: string | null;
          phone?: string | null;
          alternate_phone?: string | null;
          email?: string | null;
          website?: string | null;
          gst_number?: string | null;
          owner_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          company_id: string;
          full_name: string;
          phone: string | null;
          role: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          company_id: string;
          full_name: string;
          phone?: string | null;
          role?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          full_name?: string;
          phone?: string | null;
          role?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      service_types: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          description: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string;
          name: string;
          description?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          name?: string;
          description?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      audit_log: {
        Row: {
          id: string;
          company_id: string;
          user_id: string;
          action: string;
          entity_type: string;
          entity_id: string;
          details: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string;
          user_id?: string;
          action: string;
          entity_type: string;
          entity_id: string;
          details?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          user_id?: string;
          action?: string;
          entity_type?: string;
          entity_id?: string;
          details?: Record<string, unknown> | null;
          created_at?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          phone: string | null;
          email: string | null;
          address: string | null;
          notes: string | null;
          status: 'active' | 'inactive';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          notes?: string | null;
          status?: 'active' | 'inactive';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          name?: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          notes?: string | null;
          status?: 'active' | 'inactive';
          created_at?: string;
          updated_at?: string;
        };
      };
      enquiries: {
        Row: {
          id: string;
          company_id: string;
          customer_id: string;
          service_type_id: string | null;
          enquiry_date: string;
          source: string | null;
          description: string | null;
          estimated_value: number | null;
          status:
            | 'New'
            | 'Contacted'
            | 'Site Visit Planned'
            | 'Estimate Prepared'
            | 'Converted'
            | 'Lost'
            | 'On Hold';
          follow_up_date: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string;
          customer_id: string;
          service_type_id?: string | null;
          enquiry_date?: string;
          source?: string | null;
          description?: string | null;
          estimated_value?: number | null;
          status?:
            | 'New'
            | 'Contacted'
            | 'Site Visit Planned'
            | 'Estimate Prepared'
            | 'Converted'
            | 'Lost'
            | 'On Hold';
          follow_up_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          customer_id?: string;
          service_type_id?: string | null;
          enquiry_date?: string;
          source?: string | null;
          description?: string | null;
          estimated_value?: number | null;
          status?:
            | 'New'
            | 'Contacted'
            | 'Site Visit Planned'
            | 'Estimate Prepared'
            | 'Converted'
            | 'Lost'
            | 'On Hold';
          follow_up_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      site_visits: {
        Row: {
          id: string;
          company_id: string;
          customer_id: string;
          enquiry_id: string | null;
          site_address: string | null;
          visit_date: string;
          assigned_to: string | null;
          purpose: string | null;
          observations: string | null;
          notes: string | null;
          status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string;
          customer_id: string;
          enquiry_id?: string | null;
          site_address?: string | null;
          visit_date: string;
          assigned_to?: string | null;
          purpose?: string | null;
          observations?: string | null;
          notes?: string | null;
          status?: 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          customer_id?: string;
          enquiry_id?: string | null;
          site_address?: string | null;
          visit_date?: string;
          assigned_to?: string | null;
          purpose?: string | null;
          observations?: string | null;
          notes?: string | null;
          status?: 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled';
          created_at?: string;
          updated_at?: string;
        };
      };
      estimates: {
        Row: {
          id: string;
          company_id: string;
          customer_id: string;
          enquiry_id: string | null;
          estimate_number: string;
          estimate_date: string;
          valid_until: string | null;
          title: string | null;
          notes: string | null;
          status:
            | 'Draft'
            | 'Sent'
            | 'Approved'
            | 'Accepted'
            | 'Rejected'
            | 'Expired'
            | 'Converted';
          total_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string;
          customer_id: string;
          enquiry_id?: string | null;
          estimate_number?: string;
          estimate_date?: string;
          valid_until?: string | null;
          title?: string | null;
          notes?: string | null;
          status?:
            | 'Draft'
            | 'Sent'
            | 'Approved'
            | 'Accepted'
            | 'Rejected'
            | 'Expired'
            | 'Converted';
          total_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          customer_id?: string;
          enquiry_id?: string | null;
          estimate_number?: string;
          estimate_date?: string;
          valid_until?: string | null;
          title?: string | null;
          notes?: string | null;
          status?:
            | 'Draft'
            | 'Sent'
            | 'Approved'
            | 'Accepted'
            | 'Rejected'
            | 'Expired'
            | 'Converted';
          total_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      estimate_items: {
        Row: {
          id: string;
          company_id: string;
          estimate_id: string;
          category:
            | 'Material'
            | 'Labour'
            | 'Electrical'
            | 'Plumbing'
            | 'Interior'
            | 'Other';
          description: string;
          quantity: number;
          unit: string;
          unit_price: number;
          amount: number;
          sort_order: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string;
          estimate_id: string;
          category:
            | 'Material'
            | 'Labour'
            | 'Electrical'
            | 'Plumbing'
            | 'Interior'
            | 'Other';
          description: string;
          quantity?: number;
          unit?: string;
          unit_price?: number;
          amount?: number;
          sort_order?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          estimate_id?: string;
          category?:
            | 'Material'
            | 'Labour'
            | 'Electrical'
            | 'Plumbing'
            | 'Interior'
            | 'Other';
          description?: string;
          quantity?: number;
          unit?: string;
          unit_price?: number;
          amount?: number;
          sort_order?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          company_id: string;
          customer_id: string;
          enquiry_id: string | null;
          estimate_id: string | null;
          project_code: string;
          name: string;
          description: string | null;
          site_address: string | null;
          status:
            | 'Planned'
            | 'Planning'
            | 'Active'
            | 'On Hold'
            | 'Completed'
            | 'Cancelled';
          start_date: string | null;
          expected_end_date: string | null;
          actual_end_date: string | null;
          contract_value: number | null;
          assigned_to: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string;
          customer_id: string;
          enquiry_id?: string | null;
          estimate_id?: string | null;
          project_code?: string;
          name: string;
          description?: string | null;
          site_address?: string | null;
          status?:
            | 'Planned'
            | 'Planning'
            | 'Active'
            | 'On Hold'
            | 'Completed'
            | 'Cancelled';
          start_date?: string | null;
          expected_end_date?: string | null;
          actual_end_date?: string | null;
          contract_value?: number | null;
          assigned_to?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          customer_id?: string;
          enquiry_id?: string | null;
          estimate_id?: string | null;
          project_code?: string;
          name?: string;
          description?: string | null;
          site_address?: string | null;
          status?:
            | 'Planned'
            | 'Planning'
            | 'Active'
            | 'On Hold'
            | 'Completed'
            | 'Cancelled';
          start_date?: string | null;
          expected_end_date?: string | null;
          actual_end_date?: string | null;
          contract_value?: number | null;
          assigned_to?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      suppliers: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          contact_person: string | null;
          phone: string | null;
          alternate_phone: string | null;
          email: string | null;
          address: string | null;
          gst_number: string | null;
          category: string | null;
          notes: string | null;
          status: 'active' | 'inactive';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string;
          name: string;
          contact_person?: string | null;
          phone?: string | null;
          alternate_phone?: string | null;
          email?: string | null;
          address?: string | null;
          gst_number?: string | null;
          category?: string | null;
          notes?: string | null;
          status?: 'active' | 'inactive';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          name?: string;
          contact_person?: string | null;
          phone?: string | null;
          alternate_phone?: string | null;
          email?: string | null;
          address?: string | null;
          gst_number?: string | null;
          category?: string | null;
          notes?: string | null;
          status?: 'active' | 'inactive';
          created_at?: string;
          updated_at?: string;
        };
      };
      materials: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          category: string;
          unit: string;
          standard_rate: number | null;
          description: string | null;
          status: 'active' | 'inactive';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string;
          name: string;
          category: string;
          unit?: string;
          standard_rate?: number | null;
          description?: string | null;
          status?: 'active' | 'inactive';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          name?: string;
          category?: string;
          unit?: string;
          standard_rate?: number | null;
          description?: string | null;
          status?: 'active' | 'inactive';
          created_at?: string;
          updated_at?: string;
        };
      };
      supplier_materials: {
        Row: {
          id: string;
          company_id: string;
          supplier_id: string;
          material_id: string;
          supplier_material_code: string | null;
          supplier_rate: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string;
          supplier_id: string;
          material_id: string;
          supplier_material_code?: string | null;
          supplier_rate?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          supplier_id?: string;
          material_id?: string;
          supplier_material_code?: string | null;
          supplier_rate?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      purchases: {
        Row: {
          id: string;
          company_id: string;
          supplier_id: string;
          project_id: string | null;
          purchase_number: string;
          purchase_date: string;
          invoice_number: string | null;
          status: 'Draft' | 'Confirmed' | 'Cancelled';
          discount: number;
          tax: number;
          total_amount: number;
          due_date: string | null;
          notes: string | null;
          reversal_of_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string;
          supplier_id: string;
          project_id?: string | null;
          purchase_number?: string;
          purchase_date?: string;
          invoice_number?: string | null;
          status?: 'Draft' | 'Confirmed' | 'Cancelled';
          discount?: number;
          tax?: number;
          total_amount?: number;
          due_date?: string | null;
          notes?: string | null;
          reversal_of_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          supplier_id?: string;
          project_id?: string | null;
          purchase_number?: string;
          purchase_date?: string;
          invoice_number?: string | null;
          status?: 'Draft' | 'Confirmed' | 'Cancelled';
          discount?: number;
          tax?: number;
          total_amount?: number;
          due_date?: string | null;
          notes?: string | null;
          reversal_of_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      purchase_items: {
        Row: {
          id: string;
          company_id: string;
          purchase_id: string;
          material_id: string;
          description: string | null;
          quantity: number;
          unit: string;
          unit_price: number;
          amount: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string;
          purchase_id: string;
          material_id: string;
          description?: string | null;
          quantity: number;
          unit?: string;
          unit_price?: number;
          amount?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          purchase_id?: string;
          material_id?: string;
          description?: string | null;
          quantity?: number;
          unit?: string;
          unit_price?: number;
          amount?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      supplier_payments: {
        Row: {
          id: string;
          company_id: string;
          supplier_id: string;
          payment_number: string;
          payment_date: string;
          amount: number;
          payment_method: string | null;
          reference_number: string | null;
          status: 'Draft' | 'Confirmed' | 'Cancelled';
          notes: string | null;
          reversal_of_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string;
          supplier_id: string;
          payment_number?: string;
          payment_date?: string;
          amount: number;
          payment_method?: string | null;
          reference_number?: string | null;
          status?: 'Draft' | 'Confirmed' | 'Cancelled';
          notes?: string | null;
          reversal_of_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          supplier_id?: string;
          payment_number?: string;
          payment_date?: string;
          amount?: number;
          payment_method?: string | null;
          reference_number?: string | null;
          status?: 'Draft' | 'Confirmed' | 'Cancelled';
          notes?: string | null;
          reversal_of_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      supplier_payment_allocations: {
        Row: {
          id: string;
          company_id: string;
          payment_id: string;
          purchase_id: string;
          amount: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string;
          payment_id: string;
          purchase_id: string;
          amount: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          payment_id?: string;
          purchase_id?: string;
          amount?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      employees: {
        Row: {
          id: string;
          company_id: string;
          employee_code: string;
          name: string;
          phone: string | null;
          worker_type: string | null;
          daily_wage: number | null;
          status: 'active' | 'inactive' | 'Active' | 'Inactive';
          joining_date: string | null;
          emergency_contact: string | null;
          photo_url: string | null;
          address: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string;
          employee_code?: string;
          name: string;
          phone?: string | null;
          worker_type?: string | null;
          daily_wage?: number | null;
          status?: 'active' | 'inactive' | 'Active' | 'Inactive';
          joining_date?: string | null;
          emergency_contact?: string | null;
          photo_url?: string | null;
          address?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          employee_code?: string;
          name?: string;
          phone?: string | null;
          worker_type?: string | null;
          daily_wage?: number | null;
          status?: 'active' | 'inactive' | 'Active' | 'Inactive';
          joining_date?: string | null;
          emergency_contact?: string | null;
          photo_url?: string | null;
          address?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      attendance: {
        Row: {
          id: string;
          company_id: string;
          employee_id: string;
          project_id: string | null;
          attendance_date: string;
          status: 'Present' | 'Half Day' | 'Absent';
          daily_wage_snapshot: number | null;
          overtime_hours: number;
          overtime_amount: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string;
          employee_id: string;
          project_id?: string | null;
          attendance_date?: string;
          status: 'Present' | 'Half Day' | 'Absent';
          daily_wage_snapshot?: number | null;
          overtime_hours?: number;
          overtime_amount?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          employee_id?: string;
          project_id?: string | null;
          attendance_date?: string;
          status?: 'Present' | 'Half Day' | 'Absent';
          daily_wage_snapshot?: number | null;
          overtime_hours?: number;
          overtime_amount?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      daily_wages: {
        Row: {
          id: string;
          company_id: string;
          employee_id: string;
          attendance_id: string;
          project_id: string | null;
          wage_number: string;
          wage_date: string;
          payable_units: number;
          rate: number;
          base_wage: number;
          overtime_hours: number;
          overtime_amount: number;
          amount: number;
          status: 'Draft' | 'Confirmed' | 'Cancelled';
          reversal_of_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string;
          employee_id: string;
          attendance_id: string;
          project_id?: string | null;
          wage_number?: string;
          wage_date: string;
          payable_units: number;
          rate: number;
          base_wage?: number;
          overtime_hours?: number;
          overtime_amount?: number;
          amount?: number;
          status?: 'Draft' | 'Confirmed' | 'Cancelled';
          reversal_of_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          employee_id?: string;
          attendance_id?: string;
          project_id?: string | null;
          wage_number?: string;
          wage_date?: string;
          payable_units?: number;
          rate?: number;
          base_wage?: number;
          overtime_hours?: number;
          overtime_amount?: number;
          amount?: number;
          status?: 'Draft' | 'Confirmed' | 'Cancelled';
          reversal_of_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      employee_advances: {
        Row: {
          id: string;
          company_id: string;
          employee_id: string;
          advance_number: string;
          advance_date: string;
          amount: number;
          payment_method: 'Cash' | 'Bank Transfer' | 'UPI' | 'Cheque' | 'Other' | null;
          reference_number: string | null;
          purpose: string | null;
          notes: string | null;
          status: 'Draft' | 'Confirmed' | 'Cancelled';
          reversal_of_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string;
          employee_id: string;
          advance_number?: string;
          advance_date?: string;
          amount: number;
          payment_method?: 'Cash' | 'Bank Transfer' | 'UPI' | 'Cheque' | 'Other' | null;
          reference_number?: string | null;
          purpose?: string | null;
          notes?: string | null;
          status?: 'Draft' | 'Confirmed' | 'Cancelled';
          reversal_of_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          employee_id?: string;
          advance_number?: string;
          advance_date?: string;
          amount?: number;
          payment_method?: 'Cash' | 'Bank Transfer' | 'UPI' | 'Cheque' | 'Other' | null;
          reference_number?: string | null;
          purpose?: string | null;
          notes?: string | null;
          status?: 'Draft' | 'Confirmed' | 'Cancelled';
          reversal_of_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      employee_payments: {
        Row: {
          id: string;
          company_id: string;
          employee_id: string;
          payment_number: string;
          payment_date: string;
          amount: number;
          payment_method: 'Cash' | 'Bank Transfer' | 'UPI' | 'Cheque' | 'Other' | null;
          reference_number: string | null;
          status: 'Draft' | 'Confirmed' | 'Cancelled';
          reversal_of_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string;
          employee_id: string;
          payment_number?: string;
          payment_date?: string;
          amount: number;
          payment_method?: 'Cash' | 'Bank Transfer' | 'UPI' | 'Cheque' | 'Other' | null;
          reference_number?: string | null;
          status?: 'Draft' | 'Confirmed' | 'Cancelled';
          reversal_of_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          employee_id?: string;
          payment_number?: string;
          payment_date?: string;
          amount?: number;
          payment_method?: 'Cash' | 'Bank Transfer' | 'UPI' | 'Cheque' | 'Other' | null;
          reference_number?: string | null;
          status?: 'Draft' | 'Confirmed' | 'Cancelled';
          reversal_of_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      employee_payment_wage_allocations: {
        Row: {
          id: string;
          company_id: string;
          payment_id: string;
          daily_wage_id: string;
          amount: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string;
          payment_id: string;
          daily_wage_id: string;
          amount: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          payment_id?: string;
          daily_wage_id?: string;
          amount?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      employee_payment_advance_allocations: {
        Row: {
          id: string;
          company_id: string;
          payment_id: string;
          employee_advance_id: string;
          amount: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string;
          payment_id: string;
          employee_advance_id: string;
          amount: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          payment_id?: string;
          employee_advance_id?: string;
          amount?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      expenses: {
        Row: {
          id: string;
          company_id: string;
          project_id: string | null;
          expense_number: string;
          expense_date: string;
          category: ExpenseCategory;
          description: string;
          amount: number;
          paid_by: string | null;
          payment_method: 'Cash' | 'Bank Transfer' | 'UPI' | 'Cheque' | 'Other' | null;
          reference_number: string | null;
          status: 'Draft' | 'Confirmed' | 'Cancelled';
          reversal_of_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string;
          project_id?: string | null;
          expense_number?: string;
          expense_date?: string;
          category: ExpenseCategory;
          description: string;
          amount: number;
          paid_by?: string | null;
          payment_method?: 'Cash' | 'Bank Transfer' | 'UPI' | 'Cheque' | 'Other' | null;
          reference_number?: string | null;
          status?: 'Draft' | 'Confirmed' | 'Cancelled';
          reversal_of_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          project_id?: string | null;
          expense_number?: string;
          expense_date?: string;
          category?: ExpenseCategory;
          description?: string;
          amount?: number;
          paid_by?: string | null;
          payment_method?: 'Cash' | 'Bank Transfer' | 'UPI' | 'Cheque' | 'Other' | null;
          reference_number?: string | null;
          status?: 'Draft' | 'Confirmed' | 'Cancelled';
          reversal_of_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      customer_payments: {
        Row: {
          id: string;
          company_id: string;
          customer_id: string;
          project_id: string;
          payment_number: string;
          payment_date: string;
          amount: number;
          payment_method: 'Cash' | 'Bank Transfer' | 'UPI' | 'Cheque' | 'Other' | null;
          reference_number: string | null;
          status: 'Draft' | 'Confirmed' | 'Cancelled';
          reversal_of_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string;
          customer_id: string;
          project_id: string;
          payment_number?: string;
          payment_date?: string;
          amount: number;
          payment_method?: 'Cash' | 'Bank Transfer' | 'UPI' | 'Cheque' | 'Other' | null;
          reference_number?: string | null;
          status?: 'Draft' | 'Confirmed' | 'Cancelled';
          reversal_of_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          customer_id?: string;
          project_id?: string;
          payment_number?: string;
          payment_date?: string;
          amount?: number;
          payment_method?: 'Cash' | 'Bank Transfer' | 'UPI' | 'Cheque' | 'Other' | null;
          reference_number?: string | null;
          status?: 'Draft' | 'Confirmed' | 'Cancelled';
          reversal_of_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          company_id: string;
          title: string;
          description: string | null;
          category: string | null;
          priority: TaskPriority;
          status: TaskStatus;
          due_date: string | null;
          task_date: string;
          assigned_to: string | null;
          customer_id: string | null;
          project_id: string | null;
          enquiry_id: string | null;
          site_visit_id: string | null;
          completed_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string;
          title: string;
          description?: string | null;
          category?: string | null;
          priority?: TaskPriority;
          status?: TaskStatus;
          due_date?: string | null;
          task_date?: string;
          assigned_to?: string | null;
          customer_id?: string | null;
          project_id?: string | null;
          enquiry_id?: string | null;
          site_visit_id?: string | null;
          completed_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          title?: string;
          description?: string | null;
          category?: string | null;
          priority?: TaskPriority;
          status?: TaskStatus;
          due_date?: string | null;
          task_date?: string;
          assigned_to?: string | null;
          customer_id?: string | null;
          project_id?: string | null;
          enquiry_id?: string | null;
          site_visit_id?: string | null;
          completed_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      follow_ups: {
        Row: {
          id: string;
          company_id: string;
          customer_id: string;
          enquiry_id: string | null;
          project_id: string | null;
          follow_up_date: string;
          title: string;
          notes: string | null;
          status: FollowUpStatus;
          assigned_to: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string;
          customer_id: string;
          enquiry_id?: string | null;
          project_id?: string | null;
          follow_up_date: string;
          title: string;
          notes?: string | null;
          status?: FollowUpStatus;
          assigned_to?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          customer_id?: string;
          enquiry_id?: string | null;
          project_id?: string | null;
          follow_up_date?: string;
          title?: string;
          notes?: string | null;
          status?: FollowUpStatus;
          assigned_to?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      daily_site_reports: {
        Row: {
          id: string;
          company_id: string;
          project_id: string;
          report_date: string;
          work_completed: string;
          issues: string | null;
          delays: string | null;
          next_day_plan: string | null;
          notes: string | null;
          status: DailySiteReportStatus;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string;
          project_id: string;
          report_date?: string;
          work_completed: string;
          issues?: string | null;
          delays?: string | null;
          next_day_plan?: string | null;
          notes?: string | null;
          status?: DailySiteReportStatus;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          project_id?: string;
          report_date?: string;
          work_completed?: string;
          issues?: string | null;
          delays?: string | null;
          next_day_plan?: string | null;
          notes?: string | null;
          status?: DailySiteReportStatus;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      daily_site_report_workers: {
        Row: {
          id: string;
          company_id: string;
          report_id: string;
          employee_id: string | null;
          worker_name: string;
          worker_type: string | null;
          worker_count: number;
          hours_worked: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string;
          report_id: string;
          employee_id?: string | null;
          worker_name: string;
          worker_type?: string | null;
          worker_count?: number;
          hours_worked?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          report_id?: string;
          employee_id?: string | null;
          worker_name?: string;
          worker_type?: string | null;
          worker_count?: number;
          hours_worked?: number | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      daily_site_report_materials: {
        Row: {
          id: string;
          company_id: string;
          report_id: string;
          material_id: string | null;
          material_name: string;
          quantity: number;
          unit: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string;
          report_id: string;
          material_id?: string | null;
          material_name: string;
          quantity: number;
          unit?: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          report_id?: string;
          material_id?: string | null;
          material_name?: string;
          quantity?: number;
          unit?: string;
          notes?: string | null;
          created_at?: string;
        };
      };
      daily_site_report_expenses: {
        Row: {
          id: string;
          company_id: string;
          report_id: string;
          expense_id: string | null;
          category: string;
          description: string;
          amount: number;
          paid_by: string | null;
          payment_method: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string;
          report_id: string;
          expense_id?: string | null;
          category?: string;
          description?: string;
          amount: number;
          paid_by?: string | null;
          payment_method?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          report_id?: string;
          expense_id?: string | null;
          category?: string;
          description?: string;
          amount?: number;
          paid_by?: string | null;
          payment_method?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      daily_site_report_photos: {
        Row: {
          id: string;
          company_id: string;
          report_id: string;
          photo_url: string;
          caption: string | null;
          attachment_id: string | null;
          storage_path: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string;
          report_id: string;
          photo_url: string;
          caption?: string | null;
          attachment_id?: string | null;
          storage_path?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          report_id?: string;
          photo_url?: string;
          caption?: string | null;
          attachment_id?: string | null;
          storage_path?: string | null;
          created_at?: string;
        };
      };
      project_work_items: {
        Row: {
          id: string;
          company_id: string;
          project_id: string;
          name: string;
          category: string | null;
          status: WorkItemStatus;
          progress_percentage: number;
          start_date: string | null;
          expected_completion: string | null;
          actual_completion: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string;
          project_id: string;
          name: string;
          category?: string | null;
          status?: WorkItemStatus;
          progress_percentage?: number;
          start_date?: string | null;
          expected_completion?: string | null;
          actual_completion?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          project_id?: string;
          name?: string;
          category?: string | null;
          status?: WorkItemStatus;
          progress_percentage?: number;
          start_date?: string | null;
          expected_completion?: string | null;
          actual_completion?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      attachments: {
        Row: {
          id: string;
          company_id: string;
          file_name: string;
          storage_bucket: 'documents' | 'photos';
          storage_path: string;
          mime_type: string;
          file_size: number;
          category: AttachmentCategory;
          caption: string | null;
          is_private: boolean;
          customer_id: string | null;
          enquiry_id: string | null;
          site_visit_id: string | null;
          estimate_id: string | null;
          project_id: string | null;
          purchase_id: string | null;
          employee_id: string | null;
          daily_site_report_id: string | null;
          uploaded_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string;
          file_name: string;
          storage_bucket?: 'documents' | 'photos';
          storage_path: string;
          mime_type: string;
          file_size: number;
          category?: AttachmentCategory;
          caption?: string | null;
          is_private?: boolean;
          customer_id?: string | null;
          enquiry_id?: string | null;
          site_visit_id?: string | null;
          estimate_id?: string | null;
          project_id?: string | null;
          purchase_id?: string | null;
          employee_id?: string | null;
          daily_site_report_id?: string | null;
          uploaded_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          file_name?: string;
          storage_bucket?: 'documents' | 'photos';
          storage_path?: string;
          mime_type?: string;
          file_size?: number;
          category?: AttachmentCategory;
          caption?: string | null;
          is_private?: boolean;
          customer_id?: string | null;
          enquiry_id?: string | null;
          site_visit_id?: string | null;
          estimate_id?: string | null;
          project_id?: string | null;
          purchase_id?: string | null;
          employee_id?: string | null;
          daily_site_report_id?: string | null;
          uploaded_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      weekly_reports: {
        Row: {
          id: string;
          company_id: string;
          start_date: string;
          end_date: string;
          title: string;
          summary: unknown;
          generated_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string;
          start_date: string;
          end_date: string;
          title: string;
          summary?: unknown;
          generated_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          start_date?: string;
          end_date?: string;
          title?: string;
          summary?: unknown;
          generated_by?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      v_purchase_balance: {
        Row: {
          purchase_id: string;
          company_id: string;
          supplier_id: string;
          project_id: string | null;
          purchase_number: string;
          purchase_date: string;
          status: 'Draft' | 'Confirmed' | 'Cancelled';
          total_amount: number;
          total_allocated: number;
          outstanding_balance: number;
        };
      };
      v_supplier_balance: {
        Row: {
          supplier_id: string;
          company_id: string;
          supplier_name: string;
          supplier_status: 'active' | 'inactive';
          total_purchases: number;
          total_allocated_payments: number;
          outstanding_balance: number;
        };
      };
      v_employee_wage_payable: {
        Row: {
          company_id: string;
          employee_id: string;
          employee_code: string;
          employee_name: string;
          worker_type: string | null;
          master_daily_wage: number | null;
          employee_status: 'active' | 'inactive' | 'Active' | 'Inactive';
          total_attendance_records: number;
          present_days: number;
          half_days: number;
          absent_days: number;
          total_payable_units: number;
          total_base_wages: number;
          total_overtime_hours: number;
          total_overtime_amount: number;
          total_earned_wages: number;
          wage_payable: number;
        };
      };
      v_employee_advance_balance: {
        Row: {
          company_id: string;
          employee_id: string;
          employee_code: string;
          employee_name: string;
          employee_status: 'active' | 'inactive' | 'Active' | 'Inactive';
          confirmed_advances_count: number;
          total_confirmed_advances: number;
          total_cancelled_amount: number;
          total_reversed_amount: number;
          total_recovered_amount: number;
          outstanding_advance_balance: number;
        };
      };
      v_employee_advance_outstanding: {
        Row: {
          company_id: string;
          employee_id: string;
          employee_code: string;
          employee_name: string;
          employee_status: 'active' | 'inactive' | 'Active' | 'Inactive';
          confirmed_advances_count: number;
          total_confirmed_advances: number;
          total_cancelled_amount: number;
          total_reversed_amount: number;
          total_recovered_amount: number;
          outstanding_advance_balance: number;
        };
      };
      v_employee_wage_balance: {
        Row: {
          company_id: string;
          employee_id: string;
          employee_code: string;
          employee_name: string;
          employee_status: 'active' | 'inactive' | 'Active' | 'Inactive';
          total_wages_earned: number;
          total_wages_paid: number;
          outstanding_wages: number;
        };
      };
      v_employee_payment_summary: {
        Row: {
          company_id: string;
          employee_id: string;
          employee_code: string;
          employee_name: string;
          employee_status: 'active' | 'inactive' | 'Active' | 'Inactive';
          total_wages_earned: number;
          total_wages_paid: number;
          outstanding_wages: number;
          total_advances_given: number;
          total_advances_recovered: number;
          outstanding_advances: number;
          total_payments_made: number;
        };
      };
      v_expense_summary: {
        Row: {
          company_id: string;
          company_name: string;
          total_expense_count: number;
          confirmed_expense_count: number;
          draft_expense_count: number;
          cancelled_expense_count: number;
          reversed_expense_count: number;
          total_confirmed_expenses: number;
          total_cancelled_expenses: number;
          total_reversed_expenses: number;
          active_expense_total: number;
        };
      };
      v_project_expense_summary: {
        Row: {
          company_id: string;
          project_id: string;
          project_code: string;
          project_name: string;
          project_status: string;
          confirmed_expense_count: number;
          total_confirmed_expenses: number;
          total_cancelled_expenses: number;
          active_expense_total: number;
          total_expenses: number;
        };
      };
      v_project_recorded_cost: {
        Row: {
          company_id: string;
          project_id: string;
          project_code: string;
          project_name: string;
          project_status: string;
          total_purchases: number;
          total_wages: number;
          total_expenses: number;
          recorded_project_cost: number;
        };
      };
      v_customer_payment_summary: {
        Row: {
          company_id: string;
          company_name: string;
          total_payment_count: number;
          confirmed_payment_count: number;
          draft_payment_count: number;
          cancelled_payment_count: number;
          reversed_payment_count: number;
          total_confirmed_receipts: number;
          total_cancelled_amount: number;
          total_reversed_amount: number;
          active_receipt_total: number;
        };
      };
      v_project_customer_payment_balance: {
        Row: {
          company_id: string;
          customer_id: string;
          customer_name: string;
          project_id: string;
          project_code: string;
          project_name: string;
          project_status: string;
          contract_value: number | null;
          confirmed_payment_count: number;
          total_confirmed_payments: number;
          total_cancelled_payments: number;
          total_reversed_payments: number;
          amount_received: number;
          outstanding_amount: number | null;
          is_fully_paid: boolean;
        };
      };
      v_my_day: {
        Row: {
          company_id: string;
          item_type: 'task' | 'follow_up' | 'site_visit';
          item_id: string;
          title: string;
          date: string;
          priority: string | null;
          status: string;
          urgency: MyDayUrgency;
          customer_id: string | null;
          customer_name: string | null;
          project_id: string | null;
          project_code: string | null;
          project_name: string | null;
          assigned_to: string | null;
          assigned_name: string | null;
          notes: string | null;
        };
      };
      work_progress: {
        Row: {
          id: string;
          company_id: string;
          project_id: string;
          name: string;
          category: string | null;
          status: WorkItemStatus;
          progress_percentage: number;
          start_date: string | null;
          expected_completion: string | null;
          actual_completion: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      v_project_work_progress: {
        Row: {
          company_id: string;
          project_id: string;
          project_code: string;
          project_name: string;
          project_status: string;
          total_work_items: number;
          completed_work_items: number;
          in_progress_work_items: number;
          not_started_work_items: number;
          on_hold_work_items: number;
          cancelled_work_items: number;
          overall_progress_percentage: number;
        };
      };
      documents: {
        Row: {
          id: string;
          company_id: string;
          file_name: string;
          storage_bucket: 'documents' | 'photos';
          storage_path: string;
          mime_type: string;
          file_size: number;
          category: AttachmentCategory;
          caption: string | null;
          is_private: boolean;
          customer_id: string | null;
          enquiry_id: string | null;
          site_visit_id: string | null;
          estimate_id: string | null;
          project_id: string | null;
          purchase_id: string | null;
          employee_id: string | null;
          daily_site_report_id: string | null;
          uploaded_by: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      v_dashboard_financial_summary: {
        Row: {
          company_id: string;
          total_contract_value: number;
          total_customer_received: number;
          total_customer_receivable: number;
          total_supplier_payable: number;
          total_wage_payable: number;
          total_advance_outstanding: number;
          total_expenses: number;
          total_recorded_project_cost: number;
        };
      };
      v_dashboard_project_summary: {
        Row: {
          company_id: string;
          total_projects: number;
          active_projects: number;
          upcoming_projects: number;
          on_hold_projects: number;
          completed_projects: number;
          cancelled_projects: number;
          projects_requiring_attention: number;
          active_projects_avg_progress: number;
        };
      };
      v_dashboard_workforce_summary: {
        Row: {
          company_id: string;
          workers_today: number;
          present_today: number;
          half_day_today: number;
          absent_today: number;
          today_wage_amount: number;
        };
      };
      v_dashboard_actions_summary: {
        Row: {
          company_id: string;
          pending_tasks: number;
          overdue_tasks: number;
          follow_ups_due: number;
          upcoming_site_visits: number;
          new_enquiries: number;
          reports_today: number;
        };
      };
    };
    Functions: {
      current_company_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      current_role: {
        Args: Record<string, never>;
        Returns: string;
      };
      is_owner: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      has_permission: {
        Args: { permission: string };
        Returns: boolean;
      };
      is_assigned_to_project: {
        Args: { p_project_id: string };
        Returns: boolean;
      };
      convert_estimate_to_project: {
        Args: {
          p_estimate_id: string;
          p_project_name?: string;
          p_start_date?: string;
          p_expected_end_date?: string;
        };
        Returns: string;
      };
      convert_enquiry_to_project: {
        Args: {
          p_enquiry_id: string;
          p_project_name?: string;
          p_contract_value?: number;
          p_start_date?: string;
          p_expected_end_date?: string;
        };
        Returns: string;
      };
      create_purchase_transaction: {
        Args: {
          p_supplier_id: string;
          p_project_id?: string | null;
          p_purchase_date?: string;
          p_invoice_number?: string | null;
          p_discount?: number;
          p_tax?: number;
          p_due_date?: string | null;
          p_notes?: string | null;
          p_status?: 'Draft' | 'Confirmed' | 'Cancelled';
          p_items?: unknown;
          p_reversal_of_id?: string | null;
        };
        Returns: string;
      };
      record_supplier_payment: {
        Args: {
          p_supplier_id: string;
          p_amount: number;
          p_payment_date?: string;
          p_payment_method?: string | null;
          p_reference_number?: string | null;
          p_notes?: string | null;
          p_status?: 'Draft' | 'Confirmed' | 'Cancelled';
          p_allocations?: unknown;
          p_reversal_of_id?: string | null;
        };
        Returns: string;
      };
      allocate_supplier_payment: {
        Args: {
          p_payment_id: string;
          p_purchase_id: string;
          p_amount: number;
          p_notes?: string | null;
        };
        Returns: string;
      };
      record_attendance: {
        Args: {
          p_employee_id: string;
          p_status: 'Present' | 'Half Day' | 'Absent';
          p_attendance_date?: string;
          p_project_id?: string | null;
          p_overtime_hours?: number;
          p_overtime_amount?: number;
          p_daily_wage_rate?: number | null;
          p_notes?: string | null;
          p_auto_generate_wage?: boolean;
        };
        Returns: unknown;
      };
      generate_employee_wages: {
        Args: {
          p_from_date: string;
          p_to_date: string;
          p_employee_id?: string | null;
        };
        Returns: unknown;
      };
      cancel_daily_wage: {
        Args: {
          p_wage_id: string;
          p_notes?: string | null;
        };
        Returns: boolean;
      };
      record_employee_advance: {
        Args: {
          p_employee_id: string;
          p_amount: number;
          p_advance_date?: string;
          p_payment_method?: string | null;
          p_reference_number?: string | null;
          p_purpose?: string | null;
          p_notes?: string | null;
          p_status?: 'Draft' | 'Confirmed';
          p_reversal_of_id?: string | null;
        };
        Returns: unknown;
      };
      cancel_employee_advance: {
        Args: {
          p_advance_id: string;
          p_notes?: string | null;
        };
        Returns: boolean;
      };
      record_employee_payment: {
        Args: {
          p_employee_id: string;
          p_amount: number;
          p_payment_date?: string;
          p_payment_method?: string | null;
          p_reference_number?: string | null;
          p_notes?: string | null;
          p_status?: 'Draft' | 'Confirmed';
          p_wage_allocations?: unknown;
          p_advance_allocations?: unknown;
          p_reversal_of_id?: string | null;
        };
        Returns: unknown;
      };
      allocate_employee_payment_to_wage: {
        Args: {
          p_payment_id: string;
          p_daily_wage_id: string;
          p_amount: number;
          p_notes?: string | null;
        };
        Returns: string;
      };
      allocate_employee_payment_to_advance: {
        Args: {
          p_payment_id: string;
          p_employee_advance_id: string;
          p_amount: number;
          p_notes?: string | null;
        };
        Returns: string;
      };
      cancel_employee_payment: {
        Args: {
          p_payment_id: string;
          p_notes?: string | null;
        };
        Returns: boolean;
      };
      record_expense: {
        Args: {
          p_category: string;
          p_description: string;
          p_amount: number;
          p_project_id?: string | null;
          p_expense_date?: string;
          p_paid_by?: string | null;
          p_payment_method?: string | null;
          p_reference_number?: string | null;
          p_notes?: string | null;
          p_status?: 'Draft' | 'Confirmed';
          p_reversal_of_id?: string | null;
        };
        Returns: unknown;
      };
      cancel_expense: {
        Args: {
          p_expense_id: string;
          p_notes?: string | null;
        };
        Returns: boolean;
      };
      reverse_expense: {
        Args: {
          p_expense_id: string;
          p_notes?: string | null;
        };
        Returns: unknown;
      };
      record_customer_payment: {
        Args: {
          p_customer_id: string;
          p_project_id: string;
          p_amount: number;
          p_payment_date?: string;
          p_payment_method?: string | null;
          p_reference_number?: string | null;
          p_notes?: string | null;
          p_status?: 'Draft' | 'Confirmed';
          p_reversal_of_id?: string | null;
        };
        Returns: unknown;
      };
      cancel_customer_payment: {
        Args: {
          p_payment_id: string;
          p_notes?: string | null;
        };
        Returns: boolean;
      };
      reverse_customer_payment: {
        Args: {
          p_payment_id: string;
          p_notes?: string | null;
        };
        Returns: unknown;
      };
      complete_task: {
        Args: {
          p_task_id: string;
          p_notes?: string | null;
        };
        Returns: boolean;
      };
      complete_follow_up: {
        Args: {
          p_follow_up_id: string;
          p_notes?: string | null;
        };
        Returns: boolean;
      };
      get_my_day: {
        Args: {
          p_date?: string;
        };
        Returns: unknown;
      };
      create_daily_site_report: {
        Args: {
          p_project_id: string;
          p_work_completed: string;
          p_report_date?: string;
          p_issues?: string | null;
          p_delays?: string | null;
          p_next_day_plan?: string | null;
          p_notes?: string | null;
          p_status?: 'Draft' | 'Submitted' | 'Approved';
          p_workers?: unknown;
          p_materials?: unknown;
          p_expenses?: unknown;
          p_photos?: unknown;
        };
        Returns: unknown;
      };
      update_work_item_progress: {
        Args: {
          p_work_item_id: string;
          p_progress_percentage: number;
          p_status?: string | null;
          p_actual_completion?: string | null;
          p_notes?: string | null;
        };
        Returns: unknown;
      };
      batch_create_project_work_items: {
        Args: {
          p_project_id: string;
          p_items: unknown;
        };
        Returns: unknown;
      };
      register_attachment: {
        Args: {
          p_file_name: string;
          p_storage_path: string;
          p_mime_type: string;
          p_file_size: number;
          p_storage_bucket?: string;
          p_category?: string;
          p_caption?: string | null;
          p_project_id?: string | null;
          p_customer_id?: string | null;
          p_enquiry_id?: string | null;
          p_site_visit_id?: string | null;
          p_estimate_id?: string | null;
          p_purchase_id?: string | null;
          p_employee_id?: string | null;
          p_daily_site_report_id?: string | null;
        };
        Returns: unknown;
      };
      get_attachment_access_info: {
        Args: {
          p_attachment_id: string;
        };
        Returns: unknown;
      };
      get_dashboard: {
        Args: Record<string, never>;
        Returns: unknown;
      };
      get_weekly_report: {
        Args: {
          p_start_date?: string | null;
          p_end_date?: string | null;
        };
        Returns: unknown;
      };
      generate_weekly_report: {
        Args: {
          p_start_date?: string | null;
          p_end_date?: string | null;
          p_store_snapshot?: boolean;
        };
        Returns: unknown;
      };
    };
    Enums: Record<string, never>;
  };
}

export type ExpenseCategory =
  | 'Site Transportation'
  | 'Fuel'
  | 'Travel'
  | 'Food / Refreshments'
  | 'Electricity'
  | 'Internet'
  | 'Office Expenses'
  | 'Equipment Rental'
  | 'Small Tools'
  | 'Repair / Maintenance'
  | 'Miscellaneous'
  | 'Other'
  | 'Site transportation'
  | 'Food / refreshments'
  | 'Office expenses'
  | 'Equipment rental'
  | 'Small tools'
  | 'Repair / maintenance'
  | 'Miscellaneous project expense';

export type ExpenseStatus = 'Draft' | 'Confirmed' | 'Cancelled';

export type CustomerPaymentStatus = 'Draft' | 'Confirmed' | 'Cancelled';

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type TaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';

export type FollowUpStatus = 'Pending' | 'Completed' | 'Cancelled';

export type MyDayUrgency = 'OVERDUE' | 'TODAY' | 'UPCOMING';

export type DailySiteReportStatus = 'Draft' | 'Submitted' | 'Approved';

export type WorkItemStatus = 'Not Started' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';

export type AttachmentCategory =
  | 'General'
  | 'Drawing'
  | 'Estimate'
  | 'Invoice'
  | 'Receipt'
  | 'Contract'
  | 'Site Photo'
  | 'ID Proof'
  | 'Site Plan'
  | 'Report'
  | 'Other';

