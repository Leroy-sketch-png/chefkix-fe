# GEMINI.md: Project Context

This file provides a comprehensive overview of the `chefkix-fe` project for our collaborative sessions. It outlines the project's purpose, technologies, and development conventions.

## 1. Project Overview

`chefkix-fe` is a frontend application built with **Next.js 15** and **React 19** using **TypeScript**. Its core feature is to "gamify" cooking recipes. Users can paste raw recipe text, which is then sent to a backend service to be transformed into an interactive, step-by-step cooking game, complete with timers and badges.

### Key Technologies

- **Framework**: Next.js 15 (with App Router)
- **UI Library**: React 19
- **Language**: TypeScript
- **Development Server**: Turbopack (as indicated by the `dev` script)
- **Styling**: Tailwind CSS
- **API Communication**: Axios

### Architecture

The project follows a structured source directory (`src/`) approach:

- **`src/app`**: Contains the application's routes and UI, following the Next.js App Router paradigm.
- **`src/services`**: A dedicated layer for making API calls (e.g., `auth.ts`). This is excellent for separating business logic from UI components.
- **`src/lib`**: Contains shared libraries and utilities, such as the pre-configured Axios instance (`axios.ts`) and TypeScript types (`types.ts`).
- **`src/configs`**: Holds centralized application configuration (e.g., `app.ts`).

## 2. Building and Running

The following scripts are available in `package.json`:

- **`npm run dev`**: Starts the development server with Turbopack at `http://localhost:3000`.
- **`npm run build`**: Creates a production-ready build of the application.
- **`npm run start`**: Starts the production server. Requires a build to have been run first.
- **`npm run lint`**: Runs the Next.js ESLint checker to identify code quality issues.
- **`npm run format`**: Formats all project files using Prettier.

## 3. Development Conventions

- **Code Style**: The project uses **Prettier** for automated code formatting to ensure consistency. The configuration is in `.prettierrc`.
- **Linting**: **ESLint** is configured via `eslint.config.mjs` using the recommended Next.js configuration.
- **Git Workflow**:
    - **Branching**: All new work is done on feature branches, typically prefixed with `feat/` or `fix/` (e.g., `feat/project-setup-and-auth`).
    - **Commits**: We use the **Conventional Commits** specification for clear and descriptive commit messages (e.g., `feat: ...`, `fix: ...`, `chore(dev): ...`).
- **API Backend**: The application communicates with a backend service expected to be running at `http://localhost:8080`.
