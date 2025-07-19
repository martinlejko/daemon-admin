# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Owleyes** is a web-based Linux server and systemd service management application. It allows users to remotely manage multiple Linux servers via SSH, controlling systemd services, viewing logs, and monitoring server status through an intuitive web interface.

### Architecture
- **Monorepo Structure**: Frontend and backend in separate directories
- **Frontend**: React 19 + TypeScript + Vite + Chakra UI v3 + Bun
- **Backend**: FastAPI + Python 3.13 + Fabric (SSH) + UV package manager
- **Target**: SSH-based remote management of Linux servers and systemd services

## Development Commands

### Frontend (React + Bun)
```bash
cd frontend/
bun run dev              # Start development server (http://localhost:5173)
bun run build            # Build for production
bun run lint             # Run ESLint
bun run preview          # Preview production build
bunx ultracite format    # Format code with Ultracite
bunx @chakra-ui/cli snippet add <component>  # Add UI component snippets
```

### Backend (FastAPI + UV)
```bash
cd backend/
uv run python main.py    # Run backend server
uv sync                  # Install/sync dependencies
uv run ruff check        # Run linting
uv run ruff format       # Format code
uv run basedpyright      # Type checking
```

### Project-wide
```bash
bunx ultracite format    # Format all TypeScript/JavaScript files
bunx ultracite lint      # Check code quality without fixing
```

## Code Architecture

### Frontend Structure
The frontend follows feature-based organization:
```
frontend/src/
├── components/          # Reusable UI components
├── features/           # Feature-specific components and logic
├── pages/             # Top-level page components
├── hooks/             # Custom React hooks
├── stores/            # Global state management (Zustand)
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

### Backend Structure (Planned)
```
backend/app/
├── api/v1/            # API routes (HTTP endpoints)
├── schemas/           # Pydantic request/response models
├── models/            # SQLAlchemy database models
├── services/          # Business logic layer
├── utils/             # Helper functions and utilities
├── config.py          # Configuration management
└── database.py        # Database connection setup
```

### Feature Organization Pattern
For any new feature (e.g., systemd service management):
- **API Routes** → `api/v1/systemd_services.py` (HTTP endpoints)
- **Schemas** → `schemas/systemd_service.py` (Pydantic models)
- **Database Entity** → `models/systemd_service.py` (SQLAlchemy model)
- **Business Logic** → `services/systemd_service.py` (core functionality)
- **Templates/Helpers** → `utils/` (supporting functions)

## Technology Stack Details

### Chakra UI v3 Integration
- **Factory API**: Use `chakra.div`, `chakra.button` etc. for styled components
- **Snippet Components**: Generate via `bunx @chakra-ui/cli snippet add <component>`
- **Provider Setup**: `ChakraProvider` with `defaultSystem` in main.tsx
- **Import Pattern**: `import { chakra, ChakraProvider, defaultSystem } from '@chakra-ui/react'`

### SSH Integration (Backend)
- **Library**: Fabric for SSH connections and remote command execution
- **Purpose**: Systemd service control, log retrieval, server monitoring
- **Security**: SSH key-based authentication, connection pooling

### Package Management
- **Frontend**: Bun (fast JavaScript runtime and package manager)
- **Backend**: UV (fast Python package installer and resolver)
- **Code Quality**: Ultracite (Biome-based formatter/linter)

### Development Tooling
- **TypeScript**: Strict mode enabled for maximum type safety
- **Pre-commit Hooks**: Husky for code validation
- **Accessibility**: Comprehensive a11y rules via Ultracite
- **Hot Reload**: Both frontend (Vite) and backend support

## Key Development Guidelines

### Code Quality Standards (Ultracite)
- **Accessibility**: ARIA attributes, semantic HTML, keyboard navigation
- **TypeScript**: Strict typing, no `any`, prefer `const` assertions
- **React**: Hooks dependency arrays, no nested components, proper key props
- **Error Handling**: Comprehensive try-catch blocks, meaningful error messages
- **Performance**: Use `for...of` over `Array.forEach`, avoid unnecessary re-renders

### Critical Rules to Follow
1. **No `any` type** - Use proper TypeScript types
2. **Accessibility first** - Include ARIA attributes, semantic elements
3. **SSH Security** - Never hardcode credentials, use key-based auth
4. **Error boundaries** - Graceful error handling in UI and API
5. **Factory Pattern** - Use `chakra.element` for Chakra UI v3 components

### Testing Considerations
- Backend: FastAPI's TestClient for API testing
- Frontend: React Testing Library for component testing
- SSH: Mock Fabric connections for unit tests
- E2E: Consider real SSH connections to test VMs

## Project Context

### Core Features (from requirements)
1. **Server Management**: Add/remove Linux servers, connection status
2. **Service Control**: Start/stop/restart systemd services remotely
3. **Log Viewing**: Real-time log streaming and filtering
4. **Dashboard**: Overview of all servers and services

### Current Status
- ✅ Basic project structure initialized
- ✅ Frontend build system working (React + Chakra UI v3)
- ✅ Backend foundation (FastAPI + dependencies)
- 🚧 API endpoints and database models (in planning)
- 🚧 SSH integration layer (in planning)
- 🚧 Real-time WebSocket communication (in planning)

### Dependencies
- **Frontend**: React 19, Chakra UI 3.22.0, TypeScript 5.8, Vite 7
- **Backend**: FastAPI 0.116+, Fabric 3.2+, Python 3.13+
- **Tools**: Bun 1.2+, UV (latest), Ultracite 5.0+

## Common Tasks

### Adding a New UI Component
1. Check if Chakra UI v3 has a snippet: `bunx @chakra-ui/cli snippet add <name>`
2. If not available, use factory API: `chakra.div`, `chakra.button`, etc.
3. Follow accessibility guidelines from Ultracite rules
4. Place in appropriate feature folder or reusable components

### Adding a New API Endpoint
1. Define Pydantic schemas in `schemas/`
2. Create SQLAlchemy model in `models/` (if needed)
3. Implement business logic in `services/`
4. Add API route in `api/v1/`
5. Include proper error handling and validation

### SSH Integration
- Use Fabric's `Connection` class for SSH operations
- Implement connection pooling for performance
- Handle connection timeouts and retries gracefully
- Log all SSH operations for debugging

### Real-time Features
- Plan WebSocket integration for live status updates
- Consider event-driven architecture for service state changes
- Implement graceful fallbacks for connection issues

Remember: This is a systems administration tool handling SSH connections and remote server management. Security, reliability, and clear error messaging are paramount.