# Shivarivel Construction & Interiors

# AI Development Rules



## 1. Read Before Write



Before modifying any file, read all relevant documentation.



Read:

- PRODUCT_SPEC.md

- ARCHITECTURE.md

- DATABASE_RULES.md

- UI_DESIGN_SYSTEM.md

- This file



Do not independently redesign the architecture.



---



## 2. Inspect Before Creating



Before creating any file:

- Inspect the existing repository structure

- Inspect existing files that may already implement the required functionality

- Do not create duplicate implementations



---



## 3. One Module at a Time



Build features module-by-module.



Do not implement all modules simultaneously.



Each module must be:

- Complete

- Tested

- Integrated

- Working

before moving to the next module.



---



## 4. Database First



For each module:

1. Create the database migration

2. Create database functions/views

3. Create TypeScript types

4. Create Supabase queries/mutations

5. Create forms/validations

6. Create UI components

7. Create pages

8. Test the complete flow



---



## 5. No Fake Data in Production



Do not seed fake business data.



Only seed safe reference data (e.g., service types).



The application must never appear to contain fake business activity.



---



## 6. Financial Safety



All financial operations must be atomic.



Never use floating point for money.



Never allow the frontend to bypass RLS.



Never expose service-role keys to the browser.



---



## 7. Approved Stack Only



Use only the approved technology stack.



Do not introduce:

- Express

- Prisma

- MongoDB

- Firebase

- Custom JWT authentication

- GraphQL

- Redis

- Message queues

- Kubernetes

- Docker (unless required)

- Separate backend servers



unless explicitly requested.



---



## 8. Migration Discipline



All schema changes must be represented by migrations.



Migrations must be:

- Ordered

- Reproducible

- Understandable

- Safe



Use clear migration names.



Do not create dozens of tiny migrations for one logical change.



---



## 9. RLS is Mandatory



Every business table must have RLS enabled.



Do not create USING (true) policies for business data.



Do not disable RLS to make development easier.



---



## 10. Company Isolation



All business data must be company-scoped.



Users must never see another company's data.



Use current_company_id() for default values and RLS policies.



---



## 11. Type Safety



Use TypeScript types for all database interactions.



Generate types from the Supabase schema when possible.



Do not use `any` type for database responses.



---



## 12. Error Handling



Handle errors at every layer:

- Database constraints

- RLS policy violations

- Network errors

- Validation errors



Never expose raw database errors to the user.



---



## 13. Testing Requirements



For each module, verify:

- Migration succeeds

- RLS is correctly configured

- CRUD operations work

- Validation works

- Error handling works

- TypeScript compiles

- Build succeeds



---



## 14. Do Not Over-Engineer



Keep the architecture simple.



Do not add unnecessary abstractions.



The goal is a working, maintainable application.



Not a demonstration of architectural patterns.
