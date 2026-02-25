# Master Global Order Management System

## Senior Engineer Build Prompt

You are a senior software engineer and system architect.

Build a **production-grade, lean internal web application** called **Master Global Order Management System** for a logistics / freight forwarding company.

This system is NOT a demo, tutorial, prototype, or experimental architecture.

It must be written like software that a real company will operate daily.

Prioritize:

* Stability
* Data integrity
* Security
* Maintainability
* Clear structure
* Strong backend logic

Avoid overengineering.

Do NOT introduce microservices, message queues, Docker, Kubernetes, Redis, event sourcing, or complex distributed patterns.

This is a **single production-ready monolithic application**.

---

# Mandatory Technology Stack

Use ONLY:

* Next.js (latest, App Router)
* TypeScript (strict mode)
* PostgreSQL
* Prisma ORM
* NextAuth (Credentials provider only)
* Tailwind CSS
* Nodemailer (SMTP)
* ExcelJS

Do not substitute technologies.
Do not add unnecessary libraries.

---

# Engineering Standards (Critical)

Follow these rules strictly:

* No frontend financial calculations.
* All financial logic must execute on the server.
* Never trust client input.
* Validate all request payloads.
* Use database constraints wherever possible.
* Enforce relational integrity.
* Prefer explicit code over magic abstractions.
* Keep functions small and readable.
* Avoid deeply nested logic.
* Fail loudly — do not silently swallow errors.

Write code like it will be maintained for 5+ years.

---

# Architecture

Build a structured monolith using Next.js route handlers.

Use clear separation:

```
src/
 ├ app/
 │   ├ api/
 │   ├ (protected)/
 │   ├ login/
 │
 ├ lib/
 │   ├ prisma.ts
 │   ├ auth.ts
 │   ├ validations/
 │
 ├ components/
 ├ services/      (business logic only)
 ├ repositories/  (database access only)
```

**Rules:**

* Do NOT place database queries inside UI components.
* Business logic belongs in services.
* Database access belongs in repositories.

---

# Database Design (Strict)

Use Prisma with PostgreSQL.

### Requirements:

* Primary keys MUST be UUID.
* Enforce unique constraints.
* Enforce foreign keys.
* Use cascading deletes only where safe.
* Add indexes on frequently queried columns.
* Never allow orphan records.

---

# Models Required

Create relational models:

* User
* Customer
* CustomerAddress
* CustomerContact
* CustomerDocument
* Order
* OrderDetail
* Container
* Charge

Normalize the schema.

Do NOT store arrays or JSON where relational tables are appropriate.

---

# Authentication (High Priority)

Implement secure login using **NextAuth Credentials provider**.

### Requirements:

* Passwords hashed with bcrypt.
* Never store plaintext passwords.
* Protect all application routes except `/login`.
* Use session-based authentication.
* Update `lastLogin` timestamp on successful login.
* Implement middleware for route protection.

---

# Application Layout

Create a professional ERP-style dashboard.

## Left Sidebar (Hardcoded)

* Customer Master
* Order Preparation
* Reports

## Top Bar

* Logged-in username
* Logout button

Design must favor usability over visual flair.

Avoid heavy animations.

---

# Customer Master (Core Module)

### Fields:

* customerCode (**UNIQUE, REQUIRED**)
* customerName (**REQUIRED**)
* telephone
* email
* country
* city
* state
* salesPerson
* createdAt

### Capabilities:

Customers MUST support:

* Multiple addresses
* Multiple contacts
* Multiple document uploads

### File Storage Rules:

* Store uploaded files locally.
* Persist ONLY the file path in the database.

### Allowed File Types:

* pdf
* doc
* docx
* jpg
* png
* txt

Validate file size and type.

---

# Email Automation

When a new customer is created:

Send an email via SMTP using Nodemailer.

**Subject:** Customer Created
**Body:** Welcome the customer by name.

### Rules:

* Keep it synchronous but efficient.
* Log email failures.
* Do NOT crash the request if email fails.

---

# Order Module (Transactional Core)

### Orders Table:

* id (UUID)
* orderNumber (**UNIQUE**)
* orderDate
* executionDate
* customerId (FK)

Each order must support multiple:

* Bills (OrderDetails)
* Containers
* Charges

Use relational consistency.

---

# Order Details (Bills)

### Fields:

* billNumber (alphanumeric, required)
* marks
* description
* qty (float, > 0)
* weight (float)
* volume (float)

Validate numeric fields strictly.

---

# Containers

### Fields:

* billNumber
* containerNumber (recommended unique)
* sealNumber
* containerWeight

---

# Charges — Financial Safety (Extremely Important)

Server MUST automatically compute:

```
saleAmount = qty * saleRate
costAmount = qty * costRate

vatSale = (saleAmount * vatPercent) / 100
vatCost = (costAmount * vatPercent) / 100

totalSale = saleAmount + vatSale
totalCost = costAmount + vatCost
```

## Strict Rules:

* Never accept totals from client.
* Ignore client-provided totals if present.
* Recalculate on update.
* Use Prisma transactions when writing financial records.

**Financial correctness is non-negotiable.**

---

# Data Integrity Rules

Enforce:

* Unique customerCode
* Unique orderNumber
* Required foreign keys

Avoid cascades that could destroy financial data accidentally.

Prefer **soft delete** for Customers and Orders if deletion is implemented.

---

# Reporting

## 1. Printable Order Sheet

Display:

* Order header
* Bills
* Containers
* Charges

Use a print-friendly layout.

---

## 2. Order Summary Report

### Columns:

* Order Number
* Execution Date
* Customer
* Total Sales
* Total Cost
* Total Sales VAT
* Total Cost VAT
* Net Amount

Compute totals via aggregation queries — NOT frontend loops.

---

# Excel Export

Provide an API endpoint that exports Order Summary using ExcelJS.

### Requirements:

* Proper column headers
* Numeric formatting
* File name: `orders.xlsx`
* Stream or buffer safely

---

# Validation Layer

Implement server-side validation (**recommended: Zod**).

### Rules:

* Reject invalid payloads early.
* Return meaningful error messages.

---

# Security Baseline

* Hash passwords
* Validate inputs
* Protect routes
* Prevent SQL injection via Prisma
* Sanitize file uploads
* Limit file size
* Do not expose stack traces to clients

---

# Performance Guidelines

* Avoid N+1 queries.
* Use indexed columns.
* Fetch relations intentionally.
* Do not overfetch.
* Keep API responses structured and minimal.

---

# Code Quality

Write **production-quality code**.

NOT tutorial code.

Avoid:

* Giant files
* God functions
* Duplicated logic

Extract business logic into services.

Keep repositories focused strictly on database operations.

---

# What To Avoid

Do NOT add:

* Microservices
* CQRS
* Event buses
* Complex RBAC
* Premature caching
* Distributed architecture

Build software appropriate for a **small-to-mid-sized operational team**.

---

# Final Objective

Produce a clean, maintainable, production-ready internal order management system that a logistics company could deploy and use with minimal modification.

**Favor robustness over cleverness.**
**Favor clarity over abstraction.**

Write the system like a senior engineer who expects the codebase to live for years.
