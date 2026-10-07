import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageLoadingFallback } from '@/components/ui/PageLoadingFallback';

// Route-based code splitting for production performance
const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })));
const TodayPage = lazy(() => import('@/pages/today/TodayPage').then(m => ({ default: m.TodayPage })));
const CustomersPage = lazy(() => import('@/pages/customers/CustomersPage').then(m => ({ default: m.CustomersPage })));
const CustomerDetailPage = lazy(() => import('@/pages/customers/CustomerDetailPage').then(m => ({ default: m.CustomerDetailPage })));
const EnquiriesPage = lazy(() => import('@/pages/enquiries/EnquiriesPage').then(m => ({ default: m.EnquiriesPage })));
const SiteVisitsPage = lazy(() => import('@/pages/site-visits/SiteVisitsPage').then(m => ({ default: m.SiteVisitsPage })));
const EstimatesPage = lazy(() => import('@/pages/estimates/EstimatesPage').then(m => ({ default: m.EstimatesPage })));
const EstimateEditorPage = lazy(() => import('@/pages/estimates/EstimateEditorPage').then(m => ({ default: m.EstimateEditorPage })));
const EstimateDetailPage = lazy(() => import('@/pages/estimates/EstimateDetailPage').then(m => ({ default: m.EstimateDetailPage })));
const SitesPage = lazy(() => import('@/pages/projects/SitesPage').then(m => ({ default: m.SitesPage })));
const SiteDetailPage = lazy(() => import('@/pages/projects/SiteDetailPage').then(m => ({ default: m.SiteDetailPage })));
const ProjectEditorPage = lazy(() => import('@/pages/projects/ProjectEditorPage').then(m => ({ default: m.ProjectEditorPage })));
const SuppliersPage = lazy(() => import('@/pages/procurement/SuppliersPage').then(m => ({ default: m.SuppliersPage })));
const SupplierEditorPage = lazy(() => import('@/pages/procurement/SupplierEditorPage').then(m => ({ default: m.SupplierEditorPage })));
const SupplierDetailPage = lazy(() => import('@/pages/procurement/SupplierDetailPage').then(m => ({ default: m.SupplierDetailPage })));
const MaterialsPage = lazy(() => import('@/pages/procurement/MaterialsPage').then(m => ({ default: m.MaterialsPage })));
const PurchasesPage = lazy(() => import('@/pages/procurement/PurchasesPage').then(m => ({ default: m.PurchasesPage })));
const PurchaseEditorPage = lazy(() => import('@/pages/procurement/PurchaseEditorPage').then(m => ({ default: m.PurchaseEditorPage })));
const PurchaseDetailPage = lazy(() => import('@/pages/procurement/PurchaseDetailPage').then(m => ({ default: m.PurchaseDetailPage })));
const SupplierPaymentsPage = lazy(() => import('@/pages/procurement/SupplierPaymentsPage').then(m => ({ default: m.SupplierPaymentsPage })));
const SupplierPaymentEditorPage = lazy(() => import('@/pages/procurement/SupplierPaymentEditorPage').then(m => ({ default: m.SupplierPaymentEditorPage })));
const EmployeesPage = lazy(() => import('@/pages/workforce/EmployeesPage').then(m => ({ default: m.EmployeesPage })));
const EmployeeEditorPage = lazy(() => import('@/pages/workforce/EmployeeEditorPage').then(m => ({ default: m.EmployeeEditorPage })));
const EmployeeDetailPage = lazy(() => import('@/pages/workforce/EmployeeDetailPage').then(m => ({ default: m.EmployeeDetailPage })));
const AttendancePage = lazy(() => import('@/pages/workforce/AttendancePage').then(m => ({ default: m.AttendancePage })));
const WagesPage = lazy(() => import('@/pages/workforce/WagesPage').then(m => ({ default: m.WagesPage })));
const AdvancesPage = lazy(() => import('@/pages/workforce/AdvancesPage').then(m => ({ default: m.AdvancesPage })));
const AdvanceEditorPage = lazy(() => import('@/pages/workforce/AdvanceEditorPage').then(m => ({ default: m.AdvanceEditorPage })));
const EmployeePaymentsPage = lazy(() => import('@/pages/workforce/EmployeePaymentsPage').then(m => ({ default: m.EmployeePaymentsPage })));
const EmployeePaymentEditorPage = lazy(() => import('@/pages/workforce/EmployeePaymentEditorPage').then(m => ({ default: m.EmployeePaymentEditorPage })));
const CustomerPaymentsPage = lazy(() => import('@/pages/finance/CustomerPaymentsPage').then(m => ({ default: m.CustomerPaymentsPage })));
const CustomerPaymentEditorPage = lazy(() => import('@/pages/finance/CustomerPaymentEditorPage').then(m => ({ default: m.CustomerPaymentEditorPage })));
const CustomerPaymentDetailPage = lazy(() => import('@/pages/finance/CustomerPaymentDetailPage').then(m => ({ default: m.CustomerPaymentDetailPage })));
const ExpensesPage = lazy(() => import('@/pages/finance/ExpensesPage').then(m => ({ default: m.ExpensesPage })));
const ExpenseEditorPage = lazy(() => import('@/pages/finance/ExpenseEditorPage').then(m => ({ default: m.ExpenseEditorPage })));
const ExpenseDetailPage = lazy(() => import('@/pages/finance/ExpenseDetailPage').then(m => ({ default: m.ExpenseDetailPage })));
const FinancialSummaryPage = lazy(() => import('@/pages/finance/FinancialSummaryPage').then(m => ({ default: m.FinancialSummaryPage })));
const WeeklyReportPage = lazy(() => import('@/pages/reports/WeeklyReportPage').then(m => ({ default: m.WeeklyReportPage })));
const ProjectReportPage = lazy(() => import('@/pages/reports/ProjectReportPage').then(m => ({ default: m.ProjectReportPage })));
const PurchaseReportPage = lazy(() => import('@/pages/reports/PurchaseReportPage').then(m => ({ default: m.PurchaseReportPage })));
const WorkforceReportPage = lazy(() => import('@/pages/reports/WorkforceReportPage').then(m => ({ default: m.WorkforceReportPage })));
const PaymentReportPage = lazy(() => import('@/pages/reports/PaymentReportPage').then(m => ({ default: m.PaymentReportPage })));
const SettingsOverviewPage = lazy(() => import('@/pages/settings/SettingsOverviewPage').then(m => ({ default: m.SettingsOverviewPage })));
const CompanyProfilePage = lazy(() => import('@/pages/settings/CompanyProfilePage').then(m => ({ default: m.CompanyProfilePage })));
const UsersRolesPage = lazy(() => import('@/pages/settings/UsersRolesPage').then(m => ({ default: m.UsersRolesPage })));
const PlaceholderPage = lazy(() => import('@/pages/PlaceholderPage').then(m => ({ default: m.PlaceholderPage })));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

import { ScrollManager } from '@/components/layout/ScrollManager';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes: Keeps data warm in memory for instant Back/Forward navigation
      gcTime: 1000 * 60 * 30, // 30 minutes garbage collection
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <ScrollManager />
            <Suspense fallback={<PageLoadingFallback />}>
              <Routes>
                {/* Public Authentication Route */}
                <Route path="/login" element={<LoginPage />} />

                {/* Protected Application Routes with Global Shell */}
                <Route
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  {/* Default Index Redirect */}
                  <Route index element={<Navigate to="/customers" replace />} />

                  {/* Simplified Client Modules (Phase 02: Customers & Sites) */}
                  <Route path="/customers" element={<CustomersPage />} />
                  <Route path="/customers/:id" element={<CustomerDetailPage />} />
                  <Route path="/sites" element={<SitesPage />} />
                  <Route path="/sites/:id" element={<SiteDetailPage />} />

                  {/* Main Command Center */}
                  <Route path="/dashboard" element={<DashboardPage />} />

                  {/* My Day Operations */}
                  <Route path="/today" element={<TodayPage />} />
                  <Route path="/my-day" element={<TodayPage />} />
                  <Route path="/tasks" element={<PlaceholderPage />} />
                  <Route path="/follow-ups" element={<PlaceholderPage />} />
                  <Route path="/reminders" element={<PlaceholderPage />} />

                  {/* Business & CRM (Phase 03) */}
                  <Route path="/enquiries" element={<EnquiriesPage />} />
                  <Route path="/site-visits" element={<SiteVisitsPage />} />
                  {/* Estimates Module (Phase 04) */}
                  <Route path="/estimates" element={<EstimatesPage />} />
                  <Route path="/estimates/new" element={<EstimateEditorPage />} />
                  <Route path="/estimates/:id" element={<EstimateDetailPage />} />
                  <Route path="/estimates/:id/edit" element={<EstimateEditorPage />} />

                  {/* Projects & Operations (Phase 05) */}
                  <Route path="/projects" element={<SitesPage />} />
                  <Route path="/projects/new" element={<ProjectEditorPage />} />
                  <Route path="/projects/:id" element={<SiteDetailPage />} />
                  <Route path="/projects/:id/edit" element={<ProjectEditorPage />} />
                  <Route path="/work-progress" element={<PlaceholderPage />} />
                  <Route path="/projects/progress" element={<PlaceholderPage />} />
                  <Route path="/daily-reports" element={<PlaceholderPage />} />

                  {/* Procurement & Suppliers */}
                  <Route path="/procurement" element={<PurchasesPage />} />
                  <Route path="/suppliers" element={<SuppliersPage />} />
                  <Route path="/suppliers/new" element={<SupplierEditorPage />} />
                  <Route path="/suppliers/:id" element={<SupplierDetailPage />} />
                  <Route path="/suppliers/:id/edit" element={<SupplierEditorPage />} />
                  <Route path="/materials" element={<MaterialsPage />} />
                  <Route path="/purchases" element={<PurchasesPage />} />
                  <Route path="/purchases/new" element={<PurchaseEditorPage />} />
                  <Route path="/purchases/:id" element={<PurchaseDetailPage />} />
                  <Route path="/purchases/:id/edit" element={<PurchaseEditorPage />} />
                  <Route path="/supplier-payments" element={<SupplierPaymentsPage />} />
                  <Route path="/supplier-payments/new" element={<SupplierPaymentEditorPage />} />

                  {/* Workforce & Labor (Phase 07) */}
                  <Route path="/employees" element={<EmployeesPage />} />
                  <Route path="/employees/new" element={<EmployeeEditorPage />} />
                  <Route path="/employees/:id" element={<EmployeeDetailPage />} />
                  <Route path="/employees/:id/edit" element={<EmployeeEditorPage />} />
                  <Route path="/attendance" element={<AttendancePage />} />
                  <Route path="/wages" element={<WagesPage />} />
                  <Route path="/daily-wages" element={<Navigate to="/wages" replace />} />
                  <Route path="/advances" element={<AdvancesPage />} />
                  <Route path="/advances/new" element={<AdvanceEditorPage />} />
                  <Route path="/employee-payments" element={<EmployeePaymentsPage />} />
                  <Route path="/employee-payments/new" element={<EmployeePaymentEditorPage />} />

                  {/* Finance & Treasury (Strict Rule 18 Non-Netting) */}
                  <Route path="/customer-payments" element={<CustomerPaymentsPage />} />
                  <Route path="/customer-payments/new" element={<CustomerPaymentEditorPage />} />
                  <Route path="/customer-payments/:id" element={<CustomerPaymentDetailPage />} />
                  <Route path="/finance/supplier-payments" element={<SupplierPaymentsPage />} />
                  <Route path="/finance/employee-payments" element={<EmployeePaymentsPage />} />
                  <Route path="/expenses" element={<ExpensesPage />} />
                  <Route path="/expenses/new" element={<ExpenseEditorPage />} />
                  <Route path="/expenses/:id" element={<ExpenseDetailPage />} />
                  <Route path="/financial-summary" element={<FinancialSummaryPage />} />
                  <Route path="/finance" element={<FinancialSummaryPage />} />

                  {/* Reports & Operational Audits (Phase 09) */}
                  <Route path="/reports" element={<Navigate to="/reports/weekly" replace />} />
                  <Route path="/reports/weekly" element={<WeeklyReportPage />} />
                  <Route path="/reports/project" element={<ProjectReportPage />} />
                  <Route path="/reports/purchases" element={<PurchaseReportPage />} />
                  <Route path="/reports/purchase" element={<PurchaseReportPage />} />
                  <Route path="/reports/workforce" element={<WorkforceReportPage />} />
                  <Route path="/reports/payments" element={<PaymentReportPage />} />
                  <Route path="/reports/payment" element={<PaymentReportPage />} />

                  {/* Settings & Administration (Phase 10) */}
                  <Route path="/settings" element={<SettingsOverviewPage />} />
                  <Route path="/settings/company" element={<CompanyProfilePage />} />
                  <Route path="/company-profile" element={<CompanyProfilePage />} />
                  <Route path="/settings/users" element={<UsersRolesPage />} />
                  <Route path="/users-roles" element={<UsersRolesPage />} />
                  <Route path="/settings/service-types" element={<Navigate to="/settings" replace />} />
                  <Route path="/service-types" element={<Navigate to="/settings" replace />} />

                  {/* Catch-all 404 Not Found */}
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
