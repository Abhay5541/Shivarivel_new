import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { AppLayout } from '@/components/layout/AppLayout';

import { LoginPage } from '@/pages/auth/LoginPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { TodayPage } from '@/pages/today/TodayPage';
import { CustomersPage } from '@/pages/customers/CustomersPage';
import { CustomerDetailPage } from '@/pages/customers/CustomerDetailPage';
import { EnquiriesPage } from '@/pages/enquiries/EnquiriesPage';
import { SiteVisitsPage } from '@/pages/site-visits/SiteVisitsPage';
import { EstimatesPage } from '@/pages/estimates/EstimatesPage';
import { EstimateEditorPage } from '@/pages/estimates/EstimateEditorPage';
import { EstimateDetailPage } from '@/pages/estimates/EstimateDetailPage';
import { ProjectsPage } from '@/pages/projects/ProjectsPage';
import { ProjectEditorPage } from '@/pages/projects/ProjectEditorPage';
import { ProjectDetailPage } from '@/pages/projects/ProjectDetailPage';
import { SuppliersPage } from '@/pages/procurement/SuppliersPage';
import { SupplierEditorPage } from '@/pages/procurement/SupplierEditorPage';
import { SupplierDetailPage } from '@/pages/procurement/SupplierDetailPage';
import { MaterialsPage } from '@/pages/procurement/MaterialsPage';
import { PurchasesPage } from '@/pages/procurement/PurchasesPage';
import { PurchaseEditorPage } from '@/pages/procurement/PurchaseEditorPage';
import { PurchaseDetailPage } from '@/pages/procurement/PurchaseDetailPage';
import { SupplierPaymentsPage } from '@/pages/procurement/SupplierPaymentsPage';
import { SupplierPaymentEditorPage } from '@/pages/procurement/SupplierPaymentEditorPage';
import { EmployeesPage } from '@/pages/workforce/EmployeesPage';
import { EmployeeEditorPage } from '@/pages/workforce/EmployeeEditorPage';
import { EmployeeDetailPage } from '@/pages/workforce/EmployeeDetailPage';
import { AttendancePage } from '@/pages/workforce/AttendancePage';
import { WagesPage } from '@/pages/workforce/WagesPage';
import { AdvancesPage } from '@/pages/workforce/AdvancesPage';
import { AdvanceEditorPage } from '@/pages/workforce/AdvanceEditorPage';
import { EmployeePaymentsPage } from '@/pages/workforce/EmployeePaymentsPage';
import { EmployeePaymentEditorPage } from '@/pages/workforce/EmployeePaymentEditorPage';
import { CustomerPaymentsPage } from '@/pages/finance/CustomerPaymentsPage';
import { CustomerPaymentEditorPage } from '@/pages/finance/CustomerPaymentEditorPage';
import { CustomerPaymentDetailPage } from '@/pages/finance/CustomerPaymentDetailPage';
import { ExpensesPage } from '@/pages/finance/ExpensesPage';
import { ExpenseEditorPage } from '@/pages/finance/ExpenseEditorPage';
import { ExpenseDetailPage } from '@/pages/finance/ExpenseDetailPage';
import { FinancialSummaryPage } from '@/pages/finance/FinancialSummaryPage';
import { WeeklyReportPage } from '@/pages/reports/WeeklyReportPage';
import { ProjectReportPage } from '@/pages/reports/ProjectReportPage';
import { PurchaseReportPage } from '@/pages/reports/PurchaseReportPage';
import { WorkforceReportPage } from '@/pages/reports/WorkforceReportPage';
import { PaymentReportPage } from '@/pages/reports/PaymentReportPage';
import { SettingsOverviewPage } from '@/pages/settings/SettingsOverviewPage';
import { CompanyProfilePage } from '@/pages/settings/CompanyProfilePage';
import { UsersRolesPage } from '@/pages/settings/UsersRolesPage';
import { ServiceTypesPage } from '@/pages/settings/ServiceTypesPage';
import { PlaceholderPage } from '@/pages/PlaceholderPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
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
                <Route index element={<Navigate to="/dashboard" replace />} />

                {/* Main Command Center */}
                <Route path="/dashboard" element={<DashboardPage />} />

                {/* My Day Operations */}
                <Route path="/today" element={<TodayPage />} />
                <Route path="/my-day" element={<TodayPage />} />
                <Route path="/tasks" element={<PlaceholderPage />} />
                <Route path="/follow-ups" element={<PlaceholderPage />} />
                <Route path="/reminders" element={<PlaceholderPage />} />

                {/* Business & CRM (Phase 03) */}
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/customers/:id" element={<CustomerDetailPage />} />
                <Route path="/enquiries" element={<EnquiriesPage />} />
                <Route path="/site-visits" element={<SiteVisitsPage />} />
                {/* Estimates Module (Phase 04) */}
                <Route path="/estimates" element={<EstimatesPage />} />
                <Route path="/estimates/new" element={<EstimateEditorPage />} />
                <Route path="/estimates/:id" element={<EstimateDetailPage />} />
                <Route path="/estimates/:id/edit" element={<EstimateEditorPage />} />

                {/* Projects & Operations (Phase 05) */}
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/projects/new" element={<ProjectEditorPage />} />
                <Route path="/projects/:id" element={<ProjectDetailPage />} />
                <Route path="/projects/:id/edit" element={<ProjectEditorPage />} />
                <Route path="/work-progress" element={<PlaceholderPage />} />
                <Route path="/projects/progress" element={<PlaceholderPage />} />
                <Route path="/daily-reports" element={<PlaceholderPage />} />

                {/* Procurement & Suppliers */}
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
                <Route path="/settings/service-types" element={<ServiceTypesPage />} />
                <Route path="/service-types" element={<ServiceTypesPage />} />

                {/* Catch-all 404 Not Found */}
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
