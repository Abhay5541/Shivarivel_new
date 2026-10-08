import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageLoadingFallback } from '@/components/ui/PageLoadingFallback';
import { ScrollManager } from '@/components/layout/ScrollManager';

// 1. Authentication & Dashboard
const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })));

// 2. Module 1: Customers
const CustomersPage = lazy(() => import('@/pages/customers/CustomersPage').then(m => ({ default: m.CustomersPage })));
const CustomerDetailPage = lazy(() => import('@/pages/customers/CustomerDetailPage').then(m => ({ default: m.CustomerDetailPage })));

// 3. Module 2: Projects
const ProjectsPage = lazy(() => import('@/pages/projects/ProjectsPage').then(m => ({ default: m.ProjectsPage })));
const ProjectDetailPage = lazy(() => import('@/pages/projects/ProjectDetailPage').then(m => ({ default: m.ProjectDetailPage })));
const ProjectEditorPage = lazy(() => import('@/pages/projects/ProjectEditorPage').then(m => ({ default: m.ProjectEditorPage })));

// 4. Module 3: Wages, Attendance & Workforce
const EmployeesPage = lazy(() => import('@/pages/workforce/EmployeesPage').then(m => ({ default: m.EmployeesPage })));
const EmployeeEditorPage = lazy(() => import('@/pages/workforce/EmployeeEditorPage').then(m => ({ default: m.EmployeeEditorPage })));
const EmployeeDetailPage = lazy(() => import('@/pages/workforce/EmployeeDetailPage').then(m => ({ default: m.EmployeeDetailPage })));
const AttendancePage = lazy(() => import('@/pages/workforce/AttendancePage').then(m => ({ default: m.AttendancePage })));
const WagesPage = lazy(() => import('@/pages/workforce/WagesPage').then(m => ({ default: m.WagesPage })));
const AdvancesPage = lazy(() => import('@/pages/workforce/AdvancesPage').then(m => ({ default: m.AdvancesPage })));
const AdvanceEditorPage = lazy(() => import('@/pages/workforce/AdvanceEditorPage').then(m => ({ default: m.AdvanceEditorPage })));
const EmployeePaymentsPage = lazy(() => import('@/pages/workforce/EmployeePaymentsPage').then(m => ({ default: m.EmployeePaymentsPage })));
const EmployeePaymentEditorPage = lazy(() => import('@/pages/workforce/EmployeePaymentEditorPage').then(m => ({ default: m.EmployeePaymentEditorPage })));

// 5. Module 4: Procurement & Purchases
const SuppliersPage = lazy(() => import('@/pages/procurement/SuppliersPage').then(m => ({ default: m.SuppliersPage })));
const SupplierEditorPage = lazy(() => import('@/pages/procurement/SupplierEditorPage').then(m => ({ default: m.SupplierEditorPage })));
const SupplierDetailPage = lazy(() => import('@/pages/procurement/SupplierDetailPage').then(m => ({ default: m.SupplierDetailPage })));
const MaterialsPage = lazy(() => import('@/pages/procurement/MaterialsPage').then(m => ({ default: m.MaterialsPage })));
const PurchasesPage = lazy(() => import('@/pages/procurement/PurchasesPage').then(m => ({ default: m.PurchasesPage })));
const PurchaseEditorPage = lazy(() => import('@/pages/procurement/PurchaseEditorPage').then(m => ({ default: m.PurchaseEditorPage })));
const PurchaseDetailPage = lazy(() => import('@/pages/procurement/PurchaseDetailPage').then(m => ({ default: m.PurchaseDetailPage })));
const SupplierPaymentsPage = lazy(() => import('@/pages/procurement/SupplierPaymentsPage').then(m => ({ default: m.SupplierPaymentsPage })));
const SupplierPaymentEditorPage = lazy(() => import('@/pages/procurement/SupplierPaymentEditorPage').then(m => ({ default: m.SupplierPaymentEditorPage })));

// 6. Settings & Administration
const SettingsOverviewPage = lazy(() => import('@/pages/settings/SettingsOverviewPage').then(m => ({ default: m.SettingsOverviewPage })));
const CompanyProfilePage = lazy(() => import('@/pages/settings/CompanyProfilePage').then(m => ({ default: m.CompanyProfilePage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
    },
  },
});

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <ScrollManager />
            <Suspense fallback={<PageLoadingFallback />}>
              <Routes>
                {/* Public Authentication */}
                <Route path="/login" element={<LoginPage />} />

                {/* Protected Application Shell */}
                <Route
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  {/* Default Landing: Dashboard */}
                  <Route index element={<Navigate to="/dashboard" replace />} />

                  {/* EXECUTIVE DASHBOARD */}
                  <Route path="/dashboard" element={<DashboardPage />} />

                  {/* 1. CUSTOMERS MODULE */}
                  <Route path="/customers" element={<CustomersPage />} />
                  <Route path="/customers/:id" element={<CustomerDetailPage />} />

                  {/* 2. PROJECTS MODULE */}
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/projects/new" element={<ProjectEditorPage />} />
                  <Route path="/projects/:id" element={<ProjectDetailPage />} />
                  <Route path="/projects/:id/edit" element={<ProjectEditorPage />} />

                  {/* 3. WAGES, ATTENDANCE & WORKFORCE MODULE */}
                  <Route path="/wages" element={<WagesPage />} />
                  <Route path="/daily-wages" element={<Navigate to="/wages" replace />} />
                  <Route path="/attendance" element={<AttendancePage />} />
                  <Route path="/employees" element={<EmployeesPage />} />
                  <Route path="/employees/new" element={<EmployeeEditorPage />} />
                  <Route path="/employees/:id" element={<EmployeeDetailPage />} />
                  <Route path="/employees/:id/edit" element={<EmployeeEditorPage />} />
                  <Route path="/advances" element={<AdvancesPage />} />
                  <Route path="/advances/new" element={<AdvanceEditorPage />} />
                  <Route path="/employee-payments" element={<EmployeePaymentsPage />} />
                  <Route path="/employee-payments/new" element={<EmployeePaymentEditorPage />} />

                  {/* 4. PROCUREMENT & PURCHASES MODULE */}
                  <Route path="/procurement" element={<PurchasesPage />} />
                  <Route path="/purchases" element={<PurchasesPage />} />
                  <Route path="/purchases/new" element={<PurchaseEditorPage />} />
                  <Route path="/purchases/:id" element={<PurchaseDetailPage />} />
                  <Route path="/purchases/:id/edit" element={<PurchaseEditorPage />} />
                  <Route path="/suppliers" element={<SuppliersPage />} />
                  <Route path="/suppliers/new" element={<SupplierEditorPage />} />
                  <Route path="/suppliers/:id" element={<SupplierDetailPage />} />
                  <Route path="/suppliers/:id/edit" element={<SupplierEditorPage />} />
                  <Route path="/materials" element={<MaterialsPage />} />
                  <Route path="/supplier-payments" element={<SupplierPaymentsPage />} />
                  <Route path="/supplier-payments/new" element={<SupplierPaymentEditorPage />} />

                  {/* 5. SETTINGS */}
                  <Route path="/settings" element={<SettingsOverviewPage />} />
                  <Route path="/settings/company" element={<CompanyProfilePage />} />
                  <Route path="/company-profile" element={<CompanyProfilePage />} />
                  <Route path="/settings/users" element={<Navigate to="/settings" replace />} />
                  <Route path="/users-roles" element={<Navigate to="/settings" replace />} />

                  {/* All other URLs redirect to /customers */}
                  <Route path="*" element={<Navigate to="/customers" replace />} />
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
