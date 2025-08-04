# Money Flow - Financial Management System

## Overview

Money Flow is a comprehensive financial management system designed to streamline financial operations for businesses. It handles core functionalities such as loan management, customer relations, payment scheduling, staff management, and detailed financial tracking including income, expenses, assets, liabilities, and equity. The system aims to provide robust reporting and analytics capabilities to support informed decision-making.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

Money Flow employs a modern full-stack monorepo architecture, ensuring clear separation of concerns and type safety across the entire application.

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with CSS variables for theming, enhanced by Radix UI primitives and custom shadcn/ui components for a consistent UI/UX.
- **State Management**: TanStack Query (React Query) for efficient server state management and caching.
- **Routing**: Wouter for client-side navigation.
- **Forms**: React Hook Form with Zod for robust form validation and schema definition.
- **Build Tool**: Vite, configured for optimal development and production builds.

### Backend Architecture
- **Runtime**: Node.js with Express.js for building a scalable and performant API.
- **Language**: TypeScript (ESM modules) for type safety across the stack.
- **Database**: PostgreSQL, managed with Drizzle ORM for type-safe database interactions and migrations. Utilizes Neon serverless PostgreSQL for cloud-native database operations.
- **Authentication**: JWT-based authentication with bcrypt for secure password hashing and role-based access control.
- **API Design**: RESTful API with structured error handling for reliable client-server communication.

### Key Features & Implementations
- **Database Layer**: Centralized Drizzle ORM schema (`shared/schema.ts`) with auto-generated migrations.
- **Multi-Tenant Architecture**: Complete multi-tenant support with Clerk authentication, organization management, and tenant isolation.
- **Authentication System**: Clerk-based authentication with JWT tokens, session management, role-based access control, and organization-level permissions.
- **Organization Management**: Full CRUD operations for organizations, member management, subscription plans, and organization switching.
- **Core Business Entities**: Comprehensive CRUD operations for Users, Customers, Loan Books, Payment Schedules, Staff, Income, Expenses, Bank Accounts, Petty Cash, Inventory, Rent, Assets, Liabilities, and Equity.
- **Payment Schedule System**: Automated payment schedule generation using amortization, tracking, and "Mark as Paid" functionality, with automatic income logging for interest payments.
- **User & Admin Management**: Detailed user profile management, admin user management with role-based access control, and comprehensive audit logging.
- **Financial Analytics & Reporting**: Dashboard metrics, monthly income tracking, loan portfolio overview, payment status analysis, and advanced analytics for compliance, risk assessment, and portfolio performance. Includes automated BoG regulatory reports.
- **Loan Products**: Management system for defining and tracking loan products, including integrated fee processing.
- **Loan Simulator**: A tool for calculating loan amortizations and generating payment schedules.
- **LIORA AI Assistant**: An integrated conversational AI for real-time financial analysis and loan management recommendations.
- **Customer Portal**: A separate, secure customer-facing portal with dedicated authentication for managing loans, payments, and profiles.

## External Dependencies

- **@neondatabase/serverless**: For connecting to Neon serverless PostgreSQL.
- **drizzle-orm**: The primary ORM for database interactions.
- **@tanstack/react-query**: For server state management in the frontend.
- **@radix-ui/*** (various packages): Unstyled, accessible UI primitives for building custom components.
- **react-hook-form**: For managing form state and validation.
- **zod**: For schema definition and runtime type validation.
- **bcryptjs**: For password hashing.
- **jsonwebtoken**: For JWT token handling.
- **recharts**: For charting and data visualization in analytics.
- **Perplexity AI**: Integrated for the LIORA AI Assistant's conversational capabilities.
- **@clerk/backend** and **@clerk/clerk-react**: For multi-tenant authentication and organization management.

## Phase 11 Implementation Complete

### Multi-Tenant Architecture & Clerk Authentication
Successfully implemented a comprehensive multi-tenant architecture with the following components:

1. **Clerk Integration**:
   - Configured Clerk authentication with environment variables
   - Created custom ClerkProvider with glassmorphism styling
   - Implemented JWT token verification middleware
   - Set up user synchronization between Clerk and database

2. **Organization Management**:
   - Created organizations table with subscription plans
   - Implemented organization members junction table for multi-org support
   - Built OrganizationContext for managing current tenant state
   - Created OrganizationSwitcher component for seamless switching
   - Added CreateOrganization component with subscription tiers

3. **Role-Based Access Control**:
   - Defined roles: super_admin, org_admin, manager, member, viewer
   - Implemented requireRole and requirePermission middleware
   - Added organization-level permissions system
   - Created role helpers in useAuth hook

4. **API Routes**:
   - Added /api/organizations endpoints for CRUD operations
   - Implemented organization switching functionality
   - Created member management endpoints
   - Added tenant isolation to all existing routes

5. **UI Components**:
   - Organization switcher in header
   - Organization settings page
   - Member management interface
   - Subscription plan selection

### Current Architecture
The application now supports multiple microfinance institutions from a single deployment, with complete data isolation between organizations and granular access control.