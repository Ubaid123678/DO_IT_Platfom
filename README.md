# Do It Platform - Phase 0 Setup Complete ✅

## Project Structure

```
DO_IT_Platform/
├── backend/                    # Express.js + TypeScript API
│   ├── src/
│   │   ├── index.ts           # Main server entry
│   │   ├── config/            # Configuration
│   │   ├── modules/           # Feature modules (auth, jobs, wallet, etc.)
│   │   ├── services/          # Business logic services
│   │   ├── middleware/        # Express middleware
│   │   └── common/            # Shared utilities, types, errors
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env                   # Development environment
│   └── .env.example           # Template for new devs
│
├── mobile/                     # React Native (Expo) App
│   ├── app/                   # Navigation and screens
│   ├── components/            # Reusable UI components
│   ├── services/              # API client, theme, utilities
│   ├── app.json               # Expo configuration
│   └── package.json
│
├── web/                        # Next.js Website (Public + Private Admin)
│   ├── app/                   # App router pages
│   ├── components/            # React components
│   ├── public/                # Static assets
│   ├── next.config.js
│   └── package.json
│
└── docs/                       # Project Documentation
    ├── DO_IT_MASTER_DOCUMENTATION.md
    ├── IMPLEMENTATION_PHASES.md
    ├── IMPLEMENTATION_STATUS.md
    └── SPRINT_TASK_BOARD.md
```

## Current Execution Mode

As of 2026-04-10, active implementation is app-first:
- Active build track: mobile app + shared backend
- Deferred track: website frontend + private admin portal UI (to be finalized after app completion)

## Getting Started Locally

### Prerequisites
- Node.js 18+ and npm
- MongoDB (local or Atlas URI)
- Redis (local or cloud)
- Git

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

Backend runs on: http://localhost:8080
Health check: http://localhost:8080/health
API v1: http://localhost:8080/api/v1/health

### Mobile App Setup

```bash
cd mobile
npm install
npm run web          # Run web version
npm run android      # Android emulator
npm run ios          # iOS simulator (macOS only)
```

### Website Setup (Deferred Track)

```bash                     
cd web
npm install
npm run dev
```

Website runs on: http://localhost:3000

Website paths (scaffold only for now):
- Public website home/content: http://localhost:3000/
- Public blog/content section: http://localhost:3000/blog
- Private admin portal path: http://localhost:3000/admin

## Development Workflow

### Backend
- Environment: TypeScript + Express
- Watch mode: `npm run dev`
- Tests: `npm test`
- Lint: `npm run lint`
- Format: `npm run format`

### Mobile
- Hot reload enabled
- Expo Go app for testing
- Navigate to "http://localhost:19000" for QR code

### Website
- Fast refresh enabled
- Public website contains content/blog only
- Private admin portal is isolated under a separate path
- End-user auth flows (register/login/OTP/reset) are mobile-app only
- Website/admin feature implementation is currently paused

## Key Architecture Decisions

1. **Monorepo Structure**: Three separate projects (backend, mobile, website)
2. **Shared Backend**: Single Express API serves both mobile and web
3. **TypeScript**: All projects use TypeScript for type safety
4. **Environment Variables**: .env files for local dev, separate secrets management for production
5. **Website Split**: Web has public content/blog + private admin portal. Consumer auth belongs to mobile app.

## Sprint 01 - Phase 0 Objectives (Complete)
- ✅ Initialize repositories/workspace structure
- ✅ Backend bootstrap (Express + modular structure)
- ✅ Mobile bootstrap (Expo + TypeScript + navigation)
- ✅ Website bootstrap (Next.js + TypeScript + Tailwind)
- ✅ Environment templates and configuration
- ⏭️ Next: CI pipeline setup and coding standards

## Environment Variables

See `.env.example` files in each project directory for required configuration.

For development:
- Backend uses default MongoDB at localhost:27017
- Redis at localhost:6379
- All third-party services use dummy keys (replace in staging/production)

## Next Steps

1. Continue app-first phases (mobile + backend), starting from current Phase 2 targets
2. Complete all app features and API coverage from implementation docs
3. Start website/admin implementation in the final stage after app completion
4. Configure production credentials and launch hardening before release

## Support

Refer to:
- Master documentation: `docs/DO_IT_MASTER_DOCUMENTATION.md`
- Phase plan: `docs/IMPLEMENTATION_PHASES.md`
- Implementation status: `docs/IMPLEMENTATION_STATUS.md`
- Sprint board: `docs/SPRINT_TASK_BOARD.md`
