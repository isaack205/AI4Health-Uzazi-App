# UZAZI - Project Context

## Project Overview

**UZAZI** is a gamified AI-powered postpartum wellness support application tailored for African mothers and Community Health Workers (CHWs). 

It is a modern web application built with a focus on usability, role-based access control, and real-time data handling.

### Main Technologies
* **Framework:** Next.js 15 (App Router)
* **UI Library:** React 19
* **Styling:** Tailwind CSS
* **Backend/BaaS:** Firebase (Authentication, Firestore)
* **State Management / Data Fetching:** TanStack React Query (`@tanstack/react-query`)
* **Forms & Validation:** React Hook Form (`react-hook-form`), Zod (`zod`), `@hookform/resolvers`
* **Icons:** Lucide React
* **UI Components:** Radix UI primitives with `class-variance-authority` and `tailwind-merge` (similar to Shadcn UI architecture).
* **Language:** TypeScript

## Architecture & Directory Structure

* **`app/`**: Next.js App Router structure.
  * Uses route groups for logical separation: `(auth)`, `(mother)`, `(chw)`.
  * **Middleware:** `middleware.ts` enforces role-based access control for protected routes (e.g., verifying Firebase session cookies and role tokens).
* **`components/`**: Organized UI components.
  * `auth/`: Login, registration, and authentication shells.
  * `chw/`: Components specific to Community Health Workers (e.g., triage boards, mothers tables).
  * `mother/`: Components specific to mothers (e.g., dashboards, companion chats, daily check-ins).
  * `shared/`: App shells, headers, and generic feature cards.
  * `ui/`: Reusable, low-level UI components (buttons, inputs, cards, toasts).
* **`lib/`**: Core utilities, Firebase initialization (`firebase.ts`), authentication helpers (`auth.ts`, `auth-server.ts`), and TypeScript types.
* **`lib/hooks/`**: Custom React hooks for interacting with the backend (`use-checkin.ts`, `use-companion.ts`, `use-mothers.ts`).
* **`providers/`**: Global React context providers (`AuthProvider`, `QueryProvider`, `ToastProvider`).

## Roles & Access
The application distinguishes between at least two primary user roles:
1.  **Mother (`mother`)**: Accesses postpartum wellness tracking, AI companion chat, and check-in workflows.
2.  **Community Health Worker (`chw`)**: Accesses triage dashboards and manages assigned mothers/visits.

## Building and Running

Ensure you have the appropriate `NEXT_PUBLIC_FIREBASE_*` environment variables configured in a `.env.local` or `.env` file before running the application.

*   **Development Server:** `npm run dev` (or `pnpm dev` / `yarn dev`)
*   **Production Build:** `npm run build`
*   **Start Production Server:** `npm run start`
*   **Linting:** `npm run lint`

## Development Conventions

*   **Styling:** Use Tailwind CSS for all styling. Rely on `cn` (from `clsx` and `tailwind-merge`) to conditionally combine Tailwind classes in reusable components.
*   **Data Fetching:** Use TanStack React Query for managing asynchronous state, caching, and background updates when interacting with Firebase or Next.js API routes.
*   **Forms:** All complex forms should be built using React Hook Form and validated with Zod schemas.
*   **Components:** Keep components modular and functional. Use Server Components by default where possible, and `"use client"` directives only when interactivity or client-side hooks are needed.
*   **Fonts:** The application uses Google Fonts configured via `next/font/google`: Playfair Display (Display/Headings), DM Sans (Body), and JetBrains Mono (Monospace).
