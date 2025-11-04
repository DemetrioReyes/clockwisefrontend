import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/Common/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import PublicHeader from './components/Layout/PublicHeader';

// Pages
import Home from './pages/Home';
import LoginSelection from './pages/LoginSelection';

// Super Admin Pages
import SuperAdminLogin from './pages/SuperAdmin/Login';
import SuperAdminDashboard from './pages/SuperAdmin/Dashboard';
import RegisterBusiness from './pages/SuperAdmin/RegisterBusiness';
import BusinessList from './pages/SuperAdmin/BusinessList';

// Business Pages
import BusinessLogin from './pages/Business/Login';
import BusinessDashboard from './pages/Business/Dashboard';
import EmployeeList from './pages/Business/Employees/EmployeeList';
import RegisterEmployee from './pages/Business/Employees/RegisterEmployee';
import TimeEntry from './pages/Business/TimeTracking/TimeEntry';
import CalculatePayroll from './pages/Business/Payroll/CalculatePayroll';
import PayrollPrintView from './pages/Business/Payroll/PayrollPrintView';
import Reports from './pages/Business/Reports/Reports';
import ReportTips from './pages/Business/Tips/ReportTips';

// Deductions & Incidents
import DeductionsList from './pages/Business/Deductions/DeductionsList';
import CreateDeduction from './pages/Business/Deductions/CreateDeduction';
import SetupStandardDeductions from './pages/Business/Deductions/SetupStandardDeductions';
import IncidentsList from './pages/Business/Incidents/IncidentsList';
import CreateIncident from './pages/Business/Incidents/CreateIncident';

// PDF & Signatures
import PDFGeneration from './pages/Business/PDF/PDFGeneration';
import DigitalSignatures from './pages/Business/Signatures/DigitalSignatures';

// Pay Rates & Sick Leave
import PayRatesList from './pages/Business/PayRates/PayRatesList';
import CreatePayRate from './pages/Business/PayRates/CreatePayRate';
import SickLeaveManagement from './pages/Business/SickLeave/SickLeaveManagement';
import TipCreditConfig from './pages/Business/TipCredit/TipCreditConfig';
import CreateTipCreditConfig from './pages/Business/TipCredit/CreateTipCreditConfig';
import TipCreditCalculator from './pages/Business/TipCredit/TipCreditCalculator';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <PublicHeader />
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

            {/* PDF & Signatures Routes */}
            <Route
              path="/business/pdf-generation"
              element={
                <ProtectedRoute requiredUserType="business">
                  <PDFGeneration />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/signatures"
              element={
                <ProtectedRoute requiredUserType="business">
                  <DigitalSignatures />
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

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
