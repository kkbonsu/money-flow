# FinanceFlow - Financial Management System

## Overview

FinanceFlow is a comprehensive financial management system built with a modern full-stack architecture. It's designed to handle loan management, customer relations, payment schedules, staff management, and various financial operations including income/expense tracking, asset management, and reporting.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with CSS variables for theming
- **UI Components**: Radix UI primitives with custom shadcn/ui components
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ESM modules)
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **API Design**: RESTful API with structured error handling

### Key Components

#### Database Layer
- **ORM**: Drizzle ORM with TypeScript schema definitions
- **Schema Location**: `shared/schema.ts` - centralized schema shared between client and server
- **Migrations**: Auto-generated migrations in `./migrations` directory
- **Connection**: Connection pooling with Neon serverless adapter

#### Authentication System
- JWT token-based authentication
- Session storage in localStorage
- Route protection middleware
- Role-based access control ready

#### Core Business Entities
- **Users**: Authentication and role management
- **Customers**: Customer database with credit scoring
- **Loan Books**: Loan applications, approvals, and tracking
- **Payment Schedules**: Payment tracking and status management
- **Staff**: Employee management system
- **Financial Management**: Income, expenses, bank accounts, petty cash
- **Asset Management**: Inventory, rent, assets, liabilities, equity
- **Reporting**: Financial reports and analytics

## Data Flow

1. **Client-Server Communication**: RESTful API endpoints with JSON payloads
2. **Database Operations**: Drizzle ORM handles all database interactions
3. **State Management**: TanStack Query manages server state with caching
4. **Form Handling**: React Hook Form with Zod validation schemas
5. **Authentication Flow**: JWT tokens stored in localStorage, validated on each request

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Neon PostgreSQL serverless driver
- **drizzle-orm**: Modern TypeScript ORM
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Unstyled, accessible UI primitives
- **react-hook-form**: Form state management
- **zod**: Runtime type validation
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT token handling

### Development Dependencies
- **tsx**: TypeScript execution for development
- **esbuild**: Fast bundling for production
- **vite**: Development server and build tool
- **tailwindcss**: Utility-first CSS framework

## Deployment Strategy

### Build Process
1. **Development**: `npm run dev` - runs server with tsx and Vite dev server
2. **Production Build**: `npm run build` - creates optimized client bundle and server bundle
3. **Production Start**: `npm start` - runs bundled server with static file serving

### Environment Requirements
- **DATABASE_URL**: PostgreSQL connection string (Neon serverless)
- **JWT_SECRET**: Secret key for JWT token signing
- **NODE_ENV**: Environment mode (development/production)

### File Structure
- `client/`: React frontend application
- `server/`: Express.js backend application
- `shared/`: Shared TypeScript definitions and schemas
- `dist/`: Production build output
- `migrations/`: Database migration files

### Database Management
- **Schema Push**: `npm run db:push` - pushes schema changes to database
- **Type Safety**: Fully typed database operations with Drizzle
- **Shared Types**: Database types generated and shared between client/server
- **Numeric Field Handling**: Custom Zod schemas handle automatic conversion of form numbers to database-compatible strings for decimal fields

### Recent Changes (January 2025)
- Fixed critical validation issue where forms expected numbers but database required strings for decimal/monetary fields
- Implemented Zod union types with transforms to handle both string and number inputs for all monetary fields
- Updated all insert schemas (Staff, Income, Expense, Bank, PettyCash, Inventory, Loans) to automatically convert numeric inputs to strings
- Ensured seamless user experience with numeric form inputs while maintaining database compatibility
- Completed comprehensive server route implementation for all entities with full CRUD operations
- Added missing PUT and DELETE routes for all entities: Loans, Payment Schedules, Income, Expenses, Bank Accounts, Petty Cash, Inventory, Rent Management, Assets, Liabilities, Equity, and Reports
- Fixed staff editing functionality by implementing missing server routes and form fields (phone, hireDate)
- All entities now have complete Create, Read, Update, Delete functionality with proper authentication and validation
- **Payment Schedule System Implementation (July 10, 2025)**
  - Implemented automatic payment schedule creation when loans are added using amortization formula
  - Enhanced payment schedule table to show one row per loan with summary information (customer, next due date, loan amount, total principal/interest)
  - Created comprehensive ViewPaymentModal showing complete payment breakdown with progress tracking
  - Added date validation fixes for loan forms with proper transformation handling
  - Payment schedules now automatically calculate monthly payments and create complete amortization schedules
  - Restructured payment schedule table to display loan summaries instead of individual payments
  - Removed Schedule Payment button as requested by user
  - Payment table now shows: customer name, loan ID, next due date, loan amount, total principal, total interest, and overall status
  - Individual payment details are accessible through the View button which opens detailed modal
  - **Mark as Paid Functionality Implementation (July 11, 2025)**
    - Added Mark as Paid button to Current Payment Information card in ViewPaymentModal
    - Button automatically switches to next unpaid payment when current payment is marked as paid
    - Payment progress bar updates in real-time showing percentage paid and remaining balance
    - Buttons change state: "Mark as Paid" → "Paid" (disabled) after successful payment
    - Fixed API call with proper payment schedule data structure for successful updates
    - Added Mark as Paid buttons to Complete Payment Schedule table for individual payments
    - Removed Mark as Paid button from main Payment Schedules table (only in detailed modal)
    - ✅ **COMPLETED**: Fixed schema validation by adding dueDate transformation to handle string-to-Date conversion
    - ✅ **COMPLETED**: Full Mark as Paid functionality working correctly with proper validation and database updates
    - ✅ **COMPLETED**: Payment schedule automatically advances to next payment, progress bar updates, and status changes correctly
    - ✅ **COMPLETED**: Mark as Unpaid functionality implemented to reverse paid status back to pending
    - ✅ **COMPLETED**: Replaced disabled "Paid" buttons with active "Mark as Unpaid" buttons in payment modal
    - ✅ **COMPLETED**: Dashboard Quick Actions card removed as requested
    - ✅ **COMPLETED**: Recent Loan Applications updated to show latest 7 loans with customer names
    - ✅ **COMPLETED**: Action buttons removed from Recent Loan Applications table
    - ✅ **COMPLETED**: View All button now redirects to loan book page
    - ✅ **COMPLETED**: Dashboard metrics fixed to include disbursed loans in total loan calculation
    - ✅ **COMPLETED**: Monthly revenue card updated to display total interest payments received instead of income management
    - ✅ **COMPLETED**: Monthly revenue now combines both interest payments and income management records
    - ✅ **COMPLETED**: Interest payments automatically added to income table when payments are marked as paid
    - ✅ **COMPLETED**: Interest payments removed from income table when payments are marked as unpaid
    - ✅ **COMPLETED**: Backfill functionality added to create income records for existing paid payments
    - ✅ **COMPLETED**: Monthly revenue card simplified to show only sum of income table amounts ($375)
    - ✅ **COMPLETED**: Monthly revenue card renamed to "Monthly Income" and updated to show current month income only
    - ✅ **COMPLETED**: Loan Portfolio Overview card now displays line chart showing total loans by month
    - ✅ **COMPLETED**: Added backend API endpoint for loan portfolio data across all months of current year
    - ✅ **COMPLETED**: Implemented responsive line chart using recharts library with proper formatting
    - ✅ **COMPLETED**: Payment Status card updated to show actual payment data with time-based overdue categories
    - ✅ **COMPLETED**: Added backend API for payment status data including 7, 30, 90 day overdue calculations
    - ✅ **COMPLETED**: Created PaymentStatusCard component with proper icons and percentage calculations

The application follows a monorepo structure with clear separation of concerns between frontend, backend, and shared code. The use of TypeScript throughout ensures type safety across the entire stack, while modern tooling provides excellent developer experience and production performance.