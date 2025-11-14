# DEVELOPMENT.md

This file provides guidance for AI assistants (Claude, OpenAI, Gemini, etc.) and developers when working with code in this repository.

---

## 🤖 For AI Assistants

This section is intended to be read by AI assistants.

### Repository Overview

This is a learning and experimental workspace ("prelude") for exploring various technologies and frameworks. The repository is organized into foundry apps (working prototypes) and future learning projects.

**Structure:**
- `apps/foundry/` - Working prototypes and experiments
- `apps/learning/` - Planned learning projects (TODO apps in various stacks)
- `reference/` - Reference materials and examples
- `docs/` - Public documentation (committed to Git)
- Root uses pnpm workspaces for shared tooling (e.g., prettier)

### Development Environment

#### Primary Runtime: Bun
This repository primarily uses **Bun** instead of Node.js, npm, or other JavaScript runtimes.

**Always prefer:**
- `bun install` instead of npm/pnpm/yarn install
- `bun run <script>` instead of npm run
- `bun <file>` instead of node/ts-node
- `bun test` instead of jest/vitest
- `bun build` instead of webpack/vite

**Note:** Bun automatically loads `.env` files, so no need for dotenv packages.

#### Code Formatting
Prettier is configured at the root level with these settings:
- Single quotes
- No semicolons
- No trailing commas (ES5 style)
- Spaces (not tabs)

Run: `pnpm prettier --write .` (or `bun run` equivalent)

### Apps

#### stripe-bun (apps/foundry/stripe-bun)

A Stripe payment integration with React 19 frontend and Bun backend, demonstrating separated architecture.

**Tech Stack:**
- **Runtime**: Bun v1.3.2
- **Backend**: Stripe SDK v19+ with Bun.serve
- **Frontend**: React 19, @stripe/react-stripe-js v3.10.0
- **Build**: Bun.build() with `define` option for env var injection

**Project Structure:**
```
stripe-bun/
├── backend/           # API Server (port 3000)
│   ├── src/
│   │   ├── server.ts
│   │   └── stripeClient.ts
│   └── .env          # STRIPE_SECRET_KEY
└── frontend/         # Dev Server (port 3001)
    ├── src/
    │   ├── App.tsx
    │   ├── CheckoutForm.tsx
    │   ├── main.tsx
    │   └── server.ts  # Bun.serve + Bun.build()
    └── .env          # PUBLIC_STRIPE_PUBLISHABLE_KEY
```

**Project Commands:**
```bash
# Backend (Terminal 1)
cd apps/foundry/stripe-bun/backend
bun install
cp .env.example .env  # Add STRIPE_SECRET_KEY
bun run dev           # Runs on http://localhost:3000

# Frontend (Terminal 2)
cd apps/foundry/stripe-bun/frontend
bun install
cp .env.example .env  # Add PUBLIC_STRIPE_PUBLISHABLE_KEY
bun run dev           # Runs on http://localhost:3001
```

**Environment Variables:**
- **Backend** (`backend/.env`):
  - `STRIPE_SECRET_KEY` - Server-only, never exposed to client
  - `STRIPE_WEBHOOK_SECRET` - Server-only, for webhook verification
- **Frontend** (`frontend/.env`):
  - `PUBLIC_STRIPE_PUBLISHABLE_KEY` - Client-safe, injected at build time
  - **IMPORTANT**: `PUBLIC_` prefix is required for client-side injection

**Backend API Endpoints:**
- Health: `GET /health` → Returns "ok"
- Payment: `POST /create-payment-intent`
  - Body: `{ amount: number, currency: string }`
  - Returns: `{ clientSecret: string }`
  - Default: 1000 USD (smallest unit = $10.00)
  - CORS enabled for http://localhost:3001

**Frontend Architecture:**
- `src/App.tsx` - Main component with Stripe Elements provider
- `src/CheckoutForm.tsx` - Payment form with CardElement
- `src/server.ts` - Development server with `Bun.build()` integration
  - Builds React app with env var injection using `define` option
  - Serves built JS with hashed filenames
  - Generates dynamic HTML

**Environment Variable Injection:**

The frontend uses the `PUBLIC_` prefix pattern with `Bun.build()`:

```typescript
// frontend/src/server.ts
const buildResult = await Bun.build({
  entrypoints: ['./src/main.tsx'],
  define: {
    'process.env.PUBLIC_STRIPE_PUBLISHABLE_KEY': JSON.stringify(
      process.env.PUBLIC_STRIPE_PUBLISHABLE_KEY
    ),
  },
})
```

This approach:
- Replaces `process.env.PUBLIC_*` with string literals at build time
- Prevents secret keys from being exposed to client
- Makes intent explicit (only `PUBLIC_` prefixed vars are injected)

**Development Notes:**
- Uses strict TypeScript configuration for both frontend and backend
- CORS configured for cross-origin requests between frontend/backend
- Frontend uses React 19 StrictMode
- Backend validates amount and currency before creating PaymentIntent
- CardElement provides PCI-compliant card input (hosted by Stripe)

### TypeScript Configuration

The stripe-bun app uses a strict TypeScript setup:
- Target: ESNext with bundler module resolution
- Strict mode enabled with additional checks (noUncheckedIndexedAccess, noImplicitOverride)
- JSX: react-jsx (for potential frontend work)
- noEmit: true (Bun handles transpilation)

### Future Projects (Planned)

The following projects are outlined in README but not yet implemented:
- `apps/learning/todo-hono/` - Hono + TypeScript TODO app
- `apps/learning/todo-go-gin/` - Go + Gin TODO app
- `apps/learning/todo-python-fastapi/` - Python + FastAPI TODO app
- `apps/learning/todo-rails/` - Ruby on Rails TODO app
- `apps/learning/todo-laravel/` - Laravel TODO app
- `apps/learning/todo-mern/` - MERN stack TODO app

### Best Practices

#### When Working with Bun
- Prefer Bun's built-in APIs over Node.js equivalents:
  - `Bun.file()` over `fs.readFile/writeFile`
  - `Bun.serve()` over Express/Fastify
  - Built-in WebSocket support
  - `bun:sqlite` for SQLite
  - `Bun.sql` for Postgres
- Use `Bun.serve()` routing for simple HTTP servers instead of frameworks
- Leverage Bun's native TypeScript support without additional transpilation

#### Stripe Integration
- Always validate `STRIPE_SECRET_KEY` exists before initializing client
- Use smallest currency units (e.g., cents for USD)
- Validate amount is positive and finite before creating PaymentIntents
- Enable `automatic_payment_methods` for modern payment flows
- Handle errors gracefully with appropriate HTTP status codes

#### Environment Setup
- Environment variables are auto-loaded from `.env` files by Bun
- Never commit `.env` files (included in .gitignore)
- Validate required environment variables on startup

---

## 📚 iCloud Documentation Management

### Overview

This repository uses a **dual documentation strategy**:

1. **Public Documentation** (`docs/`)
   - Committed to Git
   - Viewable on GitHub
   - Contains general implementation guides, architecture explanations
   - No sensitive information

2. **Private Documentation** (iCloud)
   - NOT committed to Git
   - Stored in iCloud Drive for cross-device access (Mac, iPad, iPhone)
   - Contains implementation notes, API keys (sandbox only), deployment procedures
   - Managed via MWeb app

### iCloud Base Path

All private documentation is stored at:

```
/Users/yoshi/Library/Mobile Documents/iCloud~com~coderforart~iOS~MWeb/Documents/We Are All One/Prelude
```

### Directory Structure

```
Prelude/
├── 00-general/                      # Cross-project knowledge
│   ├── README.md
│   ├── development-setup.md
│   ├── bun-cheatsheet.md
│   ├── git-workflow.md
│   ├── tools.md
│   └── templates/
│       └── project-template.md      # Template for new projects
│
├── foundry/                         # Experimental projects
│   ├── README.md
│   └── {project-name}/
│       ├── 01-implementation-notes.md
│       ├── 02-deployment-checklist.md
│       ├── 03-troubleshooting.md
│       ├── 04-webhook-testing.md    # (if applicable)
│       └── 99-ideas.md
│
└── learning/                        # Learning projects
    ├── README.md
    └── {project-name}/
        ├── 01-setup.md
        ├── 02-implementation.md
        └── 03-lessons-learned.md
```

### Creating New Documentation

#### Method 1: Using Helper Script (Recommended)

```bash
# Create a new document in iCloud
./scripts/new-icloud-doc.sh foundry/stripe-bun 05-frontend.md

# Edit with VSCode
code "/Users/yoshi/Library/Mobile Documents/iCloud~com~coderforart~iOS~MWeb/Documents/We Are All One/Prelude/foundry/stripe-bun/05-frontend.md"
```

#### Method 2: Manual Creation

```bash
# Create directory
mkdir -p "/Users/yoshi/Library/Mobile Documents/iCloud~com~coderforart~iOS~MWeb/Documents/We Are All One/Prelude/foundry/new-project"

# Copy template
cp "/Users/yoshi/Library/Mobile Documents/iCloud~com~coderforart~iOS~MWeb/Documents/We Are All One/Prelude/00-general/templates/project-template.md" \
   "/Users/yoshi/Library/Mobile Documents/iCloud~com~coderforart~iOS~MWeb/Documents/We Are All One/Prelude/foundry/new-project/01-implementation-notes.md"
```

#### Method 3: Ask AI Assistant

When working with Claude Code, OpenAI CLI, or Gemini CLI:

> "Create implementation notes for learning/todo-hono in iCloud.
> Path: `/Users/yoshi/Library/Mobile Documents/iCloud~com~coderforart~iOS~MWeb/Documents/We Are All One/Prelude/learning/todo-hono/01-implementation-notes.md`"

### YAML Front Matter

All iCloud documents should include YAML front matter for MWeb tag management:

```markdown
---
tags: relevant, tags, here
---

# Document Title

Content here...
```

**Common tags:**
- Project: `stripe`, `line-bot`, `todo-hono`
- Technology: `bun`, `typescript`, `go`, `python`
- Type: `implementation`, `troubleshooting`, `deployment`
- Status: `wip`, `completed`, `blocked`

### File Naming Conventions

Use numbered prefixes for sequential documents:

```
01-implementation-notes.md    # Implementation details
02-deployment-checklist.md    # Deployment procedures
03-troubleshooting.md         # Common errors and solutions
04-webhook-testing.md         # Testing procedures (if applicable)
99-ideas.md                   # Future ideas and improvements
```

### Security Notes

**Allowed in iCloud documents:**
- ✅ Sandbox/test API keys (e.g., `sk_test_...`)
- ✅ Test webhook secrets
- ✅ Implementation notes with actual commands
- ✅ Error logs and troubleshooting steps

**Never include:**
- ❌ Production API keys (e.g., `sk_live_...`)
- ❌ Real user data
- ❌ Production database credentials
- ❌ OAuth client secrets for production

### Accessing on Other Devices

**iPad/iPhone:**
1. Open MWeb app
2. Navigate to: We Are All One → Prelude
3. Browse by category tree or search by tags

**Mac:**
- Files are automatically synced via iCloud
- Access via Finder or VSCode

---

## 👨‍💻 For Human Developers

This section provides quick reference information for human developers. For detailed setup instructions, see [README.md](README.md).

### Quick Start

```bash
# Clone repository
git clone <repository-url>
cd prelude

# Setup Git hooks (prevents committing secrets)
./scripts/setup-git-hooks.sh

# Install dependencies for a specific app
cd apps/foundry/stripe-bun
bun install

# Run development server
bun run dev
```

### Common Tasks

**Create new iCloud documentation:**
```bash
./scripts/new-icloud-doc.sh foundry/new-project 01-implementation-notes.md
```

**Format code:**
```bash
pnpm prettier --write .
```

**Kill process on port 3000:**
```bash
lsof -ti :3000 | xargs kill -9
```

### Key Files

- `DEVELOPMENT.md` - This file (AI and developer guidance)
- `CLAUDE.md` - Symlink to DEVELOPMENT.md (for Claude Code auto-loading)
- `README.md` - Project overview and setup instructions
- `CLAUDE.ja.md` - Japanese version of guidance

---

**Last Updated:** 2025-11-14
