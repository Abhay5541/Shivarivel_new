import { useLocation } from 'react-router-dom';
import {
  Building2,
  CalendarCheck,
  CheckSquare,
  PhoneCall,
  Bell,
  Users,
  HelpCircle,
  Compass,
  Calculator,
  ListTodo,
  ClipboardList,
  Truck,
  Package,
  ShoppingCart,
  ReceiptIndianRupee,
  UserCheck,
  Clock4,
  Coins,
  HandCoins,
  Wallet,
  CreditCard,
  Receipt,
  PieChart,
  Calendar,
  BarChart3,
  ShoppingBag,
  Users2,
  FileSpreadsheet,
  Building,
  ShieldCheck,
  Briefcase,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';

interface ModuleConfig {
  title: string;
  subtitle: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
}

const moduleConfigs: Record<string, ModuleConfig> = {
  // Main & My Day
  '/today': {
    title: "Today's Operations Briefing",
    subtitle: 'Morning site checks, active trade crew shifts, deliveries scheduled, and urgent follow-ups.',
    category: 'My Day Operations',
    icon: CalendarCheck,
  },
  '/my-day': {
    title: 'My Day (Daily Operations)',
    subtitle: 'Morning briefing, pending site tasks, inspections, and customer follow-up timeline.',
    category: 'My Day Operations',
    icon: CalendarCheck,
  },
  '/tasks': {
    title: 'Site Tasks & Milestones',
    subtitle: 'Actionable trade tasks, supervisor inspections, checklist verifications, and quality flags.',
    category: 'My Day Operations',
    icon: CheckSquare,
  },
  '/follow-ups': {
    title: 'Customer Follow-ups',
    subtitle: 'Scheduled phone calls, estimate presentation meetings, and commercial milestone check-ins.',
    category: 'My Day Operations',
    icon: PhoneCall,
  },
  '/reminders': {
    title: 'Reminders & Alerts',
    subtitle: 'Supplier payment due dates, GST filing deadlines, material delivery windows, and site permits.',
    category: 'My Day Operations',
    icon: Bell,
  },

  // Business CRM
  '/customers': {
    title: 'Customers Directory',
    subtitle: 'Central client book, verified contacts, project history, and lifetime receivable status.',
    category: 'Business & CRM',
    icon: Users,
  },
  '/enquiries': {
    title: 'Enquiries Pipeline',
    subtitle: 'Lead capture, site consultations, requirements intake, and conversion stage tracking.',
    category: 'Business & CRM',
    icon: HelpCircle,
  },
  '/site-visits': {
    title: 'Site Visits',
    subtitle: 'Preliminary plot inspections, structural surveys, and consultation reports.',
    category: 'Business & CRM',
    icon: Compass,
  },
  '/estimates': {
    title: 'Estimates & BOQ Valuations',
    subtitle: 'Itemized material & labor estimates, commercial quotes, and client acceptance.',
    category: 'Business & CRM',
    icon: Calculator,
  },

  // Projects & Operations
  '/projects': {
    title: 'Projects Directory',
    subtitle: 'Portfolio of active construction and interior sites, contract values, and recorded costs.',
    category: 'Projects & Operations',
    icon: Building2,
  },
  '/work-progress': {
    title: 'Work Progress Management',
    subtitle: 'Milestone tracking, stage percentages, checklist verifications, and handover logs.',
    category: 'Projects & Operations',
    icon: ListTodo,
  },
  '/projects/progress': {
    title: 'Work Progress Management',
    subtitle: 'Milestone tracking, stage percentages, checklist verifications, and handover logs.',
    category: 'Projects & Operations',
    icon: ListTodo,
  },
  '/daily-reports': {
    title: 'Daily Site Reports',
    subtitle: 'Supervisor evening logs, weather tracking, work completed, and site photo records.',
    category: 'Projects & Operations',
    icon: ClipboardList,
  },

  // Procurement & Vendors
  '/suppliers': {
    title: 'Suppliers Directory',
    subtitle: 'Material vendor database, trades, purchase history, and outstanding payables.',
    category: 'Procurement & Vendors',
    icon: Truck,
  },
  '/materials': {
    title: 'Materials Reference Catalog',
    subtitle: 'Standard material master rates, procurement units, and trade specifications.',
    category: 'Procurement & Vendors',
    icon: Package,
  },
  '/purchases': {
    title: 'Material Purchases',
    subtitle: 'Procurement orders, vendor delivery invoices, and site material allocations.',
    category: 'Procurement & Vendors',
    icon: ShoppingCart,
  },
  '/supplier-payments': {
    title: 'Supplier Payments Ledger',
    subtitle: 'Material bill liquidations, payment reference vouchers, and vendor balances.',
    category: 'Procurement & Vendors',
    icon: ReceiptIndianRupee,
  },

  // Workforce & Labor
  '/employees': {
    title: 'Employees Directory',
    subtitle: 'Workforce roster, trade categories, daily wage rates, and contact details.',
    category: 'Workforce & Labor',
    icon: UserCheck,
  },
  '/attendance': {
    title: 'Fast Attendance Muster',
    subtitle: 'Daily site shift attendance, half days, absences, and man-day accruals in 15 seconds.',
    category: 'Workforce & Labor',
    icon: Clock4,
  },
  '/wages': {
    title: 'Wages Ledger',
    subtitle: 'Earned labor liabilities accrued from verified site attendance records.',
    category: 'Workforce & Labor',
    icon: Coins,
  },
  '/advances': {
    title: 'Employee Advances',
    subtitle: 'Worker cash loans issued, recoveries deducted, and outstanding loan assets.',
    category: 'Workforce & Labor',
    icon: HandCoins,
  },
  '/employee-payments': {
    title: 'Employee Payments',
    subtitle: 'Disbursed wage payouts and cash advance recovery deductions under Rule 18 standards.',
    category: 'Workforce & Labor',
    icon: Wallet,
  },

  // Finance & Treasury
  '/customer-payments': {
    title: 'Customer Payments',
    subtitle: 'Milestone collections, client receipt vouchers, and bank credit verifications.',
    category: 'Finance & Treasury',
    icon: CreditCard,
  },
  '/finance/supplier-payments': {
    title: 'Supplier Payment Disbursements',
    subtitle: 'Material invoice liquidations allocated across open purchase vouchers.',
    category: 'Finance & Treasury',
    icon: ReceiptIndianRupee,
  },
  '/finance/employee-payments': {
    title: 'Workforce Wage Disbursements',
    subtitle: 'Disbursed wage payouts with transparent cash advance loan deductions.',
    category: 'Finance & Treasury',
    icon: Wallet,
  },
  '/expenses': {
    title: 'Operational & Site Expenses',
    subtitle: 'Petty cash, site fuel, machinery hire, transport, and municipal fees.',
    category: 'Finance & Treasury',
    icon: Receipt,
  },
  '/financial-summary': {
    title: 'Financial Summary (Treasury Cockpit)',
    subtitle: 'Customer, Supplier, Employee, and Project financial health without speculative profit netting.',
    category: 'Finance & Treasury',
    icon: PieChart,
  },

  // Reports
  '/reports': {
    title: 'Executive Reports Directory',
    subtitle: 'Weekly briefings, project cost audits, procurement statements, and workforce analytics.',
    category: 'Reports & Audits',
    icon: FileSpreadsheet,
  },
  '/reports/weekly': {
    title: 'Weekly Management Report',
    subtitle: 'Weekly financial and operational pulse: cash collected, disbursements, and site progress.',
    category: 'Reports & Audits',
    icon: Calendar,
  },
  '/reports/project': {
    title: 'Project Cost Audit Report',
    subtitle: 'Itemized breakdown of recorded costs (Purchases + Labor + Expenses) vs contract value.',
    category: 'Reports & Audits',
    icon: BarChart3,
  },
  '/reports/purchase': {
    title: 'Purchases & Material Statement',
    subtitle: 'Consolidated material procurement ledger grouped by supplier, project, and trade.',
    category: 'Reports & Audits',
    icon: ShoppingBag,
  },
  '/reports/workforce': {
    title: 'Workforce & Muster Statement',
    subtitle: 'Total man-days, wage liability accruals, and advance balances across all active sites.',
    category: 'Reports & Audits',
    icon: Users2,
  },
  '/reports/payment': {
    title: 'Payment & Receipts Journal',
    subtitle: 'Audit trail of all incoming client collections and outgoing vendor/labor disbursements.',
    category: 'Reports & Audits',
    icon: FileSpreadsheet,
  },

  // Settings
  '/company-profile': {
    title: 'Company Profile & Letterhead Settings',
    subtitle: 'Legal business credentials, GSTIN/PAN, contact coordinates, and live print preview.',
    category: 'Settings & Administration',
    icon: Building,
  },
  '/users-roles': {
    title: 'Users & Roles Management',
    subtitle: 'Staff team accounts, access roles, invitations, and operational boundaries.',
    category: 'Settings & Administration',
    icon: ShieldCheck,
  },
  '/service-types': {
    title: 'Commercial Service Offerings',
    subtitle: 'Commercial service offerings catalog (Planning, 3D Elevation, Civil, Interior).',
    category: 'Settings & Administration',
    icon: Briefcase,
  },
};

export function PlaceholderPage() {
  const location = useLocation();
  const config = moduleConfigs[location.pathname] || {
    title: 'Module Overview',
    subtitle: 'Enterprise module interface for Shivarivel ERP.',
    category: 'Operations',
    icon: Building2,
  };

  const Icon = config.icon;

  return (
    <PageContainer>
      <PageHeader
        title={config.title}
        subtitle={config.subtitle}
        badge={
          <Badge variant="accent">
            {config.category}
          </Badge>
        }
      />

      <div className="py-8">
        <EmptyState
          icon={<Icon className="w-6 h-6 text-[#4A0E0E]" />}
          title={`${config.title} Module`}
          description="Frontend foundation and application shell are active. This business module will be connected to Supabase in the next implementation phase."
          actionLabel="Return to Dashboard"
          onAction={() => window.location.assign('/dashboard')}
        />
      </div>
    </PageContainer>
  );
}
