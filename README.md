# FinancePro - Financial Management Application

A comprehensive full-stack financial management application built for precise project budget tracking, real-time insights, and enhanced workflow management with intuitive project data exploration and streamlined expense tracking.

## 🚀 Features

### Core Financial Management
- **Project Budget Tracking** - Complete CRUD operations with budget vs actual spending analysis
- **Real-time Dashboard** - Live metrics, interactive charts, and budget visualizations
- **Streamlined Expense Addition** - Quick charge system with budget impact preview and preset common expenses
- **Advanced Budget Planning** - Category management with variance analysis and visual charts
- **Comprehensive Charge History** - Complete expense tracking with cumulative spending and remaining budget calculations

### Advanced Workflow Features
- **CATS Booking View** - WBS search and filtering system across all project releases and business units
- **Excel Re-booking Export** - Financial re-posting with Infosys template format compatibility
- **Project Release Filtering** - Advanced project organization with release-based filtering
- **Quick Budget Snapshots** - Instant budget overview with visual progress indicators
- **Collaborative Project Notes** - Team communication and project updates

### Excel Integration
- **Smart Excel Upload** - Import project data with automatic parsing and validation
- **Template Matching** - Export system matching exact Infosys financial re-posting format
- **PSP Element Integration** - WBS data connection to proper PSP element assignment
- **Bulk Project Creation** - Create multiple projects from uploaded Excel data

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** with shadcn/ui components
- **TanStack Query** for server state management
- **Recharts** for data visualization
- **React Hook Form** with Zod validation
- **Wouter** for client-side routing

### Backend
- **Express.js** with TypeScript
- **PostgreSQL** with Neon serverless driver
- **Drizzle ORM** for type-safe database operations
- **Express Sessions** with PostgreSQL store
- **XLSX** package for Excel file processing

### Database Schema
- **users** - User authentication and profiles
- **projects** - Project details with budgets and timelines
- **financialRecords** - Income and expense tracking
- **budgetCategories** - Budget planning and variance analysis
- **uploadedData** - Excel import data storage
- **chargeHistory** - Detailed expense tracking with budget impact

## 📋 Expense Categories

The system supports 8 specific business expense categories:
- Training and onboarding
- Development
- Quality Assurance
- Test automation
- Performance and load testing
- Security testing
- Penetration testing
- Infrastructure

## 💻 System Requirements

### Hardware Requirements

#### Minimum Requirements
- **CPU**: 2-core processor (Intel i3 equivalent or AMD Ryzen 3)
- **RAM**: 4 GB system memory
- **Storage**: 2 GB available disk space
- **Network**: Broadband internet connection (for database connectivity)

#### Recommended Requirements
- **CPU**: 4-core processor (Intel i5 equivalent or AMD Ryzen 5) or higher
- **RAM**: 8 GB system memory or higher
- **Storage**: 5 GB available disk space (SSD preferred for better performance)
- **Network**: High-speed broadband internet connection

#### Production Server Requirements
- **CPU**: 8-core processor or higher
- **RAM**: 16 GB system memory minimum (32 GB recommended for high traffic)
- **Storage**: 50 GB available disk space (SSD required)
- **Network**: Dedicated server connection with redundancy
- **Database**: Separate PostgreSQL server with 8 GB RAM minimum

### Software Requirements

#### Development Environment
- **Operating System**: 
  - Windows 10/11 (64-bit)
  - macOS 10.15 (Catalina) or later
  - Linux (Ubuntu 18.04 LTS or equivalent)
- **Node.js**: Version 18.0.0 or higher (LTS recommended)
- **npm**: Version 8.0.0 or higher (included with Node.js)
- **PostgreSQL**: Version 12.0 or higher
- **Git**: Version 2.20 or higher

#### Browser Compatibility
- **Chrome**: Version 90 or higher (recommended)
- **Firefox**: Version 88 or higher
- **Safari**: Version 14 or higher
- **Edge**: Version 90 or higher

#### Production Environment
- **Operating System**: Linux (Ubuntu 20.04 LTS or CentOS 8 recommended)
- **Node.js**: Version 18.0.0 or higher (LTS)
- **PostgreSQL**: Version 14.0 or higher
- **Process Manager**: PM2 or similar for production deployment
- **Reverse Proxy**: Nginx or Apache for production serving
- **SSL Certificate**: Required for HTTPS in production

### Browser Support Matrix

| Browser | Minimum Version | Recommended |
|---------|----------------|-------------|
| Chrome | 90 | Latest |
| Firefox | 88 | Latest |
| Safari | 14 | Latest |
| Edge | 90 | Latest |
| Mobile Safari | 14 | Latest |
| Chrome Mobile | 90 | Latest |

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher) - see System Requirements above
- PostgreSQL database (v12 or higher)
- npm or yarn package manager
- Ensure your system meets the minimum hardware requirements

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/financepro.git
cd financepro
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create .env file with:
DATABASE_URL=your_postgresql_connection_string
NODE_ENV=development
```

4. Set up the database:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## 📁 Project Structure

```
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Application pages/routes
│   │   ├── lib/           # Utility functions and configurations
│   │   └── hooks/         # Custom React hooks
├── server/                # Express.js backend
│   ├── routes.ts          # API route definitions
│   ├── storage.ts         # Database operations
│   └── index.ts           # Server entry point
├── shared/                # Shared types and schemas
│   └── schema.ts          # Database schema and Zod validations
├── attached_assets/       # Uploaded files and Excel templates
└── README.md             # This file
```

## 🎯 Key Features in Detail

### Quick Charge System
- **Direct Project Access** - Add expenses directly from project cards
- **Smart Budget Warnings** - Real-time budget impact calculations
- **Preset Common Expenses** - One-click additions for frequent expense types
- **Category Validation** - Ensures expenses are properly categorized

### Advanced Excel Integration
- **Multi-format Support** - Handles various Excel file formats
- **Data Validation** - Automatic validation of imported project data
- **Template Export** - Generates Excel files matching specific business formats
- **Bulk Operations** - Process multiple projects simultaneously

### Real-time Dashboard
- **Live Metrics** - Active projects, total budgets, monthly spending
- **Interactive Charts** - Budget vs actual spending visualizations
- **Project Status Overview** - Individual project progress tracking
- **Quick Actions** - Fast access to common operations

## 🔧 API Endpoints

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Charges
- `GET /api/charge-history` - List all charges
- `POST /api/charge-history` - Add new charge
- `GET /api/projects/:id/charge-history` - Project-specific charges

### Excel Operations
- `POST /api/upload-excel` - Upload Excel file
- `GET /api/excel-project-names` - List available Excel projects
- `POST /api/rebooking-export` - Generate re-booking Excel export

### Dashboard
- `GET /api/dashboard/metrics` - Get dashboard metrics
- `GET /api/budget-categories` - List budget categories

## 🧪 Development

### Database Migrations
```bash
# Push schema changes to database
npm run db:push

# Force push, skipping the confirmation prompt (use with caution)
npm run db:push -- --force
```

### Building for Production
```bash
# Build both frontend and backend
npm run build

# Start production server
npm start
```

## 📊 Database Schema

The application uses PostgreSQL with the following main tables:

- **users** - User authentication with encrypted passwords, roles, and profile information
- **sessions** - Secure session management with expiration tracking and user relationships
- **projects** - Core project information with budgets, timelines, and user ownership
- **financialRecords** - Income and expense tracking linked to projects and users
- **budgetCategories** - Budget planning and actual vs planned tracking with user context
- **chargeHistory** - Complete audit trail of all financial transactions and modifications
- **uploadedData** - Stores Excel import data for project creation workflows

### Database Performance Requirements
- **Connection Limit**: Minimum 20 concurrent connections for development, 100+ for production
- **Storage**: 1 GB minimum for development, scale based on data volume in production
- **Backup**: Daily automated backups recommended for production environments

## 🔐 Security & Environment

### Security Features
- **Authentication**: Session-based authentication with bcrypt password hashing
- **Session Management**: Secure localStorage-based sessions for cross-origin compatibility
- **Database Security**: Connection strings with proper authentication
- **Input Validation**: Zod schemas for type-safe data validation
- **SQL Injection Protection**: Drizzle ORM with parameterized queries
- **CORS Support**: Properly configured for cross-origin requests

### Environment Variables
```bash
# Required
DATABASE_URL=postgresql://username:password@host:port/database
NODE_ENV=development|production

# Optional
PORT=5000
SESSION_SECRET=your-session-secret
```

### Performance Considerations
- **Database Indexing**: Proper indexes on frequently queried columns
- **Connection Pooling**: PostgreSQL connection limits based on traffic
- **Caching**: Redis recommended for session storage in high-traffic environments
- **CDN**: Content Delivery Network for static assets in production
- **Monitoring**: Application performance monitoring (APM) tools recommended

### Production Deployment Checklist
- [ ] HTTPS enabled with valid SSL certificate
- [ ] Environment variables properly configured
- [ ] Database connection pooling configured
- [ ] Process manager (PM2) configured
- [ ] Reverse proxy (Nginx) configured
- [ ] CORS properly configured for production domains
- [ ] Database backups automated
- [ ] Monitoring and logging in place

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📈 Recent Updates

- **Streamlined Charge Addition** - Completely redesigned expense workflow with QuickChargeModal
- **Enhanced Budget Visualization** - Real-time budget impact preview and warnings
- **Excel Re-booking Export** - Complete Infosys template format integration
- **CATS Booking System** - WBS search across project releases and business units
- **Custom Expense Categories** - 8 specific business categories for precise tracking

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions, please open an issue in the GitHub repository.

---

Built with ❤️ using modern web technologies for efficient financial project management.