# ClockWise Payroll System - Frontend

A complete React + TypeScript frontend for the ClockWise payroll management system with FLSA compliance, tip credit auto-determination, and California break law support.

## Features

### Super Admin Portal
- Login and authentication
- Business management (register, view, manage)
- System-wide dashboard with statistics
- Business listing and search

### Business Portal
- Login and authentication
- Employee management (register, view, update)
- Time tracking and entry management
- Payroll calculation with FLSA compliance
- Tip credit auto-determination
- Reports (sick leave, break compliance)
- Dashboard with business statistics

## Technology Stack

- **React 19.2.0** - UI framework
- **TypeScript 4.9.5** - Type safety
- **React Router v6** - Navigation and routing
- **Axios** - API communication
- **Tailwind CSS 3.4** - Styling
- **Lucide React** - Icons
- **date-fns** - Date manipulation

## API Configuration

The frontend connects to the backend API at:
```
http://15.204.220.159:8000
```

## Getting Started

### Installation

1. Navigate to the project directory:
```bash
cd /Users/mac/Desktop/clockwise_desktop
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The app will open at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` directory.

## Authentication

### Super Admin Login
- **Email**: admin@clockwise.com
- **Password**: A25bd1e23
- **Access**: Full system access, can manage all businesses

### Business Login
- **Email**: Your registered business email
- **Password**: Password set during business registration
- **Access**: Manage employees, time tracking, payroll, and reports

## Routing Structure

```
/ → Login selection
/super-admin/login → Super Admin Login
/super-admin/dashboard → Super Admin Dashboard
/super-admin/businesses → Business List
/super-admin/register-business → Register New Business

/business/login → Business Login
/business/dashboard → Business Dashboard
/business/employees → Employee List
/business/employees/register → Register Employee
/business/time-entry → Time Entry
/business/payroll → Payroll
/business/reports → Reports
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
- Deductions management
- Net pay calculation

### Reports
- **Sick Leave Report**: Track accrued and used sick leave
- **Break Compliance Report**: Monitor California break law compliance

## Project Structure

```
src/
├── config/api.ts                 # API endpoints
├── types/index.ts                # TypeScript types
├── services/                     # API services
├── contexts/AuthContext.tsx      # Authentication
├── components/                   # Reusable components
├── pages/                        # Page components
└── App.tsx                       # Main app with routing
```

## Styling

The app uses Tailwind CSS with custom colors:
- **Primary**: Blue-600
- **Success**: Green-600
- **Danger**: Red-600

## Responsive Design

Fully responsive across all devices:
- Desktop (1920px+)
- Laptop (1024px+)
- Tablet (768px+)
- Mobile (320px+)

## Version

1.0.0 - Initial Release
