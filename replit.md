# FinancePro - Financial Management Application

## Overview

FinancePro is a full-stack financial management application designed to provide a comprehensive dashboard for tracking projects, budgets, financial records, and generating reports. It aims to offer real-time insights into financial performance, streamline financial management workflows, and provide robust reporting capabilities. The application is built with a modern full-stack architecture, utilizing React for the frontend, Express for the backend, and PostgreSQL with Drizzle ORM for database management. Its core purpose is to offer a comprehensive solution for financial oversight and management, enhancing decision-making through clear data visualization and reporting.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Components**: Radix UI primitives with shadcn/ui design system, styled using Tailwind CSS and CSS variables.
- **State Management**: TanStack Query (React Query) for server state management.
- **Forms**: React Hook Form with Zod validation.
- **Charts**: Recharts for data visualization.
- **Routing**: Wouter for client-side routing.
- **Build Tool**: Vite.
- **UI/UX Decisions**: Emphasizes a clean, professional, and modern design with comprehensive animated micro-interactions using framer-motion, including animated cards, buttons, progress bars, and loading states. Features include a redesigned dashboard with enhanced budget charts, project summary cards, unified recent activity, and release filter integration.

### Backend Architecture
- **Framework**: Express.js with TypeScript.
- **Database**: PostgreSQL with Neon serverless driver.
- **ORM**: Drizzle ORM for type-safe database operations.
- **API Design**: RESTful API with structured error handling.
- **Authentication**: Session-based authentication with bcrypt password hashing, secure HTTP-only cookies, and PostgreSQL session store. Authentication middleware protects all API endpoints.
- **API Integration System**: Comprehensive system for connecting to external APIs, replacing manual Excel import/export. Includes configuration management, external data synchronization services, and a dedicated UI for managing connections.

### Database Schema
The application utilizes six core tables:
- **users**: For user authentication, roles, and profiles.
- **sessions**: For secure session management.
- **projects**: For project details, budgets, and ownership.
- **financialRecords**: For income and expense tracking linked to projects.
- **budgetCategories**: For budget planning and variance analysis.
- **chargeHistory**: For an audit trail of all financial transactions.

### Key Features and Implementations
- **Dashboard System**: Real-time metrics, interactive budget charts, project summary cards, and a unified recent activity feed with release filtering.
- **Reporting System**: Real-time generation of Budget Summary, Project Status, and Expense Analysis reports with export capabilities (CSV, JSON, TXT) and Swiss Franc currency formatting.
- **Project Management**: Full CRUD operations for projects, budget tracking, and integration of a comprehensive charge history. Includes streamlined expense workflow with a QuickChargeModal and custom expense categories.
- **Excel Integration**: Allows storing uploaded Excel data first, then creating projects from this data, updating the workflow to be more flexible.
- **User Authentication**: Secure session-based authentication with bcrypt hashing, robust session management, and integrated login/registration UI.
- **API Integration**: System for connecting to external APIs to fetch financial and project data, supporting various authentication methods and ensuring bidirectional data synchronization.

## External Dependencies

### Core Dependencies
- `@neondatabase/serverless`: For PostgreSQL serverless connection.
- `drizzle-orm`: For type-safe ORM operations.
- `@tanstack/react-query`: For server state management.
- `react-hook-form`: For form handling and validation.
- `zod`: For schema validation.
- `wouter`: For client-side routing.

### UI Dependencies
- `@radix-ui/*`: For accessible UI primitives.
- `tailwindcss`: For utility-first CSS styling.
- `recharts`: For charting and data visualization.
- `lucide-react`: For icons.
- `class-variance-authority`: For component variant management.
- `framer-motion`: For animations and micro-interactions.

### Development Dependencies
- `vite`: For build tool and development server.
- `typescript`: For type checking.
- `esbuild`: For fast JavaScript bundling.