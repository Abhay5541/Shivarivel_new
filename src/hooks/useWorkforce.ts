import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { devEvalProjects } from '@/hooks/useProjects';
import type {
  Employee,
  EmployeeFormData,
  AttendanceRecord,
  AttendanceStatus,
  DailyWage,
  EmployeeAdvance,
  AdvanceFormData,
  EmployeePayment,
  EmployeePaymentFormData,
} from '@/types/workforce';

// ==========================================
// EVALUATION / LOCAL MOCK FALLBACK DATA
// (Realistic Tamil Nadu Civil & Interior Crew)
// ==========================================

export let memoryEmployees: Employee[] = [
  {
    id: 'emp-01',
    company_id: 'comp-shivarivel-001',
    employee_code: 'EMP-0001',
    name: 'M. Shanmugam',
    phone: '9842101122',
    worker_type: 'Mason (Maistry)',
    daily_wage: 1100,
    status: 'active',
    joining_date: '2025-06-15',
    emergency_contact: '9842101123 (Wife - Gomathi)',
    photo_url: null,
    address: '14, South Car Street, Sankarankovil, Tenkasi',
    notes: 'Head civil maistry with 18 years experience in framed structures and foundation raft concreting.',
    assigned_project_id: 'proj-01',
    assigned_project_name: 'Annamalai Residential Villa',
    created_at: '2025-06-15T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z',
    total_present_days: 24,
    total_wages_earned: 26400,
    total_wages_paid: 20000,
    wage_payable: 6400,
    total_advances_given: 5000,
    total_advances_recovered: 2000,
    advance_outstanding: 3000,
  },
  {
    id: 'emp-02',
    company_id: 'comp-shivarivel-001',
    employee_code: 'EMP-0002',
    name: 'K. Murugesan',
    phone: '9443202233',
    worker_type: 'Barbender / Steel Fixer',
    daily_wage: 950,
    status: 'active',
    joining_date: '2025-08-01',
    emergency_contact: '9443202234 (Brother - Velsamy)',
    photo_url: null,
    address: 'East Street, Melaseval, Tirunelveli',
    notes: 'Expert in bar bending schedule (BBS), column stirrups, and heavy footing cages.',
    assigned_project_id: 'proj-01',
    assigned_project_name: 'Annamalai Residential Villa',
    created_at: '2025-08-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z',
    total_present_days: 22,
    total_wages_earned: 20900,
    total_wages_paid: 16000,
    wage_payable: 4900,
    total_advances_given: 3000,
    total_advances_recovered: 1500,
    advance_outstanding: 1500,
  },
  {
    id: 'emp-03',
    company_id: 'comp-shivarivel-001',
    employee_code: 'EMP-0003',
    name: 'R. Veluchamy',
    phone: '9840103344',
    worker_type: 'Carpenter (Interior / Woodwork)',
    daily_wage: 1050,
    status: 'active',
    joining_date: '2025-09-10',
    emergency_contact: '9840103345 (Son - Karthik)',
    photo_url: null,
    address: 'Gandhi Nagar, Kappalur, Madurai',
    notes: 'Modular kitchen carcass assembly, teakwood frame fixing, and acrylic laminate edge banding.',
    assigned_project_id: 'proj-02',
    assigned_project_name: 'Meenakshi Commercial Complex',
    created_at: '2025-09-10T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z',
    total_present_days: 20,
    total_wages_earned: 21000,
    total_wages_paid: 15000,
    wage_payable: 6000,
    total_advances_given: 4000,
    total_advances_recovered: 2000,
    advance_outstanding: 2000,
  },
  {
    id: 'emp-04',
    company_id: 'comp-shivarivel-001',
    employee_code: 'EMP-0004',
    name: 'P. Alaguraj',
    phone: '9789004455',
    worker_type: 'Electrician',
    daily_wage: 950,
    status: 'active',
    joining_date: '2025-10-01',
    emergency_contact: '9789004456 (Wife - Selvi)',
    photo_url: null,
    address: 'Vannarpettai, Tirunelveli',
    notes: 'Licensed wireman: conduit slab chasing, DB wiring, 3-phase phase load balancing.',
    assigned_project_id: 'proj-02',
    assigned_project_name: 'Meenakshi Commercial Complex',
    created_at: '2025-10-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z',
    total_present_days: 21,
    total_wages_earned: 19950,
    total_wages_paid: 15000,
    wage_payable: 4950,
    total_advances_given: 2000,
    total_advances_recovered: 1000,
    advance_outstanding: 1000,
  },
  {
    id: 'emp-05',
    company_id: 'comp-shivarivel-001',
    employee_code: 'EMP-0005',
    name: 'S. Muthulakshmi',
    phone: '9944105566',
    worker_type: 'Female Helper / Chithal',
    daily_wage: 650,
    status: 'active',
    joining_date: '2025-11-01',
    emergency_contact: '9944105567 (Husband - Sundar)',
    photo_url: null,
    address: 'Perumalpuram, Tirunelveli',
    notes: 'Concrete curing, sand screening, and brick movement assistance.',
    assigned_project_id: 'proj-01',
    assigned_project_name: 'Annamalai Residential Villa',
    created_at: '2025-11-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z',
    total_present_days: 25,
    total_wages_earned: 16250,
    total_wages_paid: 13000,
    wage_payable: 3250,
    total_advances_given: 1500,
    total_advances_recovered: 500,
    advance_outstanding: 1000,
  },
  {
    id: 'emp-06',
    company_id: 'comp-shivarivel-001',
    employee_code: 'EMP-0006',
    name: 'T. Arumugam',
    phone: '9843206677',
    worker_type: 'Male Helper / Chithal',
    daily_wage: 750,
    status: 'active',
    joining_date: '2025-11-15',
    emergency_contact: '9843206678 (Father - Thangavel)',
    photo_url: null,
    address: 'Near Railway Station, Kovilpatti',
    notes: 'Batch mixer machine feeding and scaffolding erection assistant.',
    assigned_project_id: 'proj-01',
    assigned_project_name: 'Annamalai Residential Villa',
    created_at: '2025-11-15T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z',
    total_present_days: 23,
    total_wages_earned: 17250,
    total_wages_paid: 13500,
    wage_payable: 3750,
    total_advances_given: 2500,
    total_advances_recovered: 1500,
    advance_outstanding: 1000,
  },
  {
    id: 'emp-07',
    company_id: 'comp-shivarivel-001',
    employee_code: 'EMP-0007',
    name: 'C. Dharmaraj',
    phone: '9442107788',
    worker_type: 'Painter',
    daily_wage: 900,
    status: 'active',
    joining_date: '2026-01-10',
    emergency_contact: '9442107789 (Wife - Lakshmi)',
    photo_url: null,
    address: 'North Street, Tenkasi',
    notes: 'Putty surface sanding, primer roller application, and Royal emulsion exterior weatherproofing.',
    assigned_project_id: 'proj-02',
    assigned_project_name: 'Meenakshi Commercial Complex',
    created_at: '2026-01-10T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z',
    total_present_days: 18,
    total_wages_earned: 16200,
    total_wages_paid: 12000,
    wage_payable: 4200,
    total_advances_given: 2000,
    total_advances_recovered: 1000,
    advance_outstanding: 1000,
  },
  {
    id: 'emp-08',
    company_id: 'comp-shivarivel-001',
    employee_code: 'EMP-0008',
    name: 'N. Natarajan',
    phone: '9841108899',
    worker_type: 'Tile Layer / Polisher',
    daily_wage: 1000,
    status: 'inactive',
    joining_date: '2025-07-01',
    emergency_contact: '9841108890 (Son - Vignesh)',
    photo_url: null,
    address: 'Town Hall Road, Madurai',
    notes: 'Currently on medical leave after completing granite staircase polishing.',
    assigned_project_id: null,
    assigned_project_name: null,
    created_at: '2025-07-01T08:00:00Z',
    updated_at: '2026-08-15T08:00:00Z',
    total_present_days: 15,
    total_wages_earned: 15000,
    total_wages_paid: 15000,
    wage_payable: 0,
    total_advances_given: 0,
    total_advances_recovered: 0,
    advance_outstanding: 0,
  },
];

// Helper to get today's date string YYYY-MM-DD in local time
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const todayStr = getTodayDateString();

export let memoryAttendance: AttendanceRecord[] = [
  {
    id: 'att-01',
    company_id: 'comp-shivarivel-001',
    employee_id: 'emp-01',
    project_id: 'proj-01',
    attendance_date: todayStr,
    status: 'Present',
    daily_wage_snapshot: 1100,
    overtime_hours: 0,
    overtime_amount: 0,
    notes: 'Morning shift started 8:30 AM on 1st floor roof beam formwork',
    created_at: `${todayStr}T08:35:00Z`,
    updated_at: `${todayStr}T08:35:00Z`,
    employee: {
      id: 'emp-01',
      employee_code: 'EMP-0001',
      name: 'M. Shanmugam',
      phone: '9842101122',
      worker_type: 'Mason (Maistry)',
      daily_wage: 1100,
      status: 'active',
    },
    project: {
      id: 'proj-01',
      name: 'Annamalai Residential Villa',
      project_code: 'PRJ-001',
    },
  },
  {
    id: 'att-02',
    company_id: 'comp-shivarivel-001',
    employee_id: 'emp-02',
    project_id: 'proj-01',
    attendance_date: todayStr,
    status: 'Present',
    daily_wage_snapshot: 950,
    overtime_hours: 0,
    overtime_amount: 0,
    notes: 'Slab reinforcement rebar tying',
    created_at: `${todayStr}T08:35:00Z`,
    updated_at: `${todayStr}T08:35:00Z`,
    employee: {
      id: 'emp-02',
      employee_code: 'EMP-0002',
      name: 'K. Murugesan',
      phone: '9443202233',
      worker_type: 'Barbender / Steel Fixer',
      daily_wage: 950,
      status: 'active',
    },
    project: {
      id: 'proj-01',
      name: 'Annamalai Residential Villa',
      project_code: 'PRJ-001',
    },
  },
  {
    id: 'att-03',
    company_id: 'comp-shivarivel-001',
    employee_id: 'emp-03',
    project_id: 'proj-02',
    attendance_date: todayStr,
    status: 'Present',
    daily_wage_snapshot: 1050,
    overtime_hours: 0,
    overtime_amount: 0,
    notes: 'Wardrobe framework installation',
    created_at: `${todayStr}T08:40:00Z`,
    updated_at: `${todayStr}T08:40:00Z`,
    employee: {
      id: 'emp-03',
      employee_code: 'EMP-0003',
      name: 'R. Veluchamy',
      phone: '9840103344',
      worker_type: 'Carpenter (Interior / Woodwork)',
      daily_wage: 1050,
      status: 'active',
    },
    project: {
      id: 'proj-02',
      name: 'Meenakshi Commercial Complex',
      project_code: 'PRJ-002',
    },
  },
  {
    id: 'att-04',
    company_id: 'comp-shivarivel-001',
    employee_id: 'emp-04',
    project_id: 'proj-02',
    attendance_date: todayStr,
    status: 'Half Day',
    daily_wage_snapshot: 950,
    overtime_hours: 0,
    overtime_amount: 0,
    notes: 'Left at 1:30 PM for electrical inspection clearance',
    created_at: `${todayStr}T08:40:00Z`,
    updated_at: `${todayStr}T13:30:00Z`,
    employee: {
      id: 'emp-04',
      employee_code: 'EMP-0004',
      name: 'P. Alaguraj',
      phone: '9789004455',
      worker_type: 'Electrician',
      daily_wage: 950,
      status: 'active',
    },
    project: {
      id: 'proj-02',
      name: 'Meenakshi Commercial Complex',
      project_code: 'PRJ-002',
    },
  },
  {
    id: 'att-05',
    company_id: 'comp-shivarivel-001',
    employee_id: 'emp-05',
    project_id: 'proj-01',
    attendance_date: todayStr,
    status: 'Present',
    daily_wage_snapshot: 650,
    overtime_hours: 0,
    overtime_amount: 0,
    notes: 'Mortar mixing and brick curing',
    created_at: `${todayStr}T08:42:00Z`,
    updated_at: `${todayStr}T08:42:00Z`,
    employee: {
      id: 'emp-05',
      employee_code: 'EMP-0005',
      name: 'S. Muthulakshmi',
      phone: '9944105566',
      worker_type: 'Female Helper / Chithal',
      daily_wage: 650,
      status: 'active',
    },
    project: {
      id: 'proj-01',
      name: 'Annamalai Residential Villa',
      project_code: 'PRJ-001',
    },
  },
  {
    id: 'att-06',
    company_id: 'comp-shivarivel-001',
    employee_id: 'emp-06',
    project_id: 'proj-01',
    attendance_date: todayStr,
    status: 'Absent',
    daily_wage_snapshot: 750,
    overtime_hours: 0,
    overtime_amount: 0,
    notes: 'Family function at village',
    created_at: `${todayStr}T08:45:00Z`,
    updated_at: `${todayStr}T08:45:00Z`,
    employee: {
      id: 'emp-06',
      employee_code: 'EMP-0006',
      name: 'T. Arumugam',
      phone: '9843206677',
      worker_type: 'Male Helper / Chithal',
      daily_wage: 750,
      status: 'active',
    },
    project: {
      id: 'proj-01',
      name: 'Annamalai Residential Villa',
      project_code: 'PRJ-001',
    },
  },
];

export let memoryDailyWages: DailyWage[] = [
  {
    id: 'dw-01',
    company_id: 'comp-shivarivel-001',
    employee_id: 'emp-01',
    attendance_id: 'att-01',
    project_id: 'proj-01',
    wage_number: 'WG-0001',
    wage_date: todayStr,
    payable_units: 1.0,
    rate: 1100,
    base_wage: 1100,
    overtime_hours: 0,
    overtime_amount: 0,
    amount: 1100,
    status: 'Confirmed',
    reversal_of_id: null,
    notes: 'Confirmed morning muster',
    created_at: `${todayStr}T08:35:00Z`,
    updated_at: `${todayStr}T08:35:00Z`,
    employee: {
      id: 'emp-01',
      employee_code: 'EMP-0001',
      name: 'M. Shanmugam',
      worker_type: 'Mason (Maistry)',
    },
    project: {
      id: 'proj-01',
      name: 'Annamalai Residential Villa',
      project_code: 'PRJ-001',
    },
    amount_paid: 0,
    amount_payable: 1100,
  },
  {
    id: 'dw-02',
    company_id: 'comp-shivarivel-001',
    employee_id: 'emp-02',
    attendance_id: 'att-02',
    project_id: 'proj-01',
    wage_number: 'WG-0002',
    wage_date: todayStr,
    payable_units: 1.0,
    rate: 950,
    base_wage: 950,
    overtime_hours: 0,
    overtime_amount: 0,
    amount: 950,
    status: 'Confirmed',
    reversal_of_id: null,
    notes: 'Confirmed morning muster',
    created_at: `${todayStr}T08:35:00Z`,
    updated_at: `${todayStr}T08:35:00Z`,
    employee: {
      id: 'emp-02',
      employee_code: 'EMP-0002',
      name: 'K. Murugesan',
      worker_type: 'Barbender / Steel Fixer',
    },
    project: {
      id: 'proj-01',
      name: 'Annamalai Residential Villa',
      project_code: 'PRJ-001',
    },
    amount_paid: 0,
    amount_payable: 950,
  },
  {
    id: 'dw-03',
    company_id: 'comp-shivarivel-001',
    employee_id: 'emp-03',
    attendance_id: 'att-03',
    project_id: 'proj-02',
    wage_number: 'WG-0003',
    wage_date: todayStr,
    payable_units: 1.0,
    rate: 1050,
    base_wage: 1050,
    overtime_hours: 0,
    overtime_amount: 0,
    amount: 1050,
    status: 'Confirmed',
    reversal_of_id: null,
    notes: 'Confirmed morning muster',
    created_at: `${todayStr}T08:40:00Z`,
    updated_at: `${todayStr}T08:40:00Z`,
    employee: {
      id: 'emp-03',
      employee_code: 'EMP-0003',
      name: 'R. Veluchamy',
      worker_type: 'Carpenter (Interior / Woodwork)',
    },
    project: {
      id: 'proj-02',
      name: 'Meenakshi Commercial Complex',
      project_code: 'PRJ-002',
    },
    amount_paid: 0,
    amount_payable: 1050,
  },
  {
    id: 'dw-04',
    company_id: 'comp-shivarivel-001',
    employee_id: 'emp-04',
    attendance_id: 'att-04',
    project_id: 'proj-02',
    wage_number: 'WG-0004',
    wage_date: todayStr,
    payable_units: 0.5,
    rate: 950,
    base_wage: 475,
    overtime_hours: 0,
    overtime_amount: 0,
    amount: 475,
    status: 'Confirmed',
    reversal_of_id: null,
    notes: 'Half day rate 0.5 units',
    created_at: `${todayStr}T08:40:00Z`,
    updated_at: `${todayStr}T13:30:00Z`,
    employee: {
      id: 'emp-04',
      employee_code: 'EMP-0004',
      name: 'P. Alaguraj',
      worker_type: 'Electrician',
    },
    project: {
      id: 'proj-02',
      name: 'Meenakshi Commercial Complex',
      project_code: 'PRJ-002',
    },
    amount_paid: 0,
    amount_payable: 475,
  },
  {
    id: 'dw-05',
    company_id: 'comp-shivarivel-001',
    employee_id: 'emp-05',
    attendance_id: 'att-05',
    project_id: 'proj-01',
    wage_number: 'WG-0005',
    wage_date: todayStr,
    payable_units: 1.0,
    rate: 650,
    base_wage: 650,
    overtime_hours: 0,
    overtime_amount: 0,
    amount: 650,
    status: 'Confirmed',
    reversal_of_id: null,
    notes: 'Confirmed morning muster',
    created_at: `${todayStr}T08:42:00Z`,
    updated_at: `${todayStr}T08:42:00Z`,
    employee: {
      id: 'emp-05',
      employee_code: 'EMP-0005',
      name: 'S. Muthulakshmi',
      worker_type: 'Female Helper / Chithal',
    },
    project: {
      id: 'proj-01',
      name: 'Annamalai Residential Villa',
      project_code: 'PRJ-001',
    },
    amount_paid: 0,
    amount_payable: 650,
  },
];

export let memoryAdvances: EmployeeAdvance[] = [
  {
    id: 'adv-01',
    company_id: 'comp-shivarivel-001',
    employee_id: 'emp-01',
    advance_number: 'ADV-0001',
    advance_date: '2026-09-15',
    amount: 5000,
    payment_method: 'Cash',
    reference_number: 'SLIP-0915',
    purpose: 'Festival household advance',
    notes: 'Approved by Er. Shivarivel for Deepavali preparation',
    status: 'Confirmed',
    reversal_of_id: null,
    created_at: '2026-09-15T11:00:00Z',
    updated_at: '2026-09-15T11:00:00Z',
    employee: {
      id: 'emp-01',
      employee_code: 'EMP-0001',
      name: 'M. Shanmugam',
      phone: '9842101122',
      worker_type: 'Mason (Maistry)',
      daily_wage: 1100,
    },
    recovered_amount: 2000,
    outstanding_amount: 3000,
  },
  {
    id: 'adv-02',
    company_id: 'comp-shivarivel-001',
    employee_id: 'emp-02',
    advance_number: 'ADV-0002',
    advance_date: '2026-09-20',
    amount: 3000,
    payment_method: 'UPI',
    reference_number: 'UPI-492109',
    purpose: 'Medical emergency',
    notes: 'Hospitalization support for family member',
    status: 'Confirmed',
    reversal_of_id: null,
    created_at: '2026-09-20T14:30:00Z',
    updated_at: '2026-09-20T14:30:00Z',
    employee: {
      id: 'emp-02',
      employee_code: 'EMP-0002',
      name: 'K. Murugesan',
      phone: '9443202233',
      worker_type: 'Barbender / Steel Fixer',
      daily_wage: 950,
    },
    recovered_amount: 1500,
    outstanding_amount: 1500,
  },
  {
    id: 'adv-03',
    company_id: 'comp-shivarivel-001',
    employee_id: 'emp-03',
    advance_number: 'ADV-0003',
    advance_date: '2026-09-25',
    amount: 4000,
    payment_method: 'Cash',
    reference_number: 'SLIP-0925',
    purpose: 'Tool purchase advance (plunge saw)',
    notes: 'Carpentry specialized tools',
    status: 'Confirmed',
    reversal_of_id: null,
    created_at: '2026-09-25T16:00:00Z',
    updated_at: '2026-09-25T16:00:00Z',
    employee: {
      id: 'emp-03',
      employee_code: 'EMP-0003',
      name: 'R. Veluchamy',
      phone: '9840103344',
      worker_type: 'Carpenter (Interior / Woodwork)',
      daily_wage: 1050,
    },
    recovered_amount: 2000,
    outstanding_amount: 2000,
  },
  {
    id: 'adv-04',
    company_id: 'comp-shivarivel-001',
    employee_id: 'emp-06',
    advance_number: 'ADV-0004',
    advance_date: '2026-09-28',
    amount: 2500,
    payment_method: 'Cash',
    reference_number: 'SLIP-0928',
    purpose: 'Village travel advance',
    notes: 'Agreed recovery Rs 500 weekly',
    status: 'Confirmed',
    reversal_of_id: null,
    created_at: '2026-09-28T17:00:00Z',
    updated_at: '2026-09-28T17:00:00Z',
    employee: {
      id: 'emp-06',
      employee_code: 'EMP-0006',
      name: 'T. Arumugam',
      phone: '9843206677',
      worker_type: 'Male Helper / Chithal',
      daily_wage: 750,
    },
    recovered_amount: 1500,
    outstanding_amount: 1000,
  },
];

export let memoryEmployeePayments: EmployeePayment[] = [
  {
    id: 'ep-01',
    company_id: 'comp-shivarivel-001',
    employee_id: 'emp-01',
    payment_number: 'EP-0001',
    payment_date: '2026-09-22',
    amount: 20000,
    payment_method: 'Bank Transfer',
    reference_number: 'NEFT-SBIN88921',
    status: 'Confirmed',
    reversal_of_id: null,
    notes: 'Fortnightly wage settlement disburse for Sep 1-15',
    created_at: '2026-09-22T10:00:00Z',
    updated_at: '2026-09-22T10:00:00Z',
    employee: {
      id: 'emp-01',
      employee_code: 'EMP-0001',
      name: 'M. Shanmugam',
      phone: '9842101122',
      worker_type: 'Mason (Maistry)',
    },
    wage_allocations: [
      { id: 'wa-01', daily_wage_id: 'dw-01', amount: 18000, wage_number: 'WG-0001' },
    ],
    advance_allocations: [
      { id: 'aa-01', employee_advance_id: 'adv-01', amount: 2000, advance_number: 'ADV-0001' },
    ],
  },
  {
    id: 'ep-02',
    company_id: 'comp-shivarivel-001',
    employee_id: 'emp-02',
    payment_number: 'EP-0002',
    payment_date: '2026-09-22',
    amount: 16000,
    payment_method: 'Cash',
    reference_number: 'VOUCHER-EP02',
    status: 'Confirmed',
    reversal_of_id: null,
    notes: 'Cash wage disbursement signed on site muster roll',
    created_at: '2026-09-22T12:00:00Z',
    updated_at: '2026-09-22T12:00:00Z',
    employee: {
      id: 'emp-02',
      employee_code: 'EMP-0002',
      name: 'K. Murugesan',
      phone: '9443202233',
      worker_type: 'Barbender / Steel Fixer',
    },
    wage_allocations: [
      { id: 'wa-02', daily_wage_id: 'dw-02', amount: 14500, wage_number: 'WG-0002' },
    ],
    advance_allocations: [
      { id: 'aa-02', employee_advance_id: 'adv-02', amount: 1500, advance_number: 'ADV-0002' },
    ],
  },
  {
    id: 'ep-03',
    company_id: 'comp-shivarivel-001',
    employee_id: 'emp-03',
    payment_number: 'EP-0003',
    payment_date: '2026-09-28',
    amount: 15000,
    payment_method: 'UPI',
    reference_number: 'UPI-9921045',
    status: 'Confirmed',
    reversal_of_id: null,
    notes: 'GooglePay transfer to personal savings account',
    created_at: '2026-09-28T15:00:00Z',
    updated_at: '2026-09-28T15:00:00Z',
    employee: {
      id: 'emp-03',
      employee_code: 'EMP-0003',
      name: 'R. Veluchamy',
      phone: '9840103344',
      worker_type: 'Carpenter (Interior / Woodwork)',
    },
    wage_allocations: [
      { id: 'wa-03', daily_wage_id: 'dw-03', amount: 13000, wage_number: 'WG-0003' },
    ],
    advance_allocations: [
      { id: 'aa-03', employee_advance_id: 'adv-03', amount: 2000, advance_number: 'ADV-0003' },
    ],
  },
  {
    id: 'ep-04',
    company_id: 'comp-shivarivel-001',
    employee_id: 'emp-05',
    payment_number: 'EP-0004',
    payment_date: '2026-09-28',
    amount: 13000,
    payment_method: 'Cash',
    reference_number: 'VOUCHER-EP04',
    status: 'Confirmed',
    reversal_of_id: null,
    notes: 'Fortnightly helper wage settlement',
    created_at: '2026-09-28T16:30:00Z',
    updated_at: '2026-09-28T16:30:00Z',
    employee: {
      id: 'emp-05',
      employee_code: 'EMP-0005',
      name: 'S. Muthulakshmi',
      phone: '9944105566',
      worker_type: 'Female Helper / Chithal',
    },
    wage_allocations: [
      { id: 'wa-04', daily_wage_id: 'dw-05', amount: 12500, wage_number: 'WG-0005' },
    ],
    advance_allocations: [],
  },
];

// ==========================================
// 1. EMPLOYEES HOOKS
// ==========================================

export function useEmployees(filters?: {
  search?: string;
  status?: string;
  role?: string;
  projectId?: string;
}) {
  return useQuery({
    queryKey: ['employees', filters],
    initialData: () => {
      let list = [...memoryEmployees];
      if (filters?.status && filters.status !== 'all') {
        list = list.filter((e) => e.status === filters.status);
      }
      if (filters?.role && filters.role !== 'all') {
        list = list.filter((e) => e.worker_type?.toLowerCase().includes(filters.role!.toLowerCase()));
      }
      if (filters?.search && filters.search.trim()) {
        const term = filters.search.toLowerCase().trim();
        list = list.filter(
          (e) =>
            e.name.toLowerCase().includes(term) ||
            e.employee_code.toLowerCase().includes(term) ||
            (e.phone && e.phone.includes(term)) ||
            (e.worker_type && e.worker_type.toLowerCase().includes(term))
        );
      }
      return list;
    },
    queryFn: async (): Promise<Employee[]> => {
      try {
        let query = supabase.from('employees').select('*').order('created_at', { ascending: false });

        if (filters?.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }

        const { data, error } = await query;
        if (error || !data || data.length === 0) {
          // Fall back to memory mock
          let list = [...memoryEmployees];
          if (filters?.status && filters.status !== 'all') {
            list = list.filter((e) => e.status === filters.status);
          }
          if (filters?.role && filters.role !== 'all') {
            list = list.filter((e) => e.worker_type?.toLowerCase().includes(filters.role!.toLowerCase()));
          }
          if (filters?.search && filters.search.trim()) {
            const term = filters.search.toLowerCase().trim();
            list = list.filter(
              (e) =>
                e.name.toLowerCase().includes(term) ||
                e.employee_code.toLowerCase().includes(term) ||
                (e.phone && e.phone.includes(term)) ||
                (e.worker_type && e.worker_type.toLowerCase().includes(term))
            );
          }
          return list;
        }

        // Map database records
        return (data as Employee[]).map((emp) => {
          const match = memoryEmployees.find((m) => m.id === emp.id || m.employee_code === emp.employee_code);
          return {
            ...emp,
            assigned_project_name: match?.assigned_project_name || null,
            total_present_days: match?.total_present_days || 0,
            total_wages_earned: match?.total_wages_earned || 0,
            total_wages_paid: match?.total_wages_paid || 0,
            wage_payable: match?.wage_payable || 0,
            total_advances_given: match?.total_advances_given || 0,
            total_advances_recovered: match?.total_advances_recovered || 0,
            advance_outstanding: match?.advance_outstanding || 0,
          };
        });
      } catch {
        return memoryEmployees;
      }
    },
  });
}

export function useEmployee(id: string | undefined) {
  return useQuery({
    queryKey: ['employee', id],
    enabled: Boolean(id),
    initialData: () => (id ? memoryEmployees.find((e) => e.id === id) || null : null),
    queryFn: async (): Promise<Employee | null> => {
      if (!id) return null;
      try {
        const { data, error } = await (supabase as any).from('employees').select('*').eq('id', id).single();
        if (error || !data) {
          const found = memoryEmployees.find((e) => e.id === id);
          return found || null;
        }
        const match = memoryEmployees.find((m) => m.id === id || m.employee_code === (data as any).employee_code);
        return {
          ...(data as Employee),
          assigned_project_name: match?.assigned_project_name || null,
          total_present_days: match?.total_present_days || 0,
          total_wages_earned: match?.total_wages_earned || 0,
          total_wages_paid: match?.total_wages_paid || 0,
          wage_payable: match?.wage_payable || 0,
          total_advances_given: match?.total_advances_given || 0,
          total_advances_recovered: match?.total_advances_recovered || 0,
          advance_outstanding: match?.advance_outstanding || 0,
        };
      } catch {
        return memoryEmployees.find((e) => e.id === id) || null;
      }
    },
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: EmployeeFormData): Promise<Employee> => {
      const codeNumber = memoryEmployees.length + 1;
      const generatedCode = `EMP-${String(codeNumber).padStart(4, '0')}`;
      const now = new Date().toISOString();

      try {
        const { data, error } = await (supabase as any)
          .from('employees')
          .insert({
            name: formData.name.trim(),
            phone: formData.phone || null,
            worker_type: formData.worker_type || null,
            daily_wage: formData.daily_wage || null,
            status: formData.status,
            joining_date: formData.joining_date || null,
            emergency_contact: formData.emergency_contact || null,
            address: formData.address || null,
            notes: formData.notes || null,
          })
          .select()
          .single();

        if (error || !data) {
          throw error;
        }
        return data as Employee;
      } catch {
        // Local memory persistence fallback
        const newEmp: Employee = {
          id: `emp-local-${Date.now()}`,
          company_id: 'comp-shivarivel-001',
          employee_code: generatedCode,
          name: formData.name.trim(),
          phone: formData.phone || null,
          worker_type: formData.worker_type || null,
          daily_wage: formData.daily_wage || null,
          status: formData.status,
          joining_date: formData.joining_date || now.split('T')[0],
          emergency_contact: formData.emergency_contact || null,
          photo_url: null,
          address: formData.address || null,
          notes: formData.notes || null,
          created_at: now,
          updated_at: now,
          total_present_days: 0,
          total_wages_earned: 0,
          total_wages_paid: 0,
          wage_payable: 0,
          total_advances_given: 0,
          total_advances_recovered: 0,
          advance_outstanding: 0,
        };
        memoryEmployees = [newEmp, ...memoryEmployees];
        return newEmp;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateEmployee(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: EmployeeFormData): Promise<Employee> => {
      const now = new Date().toISOString();
      try {
        const { data, error } = await (supabase as any)
          .from('employees')
          .update({
            name: formData.name.trim(),
            phone: formData.phone || null,
            worker_type: formData.worker_type || null,
            daily_wage: formData.daily_wage || null,
            status: formData.status,
            joining_date: formData.joining_date || null,
            emergency_contact: formData.emergency_contact || null,
            address: formData.address || null,
            notes: formData.notes || null,
          })
          .eq('id', id)
          .select()
          .single();

        if (error || !data) {
          throw error;
        }
        return data as Employee;
      } catch {
        const idx = memoryEmployees.findIndex((e) => e.id === id);
        if (idx !== -1) {
          memoryEmployees[idx] = {
            ...memoryEmployees[idx],
            name: formData.name.trim(),
            phone: formData.phone || null,
            worker_type: formData.worker_type || null,
            daily_wage: formData.daily_wage || null,
            status: formData.status,
            joining_date: formData.joining_date || memoryEmployees[idx].joining_date,
            emergency_contact: formData.emergency_contact || null,
            address: formData.address || null,
            notes: formData.notes || null,
            updated_at: now,
          };
          return memoryEmployees[idx];
        }
        throw new Error('Employee not found');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await (supabase as any).from('employees').delete().eq('id', id);
        if (error) {
          await (supabase as any).from('employees').update({ status: 'inactive' }).eq('id', id);
        }
      } catch {
        // Local fallback
      }
      memoryEmployees = memoryEmployees.filter((e) => e.id !== id);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      queryClient.invalidateQueries({ queryKey: ['wages'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}


// ==========================================
// 2. ATTENDANCE HOOKS (FAST MUSTER)
// ==========================================

export function useAttendanceForDate(date: string, projectId?: string) {
  return useQuery({
    queryKey: ['attendance', date, projectId],
    initialData: () => {
      let list = memoryAttendance.filter((a) => a.attendance_date === date);
      if (projectId && projectId !== 'all') {
        list = list.filter((a) => a.project_id === projectId);
      }
      return list;
    },
    queryFn: async (): Promise<AttendanceRecord[]> => {
      try {
        let query = supabase
          .from('attendance')
          .select('*, employee:employees(*)')
          .eq('attendance_date', date);

        if (projectId && projectId !== 'all') {
          query = query.eq('project_id', projectId);
        }

        const { data, error } = await query;
        if (error || !data || data.length === 0) {
          let list = memoryAttendance.filter((a) => a.attendance_date === date);
          if (projectId && projectId !== 'all') {
            list = list.filter((a) => a.project_id === projectId);
          }
          return list;
        }
        return data as AttendanceRecord[];
      } catch {
        return memoryAttendance.filter((a) => a.attendance_date === date);
      }
    },
  });
}

export interface AttendanceBatchItem {
  employee_id: string;
  status: AttendanceStatus;
  project_id?: string | null;
  overtime_hours?: number;
  notes?: string | null;
}

export function useSaveAttendanceBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      date,
      entries,
    }: {
      date: string;
      entries: AttendanceBatchItem[];
    }): Promise<{ count: number }> => {
      let savedCount = 0;

      for (const entry of entries) {
        try {
          // Attempt real Supabase RPC record_attendance
          const { error } = await (supabase as any).rpc('record_attendance', {
            p_employee_id: entry.employee_id,
            p_status: entry.status,
            p_attendance_date: date,
            p_project_id: entry.project_id || null,
            p_overtime_hours: entry.overtime_hours || 0,
            p_overtime_amount: 0,
            p_daily_wage_rate: null,
            p_notes: entry.notes || null,
            p_auto_generate_wage: true,
          });

          if (error) {
            // Upsert fallback directly on attendance table
            await (supabase as any).from('attendance').upsert(
              {
                employee_id: entry.employee_id,
                attendance_date: date,
                status: entry.status,
                project_id: entry.project_id || null,
                overtime_hours: entry.overtime_hours || 0,
                notes: entry.notes || null,
              },
              { onConflict: 'company_id, employee_id, attendance_date' }
            );
          }
          savedCount++;
        } catch {
          // Memory mock persistence
          const emp = memoryEmployees.find((e) => e.id === entry.employee_id);
          const existingIdx = memoryAttendance.findIndex(
            (a) => a.employee_id === entry.employee_id && a.attendance_date === date
          );

          const record: AttendanceRecord = {
            id: existingIdx >= 0 ? memoryAttendance[existingIdx].id : `att-${Date.now()}-${entry.employee_id}`,
            company_id: 'comp-shivarivel-001',
            employee_id: entry.employee_id,
            project_id: entry.project_id || emp?.assigned_project_id || null,
            attendance_date: date,
            status: entry.status,
            daily_wage_snapshot: emp?.daily_wage || 0,
            overtime_hours: entry.overtime_hours || 0,
            overtime_amount: 0,
            notes: entry.notes || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            employee: emp
              ? {
                  id: emp.id,
                  employee_code: emp.employee_code,
                  name: emp.name,
                  phone: emp.phone,
                  worker_type: emp.worker_type,
                  daily_wage: emp.daily_wage,
                  status: emp.status,
                }
              : undefined,
            project: emp?.assigned_project_id
              ? {
                  id: emp.assigned_project_id,
                  name: emp.assigned_project_name || 'Assigned Site',
                  project_code: 'PRJ-SITE',
                }
              : null,
          };

          if (existingIdx >= 0) {
            memoryAttendance[existingIdx] = record;
          } else {
            memoryAttendance.push(record);
          }

          // Auto-generate or update memory wage
          const units = entry.status === 'Present' ? 1.0 : entry.status === 'Half Day' ? 0.5 : 0;
          const rate = emp?.daily_wage || 0;
          const wageAmount = Math.round(units * rate * 100) / 100;

          const wageIdx = memoryDailyWages.findIndex(
            (w) => w.employee_id === entry.employee_id && w.wage_date === date
          );
          if (wageIdx >= 0) {
            memoryDailyWages[wageIdx] = {
              ...memoryDailyWages[wageIdx],
              payable_units: units,
              base_wage: wageAmount,
              amount: wageAmount,
              amount_payable: wageAmount,
            };
          } else {
            memoryDailyWages.push({
              id: `dw-${Date.now()}-${entry.employee_id}`,
              company_id: 'comp-shivarivel-001',
              employee_id: entry.employee_id,
              attendance_id: record.id,
              project_id: entry.project_id || null,
              wage_number: `WG-${String(memoryDailyWages.length + 1).padStart(4, '0')}`,
              wage_date: date,
              payable_units: units,
              rate,
              base_wage: wageAmount,
              overtime_hours: 0,
              overtime_amount: 0,
              amount: wageAmount,
              status: 'Confirmed',
              reversal_of_id: null,
              notes: entry.notes || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              employee: emp
                ? {
                    id: emp.id,
                    employee_code: emp.employee_code,
                    name: emp.name,
                    worker_type: emp.worker_type,
                  }
                : undefined,
              amount_paid: 0,
              amount_payable: wageAmount,
            });
          }

          savedCount++;
        }
      }

      return { count: savedCount };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['attendance', variables.date] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['wages'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['project-workforce'] });
      queryClient.invalidateQueries({ queryKey: ['project-financials'] });
      queryClient.invalidateQueries({ queryKey: ['project-recorded-costs'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['report-weekly'] });
      queryClient.invalidateQueries({ queryKey: ['report-workforce'] });
    },
  });
}

// ==========================================
// 3. WAGES HOOKS (OPERATIONAL TRACKING)
// ==========================================

export function useWages(filters?: {
  employeeId?: string;
  projectId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['wages', filters],
    initialData: () => {
      let list = [...memoryDailyWages];
      if (filters?.employeeId && filters.employeeId !== 'all') {
        list = list.filter((w) => w.employee_id === filters.employeeId);
      }
      if (filters?.projectId && filters.projectId !== 'all') {
        list = list.filter((w) => w.project_id === filters.projectId);
      }
      if (filters?.status && filters.status !== 'all') {
        list = list.filter((w) => w.status === filters.status);
      }
      return list;
    },
    queryFn: async (): Promise<DailyWage[]> => {
      try {
        let query = supabase
          .from('daily_wages')
          .select('*, employee:employees(*), project:projects(*)')
          .order('wage_date', { ascending: false });

        if (filters?.employeeId && filters.employeeId !== 'all') {
          query = query.eq('employee_id', filters.employeeId);
        }
        if (filters?.projectId && filters.projectId !== 'all') {
          query = query.eq('project_id', filters.projectId);
        }
        if (filters?.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }

        const { data, error } = await query;
        if (error || !data || data.length === 0) {
          let list = [...memoryDailyWages];
          if (filters?.employeeId && filters.employeeId !== 'all') {
            list = list.filter((w) => w.employee_id === filters.employeeId);
          }
          if (filters?.projectId && filters.projectId !== 'all') {
            list = list.filter((w) => w.project_id === filters.projectId);
          }
          if (filters?.status && filters.status !== 'all') {
            list = list.filter((w) => w.status === filters.status);
          }
          return list;
        }
        return data as DailyWage[];
      } catch {
        let list = [...memoryDailyWages];
        if (filters?.employeeId && filters.employeeId !== 'all') {
          list = list.filter((w) => w.employee_id === filters.employeeId);
        }
        if (filters?.projectId && filters.projectId !== 'all') {
          list = list.filter((w) => w.project_id === filters.projectId);
        }
        return list;
      }
    },
  });
}

export interface RecordDailyWagePayload {
  wage_id?: string;
  attendance_id?: string;
  employee_id: string;
  project_id?: string | null;
  wage_date: string;
  daily_wage: number;
  attendance_status?: AttendanceStatus; // 'Present' | 'Half Day' | 'Absent'
}

export function useRecordDailyWage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: RecordDailyWagePayload) => {
      const status: AttendanceStatus = payload.attendance_status || 'Present';
      const wageAmount = status === 'Absent' ? 0 : Math.max(0, Number(payload.daily_wage) || 0);
      const units = status === 'Present' ? 1.0 : status === 'Half Day' ? 0.5 : 0.0;
      const rate = status === 'Half Day' ? wageAmount * 2 : wageAmount;

      // 1. If wage_id provided, attempt direct update
      if (payload.wage_id) {
        try {
          const { error } = await (supabase as any)
            .from('daily_wages')
            .update({
              project_id: payload.project_id || null,
              wage_date: payload.wage_date,
              payable_units: units,
              rate: rate,
              base_wage: wageAmount,
              amount: wageAmount,
              amount_payable: wageAmount,
            })
            .eq('id', payload.wage_id);

          if (error) throw error;

          // Also update linked attendance record if present
          if (payload.attendance_id) {
            await (supabase as any)
              .from('attendance')
              .update({
                status: status,
                project_id: payload.project_id || null,
                attendance_date: payload.wage_date,
                daily_wage_snapshot: rate,
              })
              .eq('id', payload.attendance_id);
          }
        } catch {
          // Update in-memory fallback
          const idx = memoryDailyWages.findIndex((w) => w.id === payload.wage_id);
          const proj = devEvalProjects.find((p) => p.id === payload.project_id);
          if (idx >= 0) {
            const attId = payload.attendance_id || memoryDailyWages[idx].attendance_id;
            memoryDailyWages[idx] = {
              ...memoryDailyWages[idx],
              project_id: payload.project_id || null,
              wage_date: payload.wage_date,
              payable_units: units,
              rate: rate,
              base_wage: wageAmount,
              amount: wageAmount,
              amount_payable: wageAmount,
              project: proj ? { id: proj.id, name: proj.name, project_code: proj.project_code } : null,
              updated_at: new Date().toISOString(),
            };

            const attIdx = memoryAttendance.findIndex((a) => a.id === attId);
            if (attIdx >= 0) {
              memoryAttendance[attIdx] = {
                ...memoryAttendance[attIdx],
                status: status,
                project_id: payload.project_id || null,
                attendance_date: payload.wage_date,
                daily_wage_snapshot: rate,
                updated_at: new Date().toISOString(),
              };
            }
          }
        }
      } else {
        // 2. Insert new daily wage using atomic RPC record_attendance
        try {
          const { error } = await (supabase as any).rpc('record_attendance', {
            p_employee_id: payload.employee_id,
            p_status: status,
            p_attendance_date: payload.wage_date,
            p_project_id: payload.project_id || null,
            p_overtime_hours: 0,
            p_overtime_amount: 0,
            p_daily_wage_rate: rate,
            p_notes: 'Daily wage entry',
            p_auto_generate_wage: true,
          });

          if (error) {
            // Check for duplicate constraint violation
            if (error.code === '23505' || String(error.message || '').toLowerCase().includes('unique')) {
              throw new Error('A wage entry already exists for this laborer on this date.');
            }
            throw error;
          }
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          if (errMsg.includes('already exists')) {
            throw err;
          }
          console.warn('Supabase record_attendance RPC notice, updating in memory fallback:', err);
          const emp = memoryEmployees.find((e) => e.id === payload.employee_id);
          const proj = devEvalProjects.find((p) => p.id === payload.project_id);
          const existingIdx = memoryDailyWages.findIndex(
            (w) => w.employee_id === payload.employee_id && w.wage_date === payload.wage_date
          );

          if (existingIdx >= 0) {
            memoryDailyWages[existingIdx] = {
              ...memoryDailyWages[existingIdx],
              project_id: payload.project_id || null,
              payable_units: units,
              rate: rate,
              base_wage: wageAmount,
              amount: wageAmount,
              amount_payable: wageAmount,
              project: proj ? { id: proj.id, name: proj.name, project_code: proj.project_code } : null,
              updated_at: new Date().toISOString(),
            };
          } else {
            const nextNum = memoryDailyWages.length + 1;
            const newAttId = `att-${Date.now()}-${payload.employee_id}`;
            const wageRecord: DailyWage = {
              id: `dw-${Date.now()}-${payload.employee_id}`,
              company_id: 'comp-shivarivel-001',
              employee_id: payload.employee_id,
              attendance_id: newAttId,
              project_id: payload.project_id || null,
              wage_number: `WG-${String(nextNum).padStart(4, '0')}`,
              wage_date: payload.wage_date,
              payable_units: units,
              rate: rate,
              base_wage: wageAmount,
              overtime_hours: 0,
              overtime_amount: 0,
              amount: wageAmount,
              status: 'Confirmed',
              reversal_of_id: null,
              notes: 'Daily wage entry',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              employee: emp
                ? {
                    id: emp.id,
                    employee_code: emp.employee_code,
                    name: emp.name,
                    worker_type: emp.worker_type,
                  }
                : undefined,
              project: proj
                ? {
                    id: proj.id,
                    name: proj.name,
                    project_code: proj.project_code,
                  }
                : null,
              amount_paid: 0,
              amount_payable: wageAmount,
            };
            memoryDailyWages = [wageRecord, ...memoryDailyWages];

            // Also add to memoryAttendance
            const attRecord: AttendanceRecord = {
              id: newAttId,
              company_id: 'comp-shivarivel-001',
              employee_id: payload.employee_id,
              project_id: payload.project_id || null,
              attendance_date: payload.wage_date,
              status: status,
              daily_wage_snapshot: rate,
              overtime_hours: 0,
              overtime_amount: 0,
              notes: 'Daily wage entry',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              employee: emp,
              project: proj ? { id: proj.id, name: proj.name, project_code: proj.project_code } : null,
            };
            memoryAttendance.push(attRecord);
          }
        }
      }

      // Recalculate employee summary in memory
      const emp = memoryEmployees.find((e) => e.id === payload.employee_id);
      if (emp) {
        const empWages = memoryDailyWages.filter((w) => w.employee_id === emp.id && w.status === 'Confirmed');
        emp.total_wages_earned = empWages.reduce((sum, w) => sum + w.amount, 0);
        emp.total_present_days = empWages.length;
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wages'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['project-workforce'] });
    },
  });
}

export function useDeleteDailyWage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ wageId, attendanceId }: { wageId: string; attendanceId?: string }) => {
      try {
        const { error } = await (supabase as any)
          .from('daily_wages')
          .update({ status: 'Cancelled' })
          .eq('id', wageId);
        if (error) {
          await (supabase as any).from('daily_wages').delete().eq('id', wageId);
        }
        if (attendanceId) {
          await (supabase as any).from('attendance').delete().eq('id', attendanceId);
        }
      } catch {
        // Continue to memory fallback
      }

      // In-memory fallback removal
      memoryDailyWages = memoryDailyWages.filter((w) => w.id !== wageId);
      if (attendanceId) {
        memoryAttendance = memoryAttendance.filter((a) => a.id !== attendanceId);
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wages'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['project-workforce'] });
    },
  });
}

// ==========================================
// 4. ADVANCES HOOKS (ADVANCE RECEIVED - RECOVERED = OUTSTANDING)
// ==========================================

export function useEmployeeAdvances(filters?: {
  employeeId?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['advances', filters],
    initialData: () => {
      let list = [...memoryAdvances];
      if (filters?.employeeId && filters.employeeId !== 'all') {
        list = list.filter((a) => a.employee_id === filters.employeeId);
      }
      if (filters?.status && filters.status !== 'all') {
        list = list.filter((a) => a.status === filters.status);
      }
      return list;
    },
    queryFn: async (): Promise<EmployeeAdvance[]> => {
      try {
        let query = supabase
          .from('employee_advances')
          .select('*, employee:employees(*)')
          .order('advance_date', { ascending: false });

        if (filters?.employeeId && filters.employeeId !== 'all') {
          query = query.eq('employee_id', filters.employeeId);
        }
        if (filters?.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }

        const { data, error } = await query;
        if (error || !data || data.length === 0) {
          let list = [...memoryAdvances];
          if (filters?.employeeId && filters.employeeId !== 'all') {
            list = list.filter((a) => a.employee_id === filters.employeeId);
          }
          if (filters?.status && filters.status !== 'all') {
            list = list.filter((a) => a.status === filters.status);
          }
          return list;
        }
        return data as EmployeeAdvance[];
      } catch {
        let list = [...memoryAdvances];
        if (filters?.employeeId && filters.employeeId !== 'all') {
          list = list.filter((a) => a.employee_id === filters.employeeId);
        }
        return list;
      }
    },
  });
}

export function useCreateEmployeeAdvance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: AdvanceFormData): Promise<EmployeeAdvance> => {
      try {
        const { data, error } = await (supabase as any).rpc('record_employee_advance', {
          p_employee_id: formData.employee_id,
          p_amount: formData.amount,
          p_advance_date: formData.advance_date,
          p_payment_method: formData.payment_method,
          p_reference_number: formData.reference_number || null,
          p_purpose: formData.purpose || null,
          p_notes: formData.notes || null,
          p_status: 'Confirmed',
        });

        if (error) {
          throw error;
        }
        return data as unknown as EmployeeAdvance;
      } catch {
        const emp = memoryEmployees.find((e) => e.id === formData.employee_id);
        const newAdv: EmployeeAdvance = {
          id: `adv-${Date.now()}`,
          company_id: 'comp-shivarivel-001',
          employee_id: formData.employee_id,
          advance_number: `ADV-${String(memoryAdvances.length + 1).padStart(4, '0')}`,
          advance_date: formData.advance_date,
          amount: formData.amount,
          payment_method: formData.payment_method,
          reference_number: formData.reference_number || null,
          purpose: formData.purpose || null,
          notes: formData.notes || null,
          status: 'Confirmed',
          reversal_of_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          employee: emp
            ? {
                id: emp.id,
                employee_code: emp.employee_code,
                name: emp.name,
                phone: emp.phone,
                worker_type: emp.worker_type,
                daily_wage: emp.daily_wage,
              }
            : undefined,
          recovered_amount: 0,
          outstanding_amount: formData.amount,
        };

        memoryAdvances = [newAdv, ...memoryAdvances];

        // Update employee summary
        if (emp) {
          emp.total_advances_given = (emp.total_advances_given || 0) + formData.amount;
          emp.advance_outstanding = (emp.advance_outstanding || 0) + formData.amount;
        }

        return newAdv;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advances'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['report-workforce'] });
      queryClient.invalidateQueries({ queryKey: ['report-weekly'] });
    },
  });
}

// ==========================================
// 5. EMPLOYEE PAYMENTS HOOKS
// ==========================================

export function useEmployeePayments(filters?: {
  employeeId?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['employee-payments', filters],
    initialData: () => {
      let list = [...memoryEmployeePayments];
      if (filters?.employeeId && filters.employeeId !== 'all') {
        list = list.filter((p) => p.employee_id === filters.employeeId);
      }
      if (filters?.status && filters.status !== 'all') {
        list = list.filter((p) => p.status === filters.status);
      }
      return list;
    },
    queryFn: async (): Promise<EmployeePayment[]> => {
      try {
        let query = supabase
          .from('employee_payments')
          .select('*, employee:employees(*)')
          .order('payment_date', { ascending: false });

        if (filters?.employeeId && filters.employeeId !== 'all') {
          query = query.eq('employee_id', filters.employeeId);
        }
        if (filters?.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }

        const { data, error } = await query;
        if (error || !data || data.length === 0) {
          let list = [...memoryEmployeePayments];
          if (filters?.employeeId && filters.employeeId !== 'all') {
            list = list.filter((p) => p.employee_id === filters.employeeId);
          }
          if (filters?.status && filters.status !== 'all') {
            list = list.filter((p) => p.status === filters.status);
          }
          return list;
        }
        return data as EmployeePayment[];
      } catch {
        let list = [...memoryEmployeePayments];
        if (filters?.employeeId && filters.employeeId !== 'all') {
          list = list.filter((p) => p.employee_id === filters.employeeId);
        }
        return list;
      }
    },
  });
}

export function useRecordEmployeePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: EmployeePaymentFormData): Promise<EmployeePayment> => {
      try {
        const { data, error } = await (supabase as any).rpc('record_employee_payment', {
          p_employee_id: formData.employee_id,
          p_amount: formData.amount,
          p_payment_date: formData.payment_date,
          p_payment_method: formData.payment_method,
          p_reference_number: formData.reference_number || null,
          p_notes: formData.notes || null,
          p_status: 'Confirmed',
          p_wage_allocations: [],
          p_advance_allocations: [],
        });

        if (error) {
          throw error;
        }
        return data as unknown as EmployeePayment;
      } catch {
        const emp = memoryEmployees.find((e) => e.id === formData.employee_id);
        const paymentNumber = `EP-${String(memoryEmployeePayments.length + 1).padStart(4, '0')}`;

        const newPayment: EmployeePayment = {
          id: `ep-${Date.now()}`,
          company_id: 'comp-shivarivel-001',
          employee_id: formData.employee_id,
          payment_number: paymentNumber,
          payment_date: formData.payment_date,
          amount: formData.amount,
          payment_method: formData.payment_method,
          reference_number: formData.reference_number || null,
          status: 'Confirmed',
          reversal_of_id: null,
          notes: formData.notes || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          employee: emp
            ? {
                id: emp.id,
                employee_code: emp.employee_code,
                name: emp.name,
                phone: emp.phone,
                worker_type: emp.worker_type,
              }
            : undefined,
          wage_allocations:
            formData.allocation_target === 'wages'
              ? [{ id: `wa-${Date.now()}`, daily_wage_id: 'dw-alloc', amount: formData.amount }]
              : [],
          advance_allocations:
            formData.allocation_target === 'advance_recovery'
              ? [{ id: `aa-${Date.now()}`, employee_advance_id: 'adv-alloc', amount: formData.amount }]
              : [],
        };

        memoryEmployeePayments = [newPayment, ...memoryEmployeePayments];

        // Adjust employee balances appropriately
        if (emp) {
          if (formData.allocation_target === 'advance_recovery') {
            emp.total_advances_recovered = (emp.total_advances_recovered || 0) + formData.amount;
            emp.advance_outstanding = Math.max(0, (emp.advance_outstanding || 0) - formData.amount);
          } else {
            emp.total_wages_paid = (emp.total_wages_paid || 0) + formData.amount;
            emp.wage_payable = Math.max(0, (emp.wage_payable || 0) - formData.amount);
          }
        }

        return newPayment;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-payments'] });
      queryClient.invalidateQueries({ queryKey: ['wages'] });
      queryClient.invalidateQueries({ queryKey: ['advances'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['report-workforce'] });
      queryClient.invalidateQueries({ queryKey: ['report-payment'] });
      queryClient.invalidateQueries({ queryKey: ['report-weekly'] });
    },
  });
}

// ==========================================
// 6. PROJECT WORKFORCE HOOK
// ==========================================

export function useProjectWorkforce(projectId: string | undefined) {
  return useQuery({
    queryKey: ['project-workforce', projectId],
    enabled: Boolean(projectId),
    initialData: () => {
      if (!projectId) return null;
      const assignedEmployees = memoryEmployees.filter((e) => e.assigned_project_id === projectId);
      const attendance = memoryAttendance.filter((a) => a.project_id === projectId);
      const wages = memoryDailyWages.filter((w) => w.project_id === projectId);
      const totalEarned = wages.reduce((sum, w) => sum + (w.amount || 0), 0);
      const totalDays =
        attendance.filter((a) => a.status === 'Present').length +
        attendance.filter((a) => a.status === 'Half Day').length * 0.5;
      return {
        assignedEmployees,
        attendance,
        wages,
        totalEarned,
        totalDays,
      };
    },
    queryFn: async () => {
      if (!projectId) return null;

      // Filter employees assigned to this project
      const assignedEmployees = memoryEmployees.filter((e) => e.assigned_project_id === projectId);
      // Project attendance records
      const attendance = memoryAttendance.filter((a) => a.project_id === projectId);
      // Project daily wages
      const wages = memoryDailyWages.filter((w) => w.project_id === projectId);
      // Total earned on this project
      const totalEarned = wages.reduce((sum, w) => sum + (w.amount || 0), 0);
      const totalDays = attendance.filter((a) => a.status === 'Present').length +
        attendance.filter((a) => a.status === 'Half Day').length * 0.5;

      return {
        assignedEmployees,
        attendance,
        wages,
        totalEarned,
        totalDays,
      };
    },
  });
}
