# Masterglobal Logistics Order Management System

A production-grade internal web application for logistics order management.

## Tech Stack

- **Framework**: Next.js 13 (App Router)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js (Credentials)
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Prerequisites

- Node.js 18+
- PostgreSQL Database
- npm or yarn

## Getting Started

### 1. Installation

```bash
npm install
```

### 2. Database Setup

1.  Start your PostgreSQL server.
2.  Copy `.env.example` to `.env` (if not present) and update the `DATABASE_URL`.

    ```env
    DATABASE_URL="postgresql://user:password@localhost:5432/fms?schema=public"cd 
    NEXTAUTH_SECRET="your-secret-key"
    NEXTAUTH_URL="http://localhost:3000"
    ```

3.  Generate Prisma client:

    ```bash
    npm run db:generate
    ```

4.  Push schema to database:

    ```bash
    npm run db:push
    ```

### 3. Seeding Data

Create a default admin user (`admin` / `password123`) and sample customer:

```bash
npm run db:seed
```

### 4. Running Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

**Login Credentials:**
- **Username**: `admin`
- **Password**: `password123`

## Building for Production

1.  Build the application:

    ```bash
    npm run build
    ```

2.  Start the production server:

    ```bash
    npm run start
    ```

## Features

- **Order Management**: Create, edit, and track orders with bills, containers, and charges.
- **Financial Calculations**: Server-side computation of Sales, Costs, and VAT.
- **Reporting**:
    - **Order Summary Report**: Aggregated view of financial performance.
    - **Excel Export**: Download reports for offline analysis.
    - **Printable Sheets**: Clean, print-friendly order details.
- **Security**: Protected routes, input validation (Zod), and secure authentication.

## Project Structure

- `src/app`: Next.js App Router pages and API routes.
- `src/components`: Reusable UI components.
- `src/lib`: Utilities (Prisma, Auth).
- `src/repositories`: Database access layer.
- `src/services`: Business logic and validation layer.
- `prisma`: Database schema and seed script.

## Maintenance

- **Update Database**: When changing `schema.prisma`, run `npm run db:push` to sync database and `npm run db:generate` to update client.
- **Add User**: Use `npm run db:seed` or add via database client (passwords must be bcrypt hashed).
