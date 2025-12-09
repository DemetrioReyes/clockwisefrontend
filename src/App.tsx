import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ToastProvider } from './components/Common/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import PublicHeader from './components/Layout/PublicHeader';
import LoadingSpinner from './components/Common/LoadingSpinner';

// ✨ Lazy Loading: Solo cargan cuando se necesitan
// Public Pages (cargar inmediatamente)
import Home from './pages/Home';

// Super Admin Pages (lazy)
const SuperAdminLogin = lazy(() => import('./pages/SuperAdmin/Login'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdmin/Dashboard'));
const RegisterBusiness = lazy(() => import('./pages/SuperAdmin/RegisterBusiness'));
const BusinessList = lazy(() => import('./pages/SuperAdmin/BusinessList'));
const TipCreditManagement = lazy(() => import('./pages/SuperAdmin/TipCreditManagement'));

// Business Pages (lazy)
const BusinessLogin = lazy(() => import('./pages/Business/Login'));
const BusinessDashboard = lazy(() => import('./pages/Business/Dashboard'));
const EmployeeList = lazy(() => import('./pages/Business/Employees/EmployeeList'));
const RegisterEmployee = lazy(() => import('./pages/Business/Employees/RegisterEmployee'));
const TimeEntry = lazy(() => import('./pages/Business/TimeTracking/TimeEntry'));
const CalculatePayroll = lazy(() => import('./pages/Business/Payroll/CalculatePayroll'));
const PayrollPrintView = lazy(() => import('./pages/Business/Payroll/PayrollPrintView'));
const Reports = lazy(() => import('./pages/Business/Reports/Reports'));
const ReportTips = lazy(() => import('./pages/Business/Tips/ReportTips'));

// Deductions & Incidents (lazy)
const DeductionsList = lazy(() => import('./pages/Business/Deductions/DeductionsList'));
const CreateDeduction = lazy(() => import('./pages/Business/Deductions/CreateDeduction'));
const SetupStandardDeductions = lazy(() => import('./pages/Business/Deductions/SetupStandardDeductions'));
const CreateIncident = lazy(() => import('./pages/Business/Incidents/CreateIncident'));

// PDF (lazy)
const PDFGeneration = lazy(() => import('./pages/Business/PDF/PDFGeneration'));

// Pay Rates & Sick Leave (lazy)
const PayRatesList = lazy(() => import('./pages/Business/PayRates/PayRatesList'));
const CreatePayRate = lazy(() => import('./pages/Business/PayRates/CreatePayRate'));
const SickLeaveManagement = lazy(() => import('./pages/Business/SickLeave/SickLeaveManagement'));
const TipCreditConfig = lazy(() => import('./pages/Business/TipCredit/TipCreditConfig'));
const CreateTipCreditConfig = lazy(() => import('./pages/Business/TipCredit/CreateTipCreditConfig'));
const TipCreditCalculator = lazy(() => import('./pages/Business/TipCredit/TipCreditCalculator'));
const MealBenefitConfig = lazy(() => import('./pages/Business/MealBenefit/MealBenefitConfig'));
const CreateMealBenefitConfig = lazy(() => import('./pages/Business/MealBenefit/CreateMealBenefitConfig'));

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <ToastProvider>
            <PublicHeader />
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/super-admin/login" element={<SuperAdminLogin />} />
                <Route path="/business/login" element={<BusinessLogin />} />

            {/* Super Admin Protected Routes */}
            <Route
              path="/super-admin/dashboard"
              element={
                <ProtectedRoute requiredUserType="super_admin">
                  <SuperAdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/super-admin/businesses"
              element={
                <ProtectedRoute requiredUserType="super_admin">
                  <BusinessList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/super-admin/register-business"
              element={
                <ProtectedRoute requiredUserType="super_admin">
                  <RegisterBusiness />
                </ProtectedRoute>
              }
            />
            <Route
              path="/super-admin/tip-credit"
              element={
                <ProtectedRoute requiredUserType="super_admin">
                  <TipCreditManagement />
                </ProtectedRoute>
              }
            />

            {/* Business Protected Routes */}
            <Route
              path="/business/dashboard"
              element={
                <ProtectedRoute requiredUserType="business">
                  <BusinessDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/employees"
              element={
                <ProtectedRoute requiredUserType="business">
                  <EmployeeList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/employees/register"
              element={
                <ProtectedRoute requiredUserType="business">
                  <RegisterEmployee />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/time-entry"
              element={
                <ProtectedRoute requiredUserType="business">
                  <TimeEntry />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/payroll"
              element={
                <ProtectedRoute requiredUserType="business">
                  <CalculatePayroll />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/payroll/print/:payrollId"
              element={
                <ProtectedRoute requiredUserType="business">
                  <PayrollPrintView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/reports"
              element={
                <ProtectedRoute requiredUserType="business">
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/tips"
              element={
                <ProtectedRoute requiredUserType="business">
                  <ReportTips />
                </ProtectedRoute>
              }
            />

            {/* Deductions Routes */}
            <Route
              path="/business/deductions"
              element={
                <ProtectedRoute requiredUserType="business">
                  <DeductionsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/deductions/create"
              element={
                <ProtectedRoute requiredUserType="business">
                  <CreateDeduction />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/deductions/setup-standard"
              element={
                <ProtectedRoute requiredUserType="business">
                  <SetupStandardDeductions />
                </ProtectedRoute>
              }
            />

            {/* Incidents Routes (combinado con Tips) */}
            <Route
              path="/business/incidents"
              element={
                <ProtectedRoute requiredUserType="business">
                  <ReportTips />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/incidents/create"
              element={
                <ProtectedRoute requiredUserType="business">
                  <CreateIncident />
                </ProtectedRoute>
              }
            />

            {/* PDF Routes */}
            <Route
              path="/business/pdf-generation"
              element={
                <ProtectedRoute requiredUserType="business">
                  <PDFGeneration />
                </ProtectedRoute>
              }
            />

            {/* Pay Rates Routes */}
            <Route
              path="/business/pay-rates"
              element={
                <ProtectedRoute requiredUserType="business">
                  <PayRatesList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/pay-rates/create"
              element={
                <ProtectedRoute requiredUserType="business">
                  <CreatePayRate />
                </ProtectedRoute>
              }
            />

            {/* Sick Leave Routes */}
            <Route
              path="/business/sick-leave"
              element={
                <ProtectedRoute requiredUserType="business">
                  <SickLeaveManagement />
                </ProtectedRoute>
              }
            />

            {/* Tip Credit Configuration Routes */}
            <Route
              path="/business/tip-credit"
              element={
                <ProtectedRoute requiredUserType="business">
                  <TipCreditConfig />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/tip-credit/create"
              element={
                <ProtectedRoute requiredUserType="business">
                  <CreateTipCreditConfig />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/tip-credit/calculator"
              element={
                <ProtectedRoute requiredUserType="business">
                  <TipCreditCalculator />
                </ProtectedRoute>
              }
            />

            {/* Meal Benefit Configuration Routes */}
            <Route
              path="/business/meal-benefit"
              element={
                <ProtectedRoute requiredUserType="business">
                  <MealBenefitConfig />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/meal-benefit/create"
              element={
                <ProtectedRoute requiredUserType="business">
                  <CreateMealBenefitConfig />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/meal-benefit/edit/:id"
              element={
                <ProtectedRoute requiredUserType="business">
                  <CreateMealBenefitConfig />
                </ProtectedRoute>
              }
            />

                {/* Catch all - redirect to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </ToastProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;
