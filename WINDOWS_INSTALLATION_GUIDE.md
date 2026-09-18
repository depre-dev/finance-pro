# FinancePro Windows Server Installation Guide

This guide will walk you through installing and deploying the FinancePro financial management application on a Windows Server.

## Prerequisites

Before you begin, ensure you have:
- Windows Server 2016 or newer
- Administrator access to the server
- Internet connection for downloading dependencies
- PostgreSQL database (local or cloud-based like Neon, AWS RDS, etc.)

## Step 1: Install Node.js

1. **Download Node.js:**
   - Go to https://nodejs.org/
   - Download the Windows Installer (.msi) for the LTS version (recommended: 20.x or newer)
   - Choose the 64-bit version for Windows

2. **Install Node.js:**
   - Run the downloaded .msi file as Administrator
   - Follow the installation wizard
   - Make sure to check "Add to PATH" during installation
   - Verify installation by opening Command Prompt and running:
     ```cmd
     node --version
     npm --version
     ```

## Step 2: Install Git (Optional but Recommended)

1. **Download Git:**
   - Go to https://git-scm.com/download/win
   - Download Git for Windows

2. **Install Git:**
   - Run the installer as Administrator
   - Use default settings during installation

## Step 3: Set Up PostgreSQL Database

### Option A: Use Cloud Database (Recommended)
1. **Neon (Recommended):**
   - Go to https://neon.tech/
   - Create a free account
   - Create a new database
   - Copy the connection string (starts with `postgresql://`)

### Option B: Install PostgreSQL Locally
1. **Download PostgreSQL:**
   - Go to https://www.postgresql.org/download/windows/
   - Download the Windows installer

2. **Install PostgreSQL:**
   - Run installer as Administrator
   - Set a password for the postgres user
   - Note the port (default: 5432)
   - Create a database named `financepro`

## Step 4: Download and Prepare the Application

1. **Create Application Directory:**
   ```cmd
   mkdir C:\FinancePro
   cd C:\FinancePro
   ```

2. **Download Application Files:**
   - If using Git:
     ```cmd
     git clone [YOUR_REPOSITORY_URL] .
     ```
   - Or manually copy all application files to `C:\FinancePro`

3. **Install Dependencies:**
   ```cmd
   npm install
   ```

## Step 5: Configure Environment Variables

1. **Create Environment File:**
   - Create a file named `.env` in the root directory (`C:\FinancePro\.env`)
   - Add the following content:
   ```env
   # Database Configuration
   DATABASE_URL=postgresql://username:password@host:port/database_name
   
   # Application Configuration
   NODE_ENV=production
   PORT=5000
   
   # Session Configuration (generate a random secret)
   SESSION_SECRET=your-very-long-random-secret-here-min-32-characters
   ```

2. **Configure Database URL:**
   - Replace the DATABASE_URL with your actual database connection string
   - For Neon: Use the connection string from your Neon dashboard
   - For local PostgreSQL: Use format like `postgresql://postgres:yourpassword@localhost:5432/financepro`

## Step 6: Build the Application

1. **Build Frontend and Backend:**
   ```cmd
   npm run build
   ```

2. **Initialize Database:**
   ```cmd
   npm run db:push
   ```

   This command fails with a non-zero exit code if the schema is not applied.
   If it reports an error, stop here and fix it before continuing; the
   application cannot run against a schema that was never pushed.

## Step 7: Set Up Windows Service (Recommended)

### Option A: Using PM2 (Recommended)

1. **Install PM2 globally:**
   ```cmd
   npm install -g pm2
   npm install -g pm2-windows-service
   ```

2. **Create PM2 configuration file (`ecosystem.config.js`):**
   ```javascript
   module.exports = {
     apps: [{
       name: 'financepro',
       script: 'dist/index.js',
       instances: 1,
       exec_mode: 'cluster',
       env: {
         NODE_ENV: 'production',
         PORT: 5000
       },
       error_file: 'logs/err.log',
       out_file: 'logs/out.log',
       log_file: 'logs/combined.log',
       time: true
     }]
   };
   ```

3. **Create logs directory:**
   ```cmd
   mkdir logs
   ```

4. **Start the application:**
   ```cmd
   pm2 start ecosystem.config.js
   pm2 save
   pm2-service-install
   ```

### Option B: Using NSSM (Non-Sucking Service Manager)

1. **Download NSSM:**
   - Go to https://nssm.cc/download
   - Download and extract to `C:\nssm`

2. **Install Service:**
   ```cmd
   C:\nssm\win64\nssm.exe install FinancePro
   ```

3. **Configure Service:**
   - Path: `C:\Program Files\nodejs\node.exe`
   - Startup directory: `C:\FinancePro`
   - Arguments: `dist/index.js`
   - Service name: `FinancePro`

4. **Set Environment Variables:**
   - In NSSM GUI, go to Environment tab
   - Add: `NODE_ENV=production`
   - Add: `PORT=5000`

5. **Start Service:**
   ```cmd
   net start FinancePro
   ```

## Step 8: Configure Windows Firewall

1. **Open Windows Firewall:**
   - Go to Control Panel > System and Security > Windows Defender Firewall
   - Click "Advanced settings"

2. **Create Inbound Rule:**
   - Click "Inbound Rules" > "New Rule"
   - Rule Type: Port
   - Protocol: TCP
   - Specific Local Ports: 5000
   - Action: Allow the connection
   - Profile: Check all profiles
   - Name: FinancePro Application

## Step 9: Set Up Reverse Proxy with IIS (Optional)

### Install IIS and URL Rewrite Module

1. **Install IIS:**
   - Open Server Manager
   - Add Roles and Features
   - Select Web Server (IIS)

2. **Install URL Rewrite Module:**
   - Download from Microsoft IIS website
   - Install the module

3. **Configure IIS Site:**
   ```xml
   <!-- web.config in IIS site root -->
   <?xml version="1.0" encoding="utf-8"?>
   <configuration>
     <system.webServer>
       <rewrite>
         <rules>
           <rule name="Reverse Proxy" stopProcessing="true">
             <match url="(.*)" />
             <action type="Rewrite" url="http://localhost:5000/{R:1}" />
           </rule>
         </rules>
       </rewrite>
     </system.webServer>
   </configuration>
   ```

## Step 10: Testing the Installation

1. **Test Local Access:**
   - Open browser and go to `http://localhost:5000`
   - You should see the FinancePro login page

2. **Test External Access:**
   - From another computer, go to `http://[SERVER-IP]:5000`
   - If using IIS reverse proxy, use port 80 or 443

3. **Create First User:**
   - Click "Register" on the login page
   - Create your admin account

## Step 11: Backup and Maintenance

### Database Backups
```cmd
# Create backup script (backup.bat)
pg_dump -h [host] -U [username] -d [database] > backup_%date%.sql
```

### Application Updates

Chain the rebuild and the restart with `&&` so the sequence stops at the first
failing step. Run as separate lines, the restart still follows a failed
`npm run db:push`, and the application comes back up against a schema that was
never applied.

```cmd
rem Stop service
pm2 stop financepro
rem or: net stop FinancePro

rem Update code
git pull
rem or manually replace files

rem Rebuild and restart; && stops the chain at the first failure
npm install && npm run build && npm run db:push && pm2 start financepro
rem or: npm install && npm run build && npm run db:push && net start FinancePro
```

If the chain stops early the service stays stopped, which is deliberate: fix the
reported error and run the chain again rather than starting the service on a
half-applied update.

### Log Management
- Logs are stored in `C:\FinancePro\logs\` (PM2)
- Monitor disk space regularly
- Set up log rotation if needed

## Troubleshooting

### Common Issues:

1. **Port 5000 is already in use:**
   - Change PORT in .env file
   - Update firewall rules accordingly

2. **Database connection fails:**
   - Verify DATABASE_URL in .env
   - Check network connectivity
   - Ensure database exists

3. **Permission errors:**
   - Run Command Prompt as Administrator
   - Check file permissions on application directory

4. **Service won't start:**
   - Check Windows Event Viewer
   - Verify Node.js installation
   - Check log files

### Support Commands:
```cmd
# Check if service is running
pm2 status
# or: sc query FinancePro

# View logs
pm2 logs financepro
# or check log files in logs/ directory

# Check Node.js processes
tasklist | findstr node

# Test database connection
node -e "console.log('Testing DB...'); process.exit(0);"
```

## Security Considerations

1. **Keep Windows Server updated**
2. **Use strong database passwords**
3. **Configure SSL/TLS (recommended)**
4. **Regular security scans**
5. **Backup encryption**
6. **User access controls**

## Performance Optimization

1. **Enable clustering in PM2**
2. **Configure IIS compression**
3. **Database performance tuning**
4. **Regular maintenance tasks**

## Conclusion

Your FinancePro application should now be running on Windows Server. The application provides:

- Project management and budget tracking
- Financial record management
- Real-time dashboard with metrics
- User authentication and authorization
- Excel import/export functionality
- API integrations

For additional support or customization, refer to the application documentation or contact your development team.