# Smart Punch Payroll System - Frontend

A comprehensive React + TypeScript frontend for the Smart Punch payroll management system with FLSA compliance, tip credit auto-determination, California break law support, and bilingual interface (English/Spanish).

## Features

### Super Admin Portal
- Secure login and JWT authentication
- Business management (register, view, manage)
- System-wide dashboard with statistics
- Business listing and search functionality
- Complete business oversight and control

### Business Portal
- **Employee Management**
  - Employee registration with photo upload
  - Employee listing and profile management
  - SSN and phone validation
  - Tipped employee designation

- **Time Tracking & Attendance**
  - Clock in/out with timestamp tracking
  - Break start/end monitoring
  - Automatic hours calculation
  - Regular and overtime hours separation

- **Payroll Management**
  - FLSA compliance checking
  - Tip credit auto-determination
  - Pay rate configuration
  - Deductions management (standard and custom)
  - Net pay calculation with detailed breakdown
  - Printable payroll reports (PDF generation)

- **Tips Management**
  - Tip reporting system
  - Tip credit configuration
  - Tip credit calculator

- **Sick Leave Management**
  - Sick leave accrual tracking
  - Usage monitoring and reporting
  - California compliance

- **Incidents & Signatures**
  - Incident reporting and tracking
  - Digital signature capture
  - Document management

- **Reports & Analytics**
  - Sick leave reports
  - Break compliance reports
  - Payroll history
  - Custom date range filtering

- **Multi-language Support**
  - English/Spanish interface toggle
  - Persistent language preference

## Technology Stack

- **React 19.2.0** - UI framework
- **TypeScript 4.9.5** - Type safety
- **React Router DOM v7.9.5** - Navigation and routing
- **Axios 1.13.1** - API communication
- **Tailwind CSS 3.4.18** - Modern styling framework
- **Lucide React 0.552.0** - Icon library
- **date-fns 4.1.0** - Date manipulation and formatting
- **html2canvas 1.4.1** - Canvas-based screenshots
- **jsPDF 3.0.3** - PDF document generation
- **react-signature-canvas** - Digital signature capture

## API Configuration

The frontend connects to the backend API at:
```
http://15.204.220.159:8000
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager
- Git (for version control)



### Available Scripts

- `npm start` / `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm test` - Run test suite
- `npm run eject` - Eject from create-react-app (⚠️ irreversible)

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` directory ready for deployment.

## Authentication

### Super Admin Login
- **Email**: admin@smartpunch.com
- **Password**: A25bd1e23
- **Access**: Full system access, can manage all businesses

### Business Login
- **Email**: Your registered business email
- **Password**: Password set during business registration
- **Access**: Manage employees, time tracking, payroll, and reports

## Routing Structure

### Public Routes
```
/ → Home/Login selection
/login-selection → Login type selection
```

### Super Admin Routes
```
/super-admin/login → Super Admin Login
/super-admin/dashboard → Super Admin Dashboard
/super-admin/businesses → Business List
/super-admin/register-business → Register New Business
```

### Business Routes
```
/business/login → Business Login
/business/dashboard → Business Dashboard

# Employee Management
/business/employees → Employee List
/business/employees/register → Register Employee

# Time & Attendance
/business/time-entry → Time Entry

# Payroll
/business/payroll → Calculate Payroll
/business/payroll/print → Payroll Print View
/business/pay-rates → Pay Rates List
/business/pay-rates/create → Create Pay Rate

# Deductions
/business/deductions → Deductions List
/business/deductions/create → Create Deduction
/business/deductions/setup → Setup Standard Deductions

# Tips Management
/business/tips/report → Report Tips
/business/tip-credit → Tip Credit Config
/business/tip-credit/create → Create Tip Credit Config
/business/tip-credit/calculator → Tip Credit Calculator

# Sick Leave
/business/sick-leave → Sick Leave Management

# Incidents
/business/incidents → Incidents List
/business/incidents/create → Create Incident

# Reports & Documents
/business/reports → Reports Dashboard
/business/signatures → Digital Signatures
/business/pdf-generation → PDF Generation
```

## Key Features Details

### JWT Authentication
- Tokens stored in localStorage
- Automatic token injection in API requests
- Auto-redirect on token expiration
- Protected routes based on user type

### Employee Management
- Register with photo upload for facial recognition
- SSN format validation (###-##-####)
- Phone format validation (###-###-####)
- Tipped employee designation
- Hourly rate configuration

### Time Tracking
- Clock in/out timestamps
- Break start/end tracking
- Automatic hours calculation
- Regular and overtime hours separation

### Payroll Calculation
- FLSA compliance checking
- Tip credit auto-determination
- Regular and overtime pay calculation
- Multiple deduction types (federal, state, social security, Medicare, custom)
- Net pay calculation with detailed breakdown
- PDF generation for payroll records
- Printable payroll summaries

### Tips & Tip Credit
- Daily tip reporting per employee
- Tip credit configuration based on business needs
- Automatic tip credit calculation
- FLSA compliance for tipped employees
- Tip credit calculator tool

### Sick Leave Management
- Automatic accrual calculation
- Usage tracking and approval
- California sick leave compliance
- Detailed reporting per employee
- Balance management

### Incidents & Documentation
- Incident reporting system
- Digital signature capture for acknowledgments
- Document storage and management
- Employee incident history

### Reports & Analytics
- **Sick Leave Report**: Track accrued and used sick leave per employee
- **Break Compliance Report**: Monitor California break law compliance
- **Payroll History**: View past payroll calculations
- **Custom Date Ranges**: Filter reports by specific periods
- **PDF Export**: Generate printable reports

## Project Structure

```
src/
├── config/
│   └── api.ts                           # API endpoints configuration
│
├── types/
│   └── index.ts                         # TypeScript type definitions
│
├── contexts/
│   ├── AuthContext.tsx                  # Authentication context & JWT management
│   └── LanguageContext.tsx              # Multi-language support (EN/ES)
│
├── components/
│   ├── Common/
│   │   ├── LoadingSpinner.tsx          # Loading indicator
│   │   ├── Modal.tsx                    # Modal dialog component
│   │   └── Toast.tsx                    # Notification system
│   ├── Layout/
│   │   ├── Layout.tsx                   # Main layout wrapper
│   │   ├── Header.tsx                   # Navigation header
│   │   ├── Sidebar.tsx                  # Sidebar navigation
│   │   └── PublicHeader.tsx             # Public pages header
│   └── ProtectedRoute.tsx               # Route protection HOC
│
├── pages/
│   ├── Home.tsx                         # Landing page
│   ├── LoginSelection.tsx               # Login type selection
│   │
│   ├── SuperAdmin/
│   │   ├── Login.tsx                    # Super admin authentication
│   │   ├── Dashboard.tsx                # Super admin dashboard
│   │   ├── BusinessList.tsx             # Business management
│   │   └── RegisterBusiness.tsx         # Business registration
│   │
│   └── Business/
│       ├── Login.tsx                    # Business authentication
│       ├── Dashboard.tsx                # Business dashboard
│       │
│       ├── Employees/
│       │   ├── EmployeeList.tsx         # Employee directory
│       │   └── RegisterEmployee.tsx     # Employee registration
│       │
│       ├── TimeTracking/
│       │   └── TimeEntry.tsx            # Clock in/out system
│       │
│       ├── Payroll/
│       │   ├── CalculatePayroll.tsx     # Payroll calculation
│       │   └── PayrollPrintView.tsx     # Printable payroll
│       │
│       ├── PayRates/
│       │   ├── PayRatesList.tsx         # Pay rates management
│       │   └── CreatePayRate.tsx        # Create/edit pay rates
│       │
│       ├── Deductions/
│       │   ├── DeductionsList.tsx       # Deductions overview
│       │   ├── CreateDeduction.tsx      # Create custom deduction
│       │   └── SetupStandardDeductions.tsx  # Standard deductions
│       │
│       ├── Tips/
│       │   └── ReportTips.tsx           # Daily tip reporting
│       │
│       ├── TipCredit/
│       │   ├── TipCreditConfig.tsx      # Tip credit settings
│       │   ├── CreateTipCreditConfig.tsx # Configure tip credit
│       │   └── TipCreditCalculator.tsx  # Tip credit calculator
│       │
│       ├── SickLeave/
│       │   └── SickLeaveManagement.tsx  # Sick leave tracking
│       │
│       ├── Incidents/
│       │   ├── IncidentsList.tsx        # Incidents overview
│       │   └── CreateIncident.tsx       # Report incident
│       │
│       ├── Reports/
│       │   └── Reports.tsx              # Reports dashboard
│       │
│       ├── Signatures/
│       │   └── DigitalSignatures.tsx    # Digital signature capture
│       │
│       └── PDF/
│           └── PDFGeneration.tsx        # PDF document generation
│
├── App.tsx                              # Main app & routing configuration
├── index.tsx                            # Application entry point
└── setupTests.ts                        # Test configuration
```

## Styling

The app uses **Tailwind CSS 3.4.18** with a modern, professional design system:

### Color Palette
- **Primary**: Blue-600 (#2563eb) - Main actions and links
- **Success**: Green-600 (#16a34a) - Successful operations
- **Warning**: Yellow-500 (#eab308) - Warnings and alerts
- **Danger**: Red-600 (#dc2626) - Errors and destructive actions
- **Gray Scale**: Tailwind's default gray palette for UI elements

### Design Features
- Clean, modern interface with consistent spacing
- Card-based layout for content organization
- Smooth transitions and hover effects
- Accessible color contrasts (WCAG compliant)
- Professional form styling with validation states
- Consistent iconography using Lucide React

## Responsive Design

Fully responsive across all devices with mobile-first approach:
- **Desktop**: 1920px+ (Full feature set)
- **Laptop**: 1024px+ (Optimized layout)
- **Tablet**: 768px+ (Adaptive navigation)
- **Mobile**: 320px+ (Touch-optimized interface)

## Security Features

- JWT-based authentication with secure token storage
- Protected routes with automatic redirect
- Token expiration handling
- Input validation and sanitization
- XSS protection
- CSRF protection via API configuration
- Secure password handling (hashed backend-side)

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Modern mobile browsers (iOS Safari, Chrome Mobile)

## Development Guidelines

### Code Style
- TypeScript strict mode enabled
- Functional components with React Hooks
- Context API for state management
- Axios interceptors for API handling
- Consistent file naming (PascalCase for components)

### Best Practices
- Component modularity and reusability
- Type safety with TypeScript interfaces
- Error boundary implementation
- Loading states for async operations
- User feedback via Toast notifications

## Testing

The project includes testing setup with:
- **@testing-library/react** - Component testing
- **@testing-library/jest-dom** - DOM matchers
- **@testing-library/user-event** - User interaction simulation

Run tests with:
```bash
npm test
```

## License

This project is proprietary software developed for Smart Punch Payroll System.

## Version

**v0.1.0** - Current Development Version


**Built with ❤️ using React, TypeScript, and Tailwind CSS**
