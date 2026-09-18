# FinancePro Deployment Guide

## Prerequisites

1. **Node.js** (version 18 or higher)
2. **PostgreSQL** database
3. **Environment variables** configured

## Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your production values:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `SESSION_SECRET`: A strong random secret for session management
   - `NODE_ENV`: Set to `production`
   - `PORT`: Server port (default: 5000)

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up the database:
   ```bash
   npm run db:push
   ```

   This exits non-zero if the schema is not applied. Do not continue to the
   build or the start step until it succeeds.

## Build and Deploy

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

## Production Deployment

The build and the schema push both run tools that are declared as
devDependencies: `vite` and `esbuild` for `npm run build`, `tsx` and
`drizzle-kit` for `npm run db:push`. A production-only install omits all four,
so install everything first and drop the build-only packages afterwards if you
want a slimmer result.

### Docker (Recommended)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --omit=dev
EXPOSE 5000
CMD ["npm", "start"]
```

### Traditional Server
1. Clone the repository
2. Install dependencies: `npm ci`
3. Build the application: `npm run build`
4. Set environment variables
5. Apply the schema: `npm run db:push`
6. Start the server: `npm start`

Run steps 3 to 6 as a chain (`npm run build && npm run db:push && npm start`)
so a failure stops the deploy instead of starting the server on a stale build
or an unapplied schema. Note that `npm prune --omit=dev` removes `tsx` and
`drizzle-kit`, so prune only after the schema push, or reinstall before the
next one.

## Database Migration

The application uses Drizzle ORM with PostgreSQL:
- Schema is defined in `shared/schema.ts`
- Use `npm run db:push` to apply schema changes
- Database migrations are handled automatically
- `npm run db:push` exits non-zero when the push fails, so a deploy script can
  chain on it (`npm run db:push && npm start`) and stop before restarting the
  application against an unapplied schema

## Security Considerations

- Generate a strong `SESSION_SECRET`
- Use HTTPS in production
- Configure proper CORS origins
- Ensure database credentials are secure
- Regular security updates for dependencies

## Monitoring

- Application logs are output to console
- API response times are logged for performance monitoring
- Database connection status is checked on startup

## Troubleshooting

1. **Database connection issues**: Check `DATABASE_URL` format
2. **Build failures**: Ensure all dependencies are installed
3. **Session issues**: Verify `SESSION_SECRET` is set
4. **CORS errors**: Configure `ALLOWED_ORIGINS` if needed