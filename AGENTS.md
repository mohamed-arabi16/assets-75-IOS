# Project Agents.md Guide for AI Agents

This Agents.md file provides comprehensive guidance for AI agents working with this codebase.

## Project Overview

This is a modern frontend project template based on React 18, TypeScript, and Vite. It's suitable for building high-performance Single Page Applications (SPA) with an integrated modern development toolchain and best practices.

## Tech Stack

- **Frontend Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **State Management:** Zustand / Redux Toolkit (or other modern state management libraries)
- **Routing:** React Router v6
- **UI Components:** Shadcn UI (a collection of re-usable components)
- **Styling:** Tailwind CSS
- **HTTP Client:** Axios (or other modern HTTP clients)
- **Testing Framework:** Vitest + React Testing Library (recommended)
- **Code Quality:** ESLint + Prettier

## Project Structure

The project follows a standard structure for modern React applications:

```
project-name/
├── public/              # Static assets (favicon, index.html)
├── src/
│   ├── components/      # Reusable React components
│   │   ├── ui/          # UI components from Shadcn
│   │   └── layout/      # Layout components (e.g., Sidebar, Navbar)
│   ├── pages/           # Page components corresponding to routes
│   ├── hooks/           # Custom React Hooks
│   ├── contexts/        # React Context providers
│   ├── lib/             # Utility functions
│   ├── assets/          # Static assets like images or fonts
│   ├── styles/          # Global styles
│   └── ...
├── tests/               # Test files
├── .env.example         # Example environment variables
├── package.json         # Project dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite configuration
└── README.md            # Project overview and setup instructions
```

## Development Guidelines

### Coding Conventions

- **General:**
  - Use TypeScript for all new code.
  - Follow the existing code style in each file.
  - Write meaningful variable and function names.
  - Add comments for complex logic.
- **React Components:**
  - Use functional components with Hooks.
  - Keep components small and focused on a single responsibility.
  - Define interfaces for all props using TypeScript.
  - Use `PascalCase.tsx` for component file names.
- **Styling:**
  - Use Tailwind CSS for styling.
  - Follow the utility-first approach.
  - Use custom CSS only when necessary.

### Git Workflow

- **Branch Naming:** Use descriptive branch names (e.g., `feature/add-new-page`, `fix/login-bug`).
- **Commit Messages:** Write clear and concise commit messages.
- **Pull Requests:**
  - Include a clear description of the changes.
  - Reference any related issues.
  - Ensure all tests pass.
  - Keep PRs focused on a single concern.

## Environment Setup

### Development Requirements

- **Node.js:** v18 or higher
- **Package Manager:** npm (or yarn/pnpm)

### Installation Steps

1. **Clone the project:**
   ```bash
   git clone [repository-url]
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Start the development server:**
   ```bash
   npm run dev
   ```

## Core Feature Implementation

This project includes several core features that serve as a foundation for building a complete application.

### Authentication

- **Sign In/Sign Up:** The `SignIn.tsx` and `SignUp.tsx` pages provide the basic UI for user authentication.
- **Protected Routes:** The `ProtectedRoute.tsx` component ensures that certain routes are accessible only to authenticated users.
- **Authentication Context:** The `AuthContext.tsx` manages the user's authentication state throughout the application.

### Layout

- **App Layout:** The `AppLayout.tsx` component defines the main layout of the application, including the sidebar and top navigation bar.
- **Sidebar:** The `Sidebar.tsx` component provides navigation links to different pages of the application.

## Testing Strategy

### Unit Testing

- **Framework:** Vitest + React Testing Library
- **Test Coverage:** Aim for high test coverage for all components and utility functions.
- **Test File Organization:** Place test files in the `tests/` directory or next to the component files (e.g., `Button.test.tsx`).

### Programmatic Checks

Before submitting changes, run the following checks:

- **Lint check:**
  ```bash
  npm run lint
  ```
- **Build check:**
  ```bash
  npm run build
  ```

All checks must pass before code can be merged.

## Deployment Guide

### Build Process

- **Build command:**
  ```bash
  npm run build
  ```
This command will generate a `dist/` directory with the optimized production build.

### Deployment Steps

1. **Prepare the production environment.**
2. **Configure environment variables.**
3. **Execute deployment scripts.**
4. **Verify the deployment.**

## Common Issues

- **Issue:** Component not rendering correctly.
  - **Solution:** Check the component's props, state, and conditional rendering logic.
- **Issue:** API requests failing.
  - **Solution:** Verify the API endpoint, request payload, and authentication token.
