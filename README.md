# Balance Tracker

Balance Tracker is a comprehensive personal finance management application designed to help you keep track of your income, expenses, debts, and assets. It features both a web and a mobile application, allowing you to manage your finances from anywhere.

## Features

- **Dashboard:** Get a quick overview of your financial health, including your current balance, upcoming income, and recent activity.
- **Income Tracking:** Log your income from various sources.
- **Expense Tracking:** Keep a detailed record of your expenses.
- **Debt Management:** Track your short-term and long-term debts.
- **Asset Management:** Monitor the value of your assets, including real estate, crypto, and precious metals.
- **Cross-Platform:** Manage your finances on the web or on the go with our mobile app.
- **Authentication:** Secure your financial data with user authentication.

## Tech Stack

### Web Application
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS with shadcn/ui
- **Backend:** Supabase (Database and Authentication)
- **Routing:** React Router v6
- **State Management:** React Query

### Mobile Application
- **Framework:** Expo (React Native)
- **Styling:** Nativewind
- **Backend:** Supabase (Database and Authentication)
- **Routing:** Expo Router

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm, yarn, or pnpm

### Web Application Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project by copying the example file:
    ```bash
    cp .env.example .env
    ```
    You will need to fill in your Supabase project URL and anon key.

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

### Mobile Application Setup

1.  **Navigate to the mobile directory:**
    ```bash
    cd mobile
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    The mobile app uses the same `.env` file from the root directory.

4.  **Run the development server:**
    ```bash
    npx expo start
    ```

## Database

The database schema and helper functions are located in the `database/` directory. The schema is defined in `schema.sql`, and there are also SQL functions for updating debt and income amounts.

## License

This project is licensed under the MIT License.
