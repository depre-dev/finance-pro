# FinancePro - Financial Management Application

## Overview

FinancePro is a full-stack financial management application built with React, Express, and PostgreSQL. It provides a comprehensive dashboard for tracking projects, budgets, financial records, and generating reports. The application follows a modern full-stack architecture with a React frontend, Express backend, and uses Drizzle ORM for database management.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### January 24, 2025
- **CATS Booking View**: Built comprehensive WBS search and filtering system across all project releases and business units
- **Re-booking Export System**: Created Excel export functionality matching exact Infosys template format for financial re-posting
- **Project Selection Modal**: Added advanced project selection interface with budget summaries and export configuration
- **Excel Template Integration**: Implemented proper .xlsx file generation with correct column structure and formatting
- **PSP Element Integration**: Connected WBS data from Excel imports to proper PSP element assignment in re-booking exports
- **Financial Re-posting Workflow**: Added complete workflow for Capex re-postings with vendor, responsible person, and voucher description fields
- **Simplified Charge Addition System**: Completely re-imagined expense workflow with streamlined QuickChargeModal featuring budget impact preview, preset common expenses, and direct project card integration
- **Custom Expense Categories**: Updated expense categories to specific business requirements: Training and onboarding, Development, Quality Assurance, Test automation, Performance and load testing, Security testing, Penetration testing, Infrastructure

### January 23, 2025
- **Complete Dashboard Redesign**: Rebuilt dashboard with improved layout, better alignment, and enhanced budget overview charts
- **Enhanced Budget Visualizations**: Added comprehensive budget progress bars, pie charts for distribution, and project comparison bar charts
- **Budget Planning Feature**: Built comprehensive budget category management with variance analysis and visual charts
- **Improved Metrics Display**: Added 4-card metric overview with total budget, spent amounts, and status indicators
- **Project Status Overview**: Added detailed project status cards with individual progress tracking
- **Recent Activity Feed**: Integrated charge history display showing latest transactions and expenses
- **Comprehensive Charge History System**: Added complete charge tracking with database table, API endpoints, and UI components
- **Detailed Project View**: Implemented expandable project details modal with full budget breakdown and charge history
- **Excel Upload Workflow Redesign**: Modified system to store Excel data first in uploadedData table, then allow project creation from stored data
- **Project Creation from Uploaded Data**: Added blue banner in project modal showing available Excel project names for easy selection
- **Updated Upload Process**: Users can now upload Excel files without selecting projects first - data is stored and projects created later
- **Project Deletion Feature**: Added delete functionality with confirmation dialog for safe project removal
- **Terminology Update**: Changed all "Actual Cost" labels to "Budget Spend" and "spent" to "spend" for consistent terminology throughout the application

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **UI Components**: Radix UI primitives with shadcn/ui design system
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization
- **Build Tool**: Vite for fast development and building

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Neon serverless driver
- **ORM**: Drizzle ORM for type-safe database operations
- **API Design**: RESTful API with structured error handling
- **Authentication**: Basic user simulation (placeholder for production auth)
- **Session Management**: Express sessions with PostgreSQL store

### Database Schema
The application uses four main tables:
- **users**: User authentication and profile information
- **projects**: Project details with budgets and timelines
- **financialRecords**: Income and expense tracking linked to projects
- **budgetCategories**: Budget planning and actual vs planned tracking

## Key Components

### Dashboard System
- Real-time metrics display (active projects, budgets, spending)
- Interactive charts showing budget vs actual spending
- Quick action buttons for creating projects and records
- Project search and filtering capabilities

### Project Management
- Full CRUD operations for projects
- Budget tracking with status indicators
- Client and timeline management
- Project-specific financial record association

### Financial Tracking
- Income and expense categorization
- Date-based transaction recording
- Project-specific financial record management
- Budget category allocation and tracking

### UI Components
- Comprehensive component library using Radix UI primitives
- Consistent design system with theme support
- Form components with validation
- Modal dialogs for data entry
- Responsive layout with sidebar navigation

## Data Flow

1. **Client Requests**: React components make API calls using TanStack Query
2. **API Layer**: Express routes handle requests with validation
3. **Database Operations**: Drizzle ORM executes type-safe database queries
4. **Response Handling**: Data is returned through standardized API responses
5. **State Updates**: TanStack Query manages cache invalidation and updates
6. **UI Updates**: React components re-render with updated data

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless connection
- **drizzle-orm**: Type-safe ORM with PostgreSQL support
- **@tanstack/react-query**: Server state management
- **react-hook-form**: Form handling and validation
- **zod**: Schema validation
- **wouter**: Lightweight React router

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **recharts**: React charting library
- **lucide-react**: Icon library
- **class-variance-authority**: Component variant management

### Development Dependencies
- **vite**: Build tool and dev server
- **typescript**: Type checking and development
- **esbuild**: Fast JavaScript bundler for production builds

## Deployment Strategy

### Development Environment
- Vite dev server with hot module replacement
- Express server with automatic restarts using tsx
- Database migrations using Drizzle Kit
- Environment variable configuration for database connections

### Production Build
1. Frontend assets built with Vite to `dist/public`
2. Backend compiled with esbuild to `dist/index.js`
3. Single Node.js server serves both API and static files
4. Database migrations applied via Drizzle Kit push command

### Environment Configuration
- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Environment mode (development/production)
- Build scripts handle both frontend and backend compilation

The application is designed for easy deployment to platforms like Replit, with automatic database provisioning and environment setup.