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
- **Multi-Tenant Architecture**: Complete B2B SaaS platform with Clerk authentication for organization-based tenant isolation.
- **Database Layer**: Centralized Drizzle ORM schema (`shared/schema.ts`) with auto-generated migrations and multi-tenant support via organizationId.
- **Authentication System**: Dual authentication - Clerk for staff portal (multi-tenant) and JWT for customer portal.
- **Core Business Entities**: Comprehensive CRUD operations for Users, Customers, Loan Books, Payment Schedules, Staff, Income, Expenses, Bank Accounts, Petty Cash, Inventory, Rent, Assets, Liabilities, and Equity - all with multi-tenant isolation.
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