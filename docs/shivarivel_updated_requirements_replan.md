# SHIVARIVEL ERP — UPDATED REQUIREMENTS RE-PLAN
**Architectural Inspection, Inventory Classification & Implementation Strategy**
*Date: 2026-10-04*

---

## 1. Updated Requirements Summary

The client's operational model has been refined to eliminate all administrative and enterprise ERP overhead. The application is strictly designed for **a single user: the OWNER**.

### Key Architectural Shifts

| Dimension | Previous Assumption (Phases 02-04) | Updated Client Requirement |
|---|---|---|
| **User Model** | Multi-role ready (Owner, Supervisor, Admin) | **Single User: Owner Only** (Zero roles, zero permissions, zero logins for workers/supervisors) |
| **Labor Master** | Employee directory with wage rates, worker types | **Labor Registration: Name & Phone Number only**. Auto-assigned internal ID. No default wage, trade, or HR data |
| **Wage Recording** | Employee-centric / single entry modal | **Day-wise Entry Matrix**: Owner picks a date, records multiple laborers with Attendance (`Full Day`, `Half Day`, `Absent`) and `Amount Paid` |
| **Wage Settlements** | Wage liability vs payment disbursements | **Amount Entered = Amount Paid**. No separate employee payment or advance settlement module |
| **Weekly Wage View** | Monthly summaries or separate reports | **Week-wise view inside Wages section**: Laborer, Full/Half/Absent counts, projects worked on, day-by-day breakdown, and weekly grand total |
| **Projects** | Project with site address, customer link, status | **Project Name + Client Name ONLY**. No codes, contract values, dates, progress % or statuses exposed |
| **Material Catalog** | Master materials directory (`/materials`) | **ELIMINATED from user experience**. Product is 100% free-text |
| **Supplier Directory** | Master suppliers directory (`/suppliers`) | **ELIMINATED from user experience**. Supplier is 100% free-text |
| **Project Procurement** | Linked to saved materials and saved suppliers | **Inside Project view**: Product (free-text), Supplier (free-text), Quantity, Unit, Total Value, Amount Paid, Balance (Auto) |
| **General Procurement** | Purchases always expected project link | **Separate General Procurement**: Purchases not tied to any project (bulk cement, stock tools, yard supplies) |
| **Supplier Balances** | Separate supplier ledger and payment pages | **Derived Supplier Summary**: Aggregated dynamically by supplier name from purchases and payments |
| **Target Navigation** | Customers, Sites, Purchases, Suppliers, Employees, Daily Wages | **Customers, Projects, Wages, Procurement** (Clean 4-module system) |

---

## 2. Current Implementation Inventory

A comprehensive review of the active codebase across routes, components, hooks, and database schemas:

### 2.1 Routes & Navigation Inventory
- `src/App.tsx`: Contains 50+ legacy enterprise routes (estimates, enquiries, site visits, work progress, finance, reports, settings) along with simplified routes (`/customers`, `/sites`, `/suppliers`, `/materials`, `/purchases`, `/employees`, `/wages`).
- `src/components/layout/Sidebar.tsx`: Currently shows Menu: Customers, Sites, Purchases, Suppliers, Employees, Daily Wages.
- `src/components/layout/MobileBottomNav.tsx`: 5-tab bar (Customers, Sites, Quick Add `+`, Purchases, Daily Wages) plus a mobile action sheet.
- `src/components/quick-add/QuickAddModal.tsx`: Simplified 6-action modal for quick entry.

### 2.2 Customer & Project/Site Inventory
- `src/pages/customers/CustomersPage.tsx` & `CustomerDetailPage.tsx`: Clean customer list and profile.
- `src/components/business/SimpleCustomerModal.tsx`: Name, Phone, Address, City modal.
- `src/pages/projects/SitesPage.tsx` & `SiteDetailPage.tsx`: Clean site profile, Materials section, and Labor section.
- `src/components/business/SimpleSiteModal.tsx`: Project creation modal linking to customer.

### 2.3 Procurement & Supplier Inventory
- `src/pages/procurement/SuppliersPage.tsx` & `SupplierDetailPage.tsx`: User-facing supplier master.
- `src/pages/procurement/MaterialsPage.tsx`: User-facing material catalog.
- `src/pages/procurement/PurchasesPage.tsx`: Purchases list with status badges and filters.
- `src/components/business/SimplePurchaseModal.tsx`: Purchase creation modal linking to saved suppliers and saved materials.
- `src/components/business/SimpleSupplierPaymentModal.tsx`: Dedicated supplier payment recording modal.

### 2.4 Workforce & Wage Inventory
- `src/pages/workforce/EmployeesPage.tsx` & `EmployeeDetailPage.tsx`: Worker directory and recent daily wage cards.
- `src/components/business/SimpleEmployeeModal.tsx`: Name, Phone, and Default Daily Wage.
- `src/components/business/SimpleDailyWageModal.tsx`: Day entry for single employee and site.
- `src/pages/workforce/WagesPage.tsx`: Daily entries list and monthly summary table.

### 2.5 Database Schema Inventory (Migrations 0001–0020)
- `public.employees`: Stores worker directory (`id`, `company_id`, `employee_code`, `name`, `phone`, `daily_wage`, `status`).
- `public.attendance`: Stores operational muster (`id`, `company_id`, `employee_id`, `project_id`, `attendance_date`, `status` IN `'Present'`, `'Half Day'`, `'Absent'`).
- `public.daily_wages`: Financial wage records (`id`, `company_id`, `employee_id`, `attendance_id`, `project_id`, `wage_date`, `payable_units`, `rate`, `base_wage`, `amount`, `status`).
- `public.projects`: Central jobs entity (`id`, `company_id`, `customer_id`, `project_code`, `name`, `status`).
- `public.customers`: Client entity (`id`, `company_id`, `name`, `phone`).
- `public.suppliers`: Vendor directory (`id`, `company_id`, `name`, `phone`, `status`).
- `public.materials`: Material catalog (`id`, `company_id`, `name`, `category`, `unit`).
- `public.purchases`: Purchase transaction header (`id`, `company_id`, `supplier_id`, `project_id` [NULLABLE], `purchase_number`, `purchase_date`, `total_amount`, `status`).
- `public.purchase_items`: Line-item materials (`id`, `company_id`, `purchase_id`, `material_id`, `description`, `quantity`, `unit`, `unit_price`, `amount`).
- `public.supplier_payments` & `public.supplier_payment_allocations`: Tracks payments against purchases.
- `public.v_purchase_balance`: View computing `total_amount`, `total_allocated`, and `outstanding_balance`.
- `public.v_supplier_balance`: View computing `total_purchases`, `total_allocated_payments`, and `outstanding_balance` per supplier.

---

## 3. Classification of Existing Features

| Feature / Artifact | Classification | Rationale & Architectural Handling |
|---|---|---|
| **Customers Module** (`/customers`) | **A. KEEP AS-IS** | Clean, lightweight; provides client entity backing for projects. |
| **SimpleCustomerModal** | **A. KEEP AS-IS** | Perfect for registering client name and phone. |
| **Projects Module** (`/sites` or `/projects`) | **B. REUSE BUT SIMPLIFY** | Repurpose `SitesPage` as Projects. Strip any lingering complex fields; keep Project Name & Client Name. |
| **SimpleSiteModal** | **B. REUSE BUT SIMPLIFY** | Reduce to 2 fields: Project Name + Client Name (select or type client). |
| **Employees Master** (`/employees`) | **B. REUSE BUT SIMPLIFY** | Strip default wage, trade, and address. Registration becomes Name + Phone only. |
| **SimpleEmployeeModal** | **B. REUSE BUT SIMPLIFY** | Remove Default Daily Wage field; only Name + Phone. |
| **Daily Wage Entry Modal** | **D. REPLACE WITH NEW SIMPLIFIED WORKFLOW** | Replace single-employee modal with **Day-Wise Multi-Laborer Matrix**: pick date, record list of laborers with attendance (`Full Day`, `Half Day`, `Absent`) and amount paid. |
| **Monthly Wage Summary** | **D. REPLACE WITH NEW SIMPLIFIED WORKFLOW** | Replace monthly summary tab with **Weekly Wages View** (days worked, projects, total paid per laborer + weekly grand total). |
| **Materials Catalog Page** (`/materials`) | **E. REMOVE FROM USER EXPERIENCE** | The client does NOT want a saved materials catalog. Remove from navigation and quick actions. |
| **Suppliers Directory Page** (`/suppliers`) | **E. REMOVE FROM USER EXPERIENCE** | The client does NOT want a saved supplier master. Remove from navigation and quick actions. |
| **Project Procurement (In Site Detail)** | **D. REPLACE WITH NEW SIMPLIFIED WORKFLOW** | Replace modal requiring saved supplier/material with 6-field free-text entry: Product, Supplier, Quantity, Unit, Total Value, Amount Paid. Auto-compute Balance. |
| **General / Bulk Procurement** | **D. REPLACE WITH NEW SIMPLIFIED WORKFLOW** | Introduce dedicated General Procurement tab/view where `project_id = NULL`. |
| **Supplier Balances / Directory** | **D. REPLACE WITH NEW SIMPLIFIED WORKFLOW** | Replace standalone supplier directory with **Derived Supplier Summary** generated on-the-fly from purchases. |
| **Legacy ERP Modules** (Estimates, Enquiries, Visits, Payroll, Advances, Expenses, Reports, Settings) | **C. HIDE FROM USER** | Keep backend code unexecuted and completely hidden from sidebar and router. |
| **Database Tables** (`employees`, `attendance`, `daily_wages`, `projects`, `customers`, `purchases`, `purchase_items`, `suppliers`, `materials`, `supplier_payments`) | **F. REQUIRED BACKEND DEPENDENCY** | Essential underlying schema. Retained 100% untouched without schema alterations. |

---

## 4. What Can Be Reused

1. **Customers Infrastructure**:
   - `useCustomers`, `useCreateCustomer`, and `SimpleCustomerModal` work seamlessly.
2. **Project / Site Core**:
   - `useProjects`, `useProject`, and `SiteDetailPage` layout structure.
   - `SiteDetailPage` already houses project profile, procurement section, and labor section.
3. **Database Relational Engines**:
   - `purchases` table natively supports `project_id = NULL` for general purchases.
   - `attendance` table natively supports `status IN ('Present', 'Half Day', 'Absent')`.
   - `daily_wages` table natively stores `rate` and `amount`.
   - `v_purchase_balance` and `v_supplier_balance` database views calculate exact totals and outstanding balances automatically.
4. **UI Design System**:
   - Palette, `Button`, `Badge`, `PageContainer`, `PageHeader`, `EmptyState`, table layouts, and mobile bottom sheet ergonomics.

---

## 5. What Must Be Simplified

1. **Labor Registration Form**:
   - Reduced strictly to **2 fields**:
     1. Laborer Name
     2. Phone Number
   - System auto-generates internal Labor ID (`EMP-XXXX`).
   - Default daily wage, trade, address, joining date are removed from the form.
2. **Project Creation Form**:
   - Reduced strictly to **2 fields**:
     1. Project Name
     2. Client Name (selection from existing customers or instant type-in)
   - Code, dates, contract value, statuses are hidden from user input.
3. **Project Procurement Entry**:
   - Form fields:
     1. Product (free-text input, e.g. "Cement")
     2. Supplier (free-text input, e.g. "ABC Traders")
     3. Quantity (numeric)
     4. Unit (dropdown or text, e.g. "Bags", "Loads", "Sq.Ft", "Nos")
     5. Total Value (₹)
     6. Amount Paid (₹)
   - Balance = `Total Value - Amount Paid` (computed instantly).

---

## 6. What Must Be Hidden

1. **Suppliers Directory**: Completely removed from the main menu and quick add. Users never "add a supplier" as a master record.
2. **Materials Catalog**: Completely removed from the main menu and quick add. Users never "add a material" to an inventory catalog.
3. **Employee Advances & Payroll**: No advance deduction buttons, payment vouchers, or loan tracking in the UI.
4. **Estimates, Enquiries, Site Visits, Contracts, Project Milestones**: Never shown in the owner's workflow.
5. **Multi-user Roles & Permissions**: No supervisor/worker switcher, role gates, or permission toggles.

---

## 7. What Must Be Replaced

1. **Daily Wage Entry**:
   - *Old*: Single employee modal (`SimpleDailyWageModal`) with date, employee, site, and wage.
   - *New*: **Day-Wise Labor Roster Matrix**:
     - The owner selects a Date (defaults to Today).
     - Displays all active laborers in a quick-entry table/list.
     - For each laborer, the owner sets:
       - Site / Project
       - Attendance (`Full Day`, `Half Day`, `Absent`)
       - Amount Paid (₹)
     - One-click bulk save or fast row entry.
     - Entered amount is treated as **already paid**.
2. **Wages View**:
   - *Old*: Monthly summary table (Days count and total wage earned).
   - *New*: **Weekly Wages View**:
     - Week selector (e.g. `5 Oct — 11 Oct 2026`).
     - Table columns: `Laborer | Full Days | Half Days | Absent Days | Projects Worked On | Total Paid`.
     - Expandable day-by-day matrix (Mon–Sun).
     - Weekly grand total of wages paid.
3. **Procurement Management**:
   - *Old*: Separate Materials page, Suppliers page, and Purchases page requiring pre-saved entities.
   - *New*: **Unified Procurement Hub**:
     - **Tab 1: Project Procurement** (Filterable by project, shows Product, Supplier, Qty, Total, Paid, Balance).
     - **Tab 2: General Procurement** (Unlinked bulk purchases where Project = None).
     - **Tab 3: Supplier Summary** (Derived summary showing total purchased, paid, and outstanding per supplier name).

---

## 8. Labor/Wage Architecture Plan

### 8.1 Workflow
```
[Select Date: Monday, 5 Oct 2026]
       │
       ▼
[Labor Daily Entry Sheet]
├─ Ravi   → Arun Residence  → Full Day  → ₹900  (Paid)
├─ Mani   → Arun Residence  → Half Day  → ₹450  (Paid)
└─ Suresh → Kumar Residence → Absent    → ₹0    (Paid)
       │
       ▼
[Save Daily Sheet]
       │
       ├─ Under the hood: Inserts/Updates attendance (status: Present/Half Day/Absent)
       ├─ Under the hood: Inserts/Updates daily_wages (rate & amount = entered amount)
       └─ Immediately updates that day's entry list
```

### 8.2 Weekly Roll-Up Engine
- A dedicated query helper derives weekly figures dynamically:
  ```ts
  // Week range: startDate (e.g. 2026-10-05) to endDate (2026-10-11)
  const weekWages = dailyWages.filter(w => w.wage_date >= startDate && w.wage_date <= endDate);
  
  // Group by laborer:
  fullDays = count where status === 'Present'
  halfDays = count where status === 'Half Day'
  absentDays = count where status === 'Absent'
  projectsWorked = unique project names
  totalPaid = sum of amount
  ```
- No separate payment ledger or settlement transactions required.

---

## 9. Project Architecture Plan

### 9.1 Creation & Association
- User inputs only:
  - **Project Name** (e.g. "Arun Kumar Residence")
  - **Client Name** (e.g. "Arun Kumar")
- Backend Mapping:
  - System checks `customers` for a match by client name.
  - If existing, links `customer_id`.
  - If new, creates customer record behind the scenes and links `customer_id`.
  - Project code auto-generated internally (`PRJ-XXXX`).

### 9.2 Project Hub View (`/projects/:id`)
- **Header**: Project Name, Client Name, and Quick Actions.
- **Section 1: Project Procurement**:
  - Procurement KPI cards: `Total Procurement Cost | Total Paid | Total Balance`.
  - Action: `[ + Add Purchase ]`.
  - Table: Product | Supplier | Quantity & Unit | Total Value | Paid | Balance.
- **Section 2: Labor / Site Wages**:
  - Labor KPI card: `Total Labor Paid`.
  - Breakdown by laborer (e.g., `Ravi — ₹4,950`, `Mani — ₹2,250`).
  - Action: `[ + Record Wages for this Site ]`.

---

## 10. Project Procurement Architecture Plan

### 10.1 Free-Text Product & Supplier Resolution
Because `purchases.supplier_id` and `purchase_items.material_id` are strictly `NOT NULL` in the database, the frontend/hook layer handles transparent background entity resolution:
```
User inputs: Product: "Cement", Supplier: "ABC Traders"
                   │
                   ▼
┌────────────────────────────────────────────────────────┐
│            Transparent Background Resolution           │
├────────────────────────────────────────────────────────┤
│ 1. Supplier Check:                                     │
│    SELECT id FROM suppliers WHERE name ILIKE 'ABC Traders'│
│    → Found? Use supplier_id                            │
│    → Not found? INSERT INTO suppliers(name)            │
│                 RETURNING id                           │
│                                                        │
│ 2. Product Check:                                      │
│    SELECT id FROM materials WHERE name ILIKE 'Cement'  │
│    → Found? Use material_id                            │
│    → Not found? INSERT INTO materials(name, category,  │
│                                      unit)             │
│                 VALUES ('Cement', 'General', 'Bags')   │
│                 RETURNING id                           │
└────────────────────────────────────────────────────────┘
                   │
                   ▼
INSERT INTO purchases (project_id, supplier_id, total_amount)
INSERT INTO purchase_items (purchase_id, material_id, description, quantity, unit, amount)
```
- **Zero user interruption**: The owner experiences true free-text entry.
- **Zero database changes**: Database relational integrity and foreign keys are 100% satisfied.

### 10.2 Payment & Balance Tracking
- `Total Value` is stored as `purchases.total_amount`.
- If `Amount Paid > 0`:
  - An associated payment is recorded via `record_supplier_payment` RPC or direct payment allocation.
  - `Balance = Total Value - Amount Paid`.
- If additional payment is made later, a simple `[ Pay Balance ]` action prompts for payment amount, immediately reducing the balance.

---

## 11. General Procurement Architecture Plan

- Dedicated section within Procurement for purchases not tied to any project (e.g., bulk cement bags, safety gear, general consumables).
- **Database Mapping**:
  - `purchases.project_id = NULL`.
  - Database schema explicitly allows `project_id NULL` with `ON DELETE SET NULL`.
- **General Procurement View**:
  - Top Summary Cards: `Total General Purchased | Total Paid | Total Outstanding`.
  - Purchase Entries list: Product, Supplier, Qty, Unit, Total Value, Paid, Balance.
  - Action: `[ + Add General Purchase ]` (5 fields + payment information, project field omitted).

---

## 12. Supplier Summary Architecture

- **Requirement**: The client does not maintain a supplier master, but needs to see:
  ```
  ABC Traders  → Purchased: ₹50,000 | Paid: ₹35,000 | Outstanding: ₹15,000
  XYZ Cement   → Purchased: ₹30,000 | Paid: ₹20,000 | Outstanding: ₹10,000
  ```
- **Architectural Implementation**:
  - Derived dynamically from purchase and payment transactions.
  - Handled either via:
    1. The existing database view `public.v_supplier_balance` (which already groups purchases by `supplier_id` and aggregates total confirmed purchases and allocated payments).
    2. Client-side grouping over the loaded purchases array by `supplier.name`.
  - The owner gets an instant financial overview per vendor without ever having to manage a vendor directory.

---

## 13. Database Compatibility Analysis

| Requirement | Database Feasibility | Detailed Schema Analysis | Changes Needed? |
|---|---|---|---|
| **Labor Registration (Name + Phone only)** | **YES (100% Compatible)** | `public.employees` requires only `name`. `phone` is text. `employee_code` is auto-generated by trigger. All other columns are nullable. | **NONE** |
| **Attendance (Full Day, Half Day, Absent)** | **YES (100% Compatible)** | `public.attendance` has `CHECK (status IN ('Present', 'Half Day', 'Absent'))`. Maps directly to `Full Day -> Present`, `Half Day -> Half Day`, `Absent -> Absent`. | **NONE** |
| **Wage Amount = Paid Amount** | **YES (100% Compatible)** | `daily_wages.amount` records the daily wage. Summing `amount` for a week represents total wages paid. No mandatory external payment row required. | **NONE** |
| **Project Creation (Name + Client only)** | **YES (100% Compatible)** | `public.projects` requires `name` and `customer_id`. Auto-resolving client name to `customer_id` satisfies the constraint. All other columns nullable. | **NONE** |
| **Project Procurement (Free-text Product & Supplier)** | **YES (100% Compatible)** | `purchases.supplier_id` and `purchase_items.material_id` are NOT NULL. By auto-resolving or auto-creating records in background, no schema changes are needed. | **NONE** |
| **General Procurement (`project_id = NULL`)** | **YES (100% Compatible)** | `purchases.project_id` column is nullable and has `ON DELETE SET NULL`. Fully supported natively. | **NONE** |
| **Supplier Balances Derived from Purchases** | **YES (100% Compatible)** | `public.v_supplier_balance` view already computes `total_purchases`, `total_allocated_payments`, and `outstanding_balance` dynamically. | **NONE** |

### Verdict on Database Safety
**ZERO DATABASE MIGRATIONS REQUIRED.** The existing database architecture supports 100% of the updated requirements without modifying a single table, column, constraint, or RLS policy.

---

## 14. Required Backend Changes

**None.**
No SQL migrations, no schema modifications, no DDL executions, and no RLS alterations are necessary. All simplifications are achieved through query optimization, auto-resolution wrappers in hooks, and frontend workflow re-architecting.

---

## 15. Proposed Navigation

The application navigation will be streamlined to **4 core operational sections**:

```
┌────────────────────────────────────────────────────────┐
│               SHIVARIVEL SIMPLE ERP                   │
├────────────────────────────────────────────────────────┤
│  1. Customers    (/customers)                          │
│  2. Projects     (/projects)                           │
│  3. Wages        (/wages)                              │
│  4. Procurement  (/procurement)                        │
└────────────────────────────────────────────────────────┘
```

- **Sidebar (Desktop)**:
  - Customers
  - Projects
  - Wages
  - Procurement
- **Mobile Bottom Navigation**:
  - Customers (`/customers`)
  - Projects (`/projects`)
  - Central Quick Add (`+`)
  - Wages (`/wages`)
  - Procurement (`/procurement`)
- **Quick Add (`+`) Actions**:
  1. Add Customer
  2. Add Project
  3. Record Daily Wages
  4. Record Project Purchase
  5. Record General Purchase

---

## 16. Proposed User Workflow

### Concrete End-to-End Walkthrough

1. **Client & Project Setup**:
   - Owner adds client: **Arun Kumar** (Phone: `9840123456`).
   - Owner creates project: **Arun Kumar Residence** (Client: Arun Kumar).
   - Under the hood, Project is linked to Client ID.

2. **Daily Labor & Wage Entry**:
   - Owner navigates to **Wages** on Monday, 5 October 2026.
   - Adds row for **Ravi**:
     - Project: `Arun Kumar Residence`
     - Attendance: `Full Day`
     - Amount Paid: `₹900`
   - Clicks **Save**.
   - Entry appears instantly on Monday's daily log.

3. **Weekly Wages Verification**:
   - Owner switches to **Weekly Wages View** for `5 Oct — 11 Oct`.
   - Sees Ravi:
     - Full Days: `5`
     - Half Days: `1`
     - Absent Days: `1`
     - Projects: `Arun Kumar Residence`, `Kumar Residence`
     - Total Paid: `₹4,950`
   - Weekly grand total across all laborers shows `₹14,200`.

4. **Project Procurement**:
   - Owner opens **Arun Kumar Residence** → **Procurement** tab.
   - Clicks `+ Add Purchase`:
     - Product: `Cement`
     - Supplier: `ABC Traders`
     - Quantity: `20`
     - Unit: `Bags`
     - Total Value: `₹8,000`
     - Amount Paid: `₹5,000`
   - Form automatically calculates:
     - Balance: `₹3,000`
   - Clicks **Save**.
   - Project procurement totals immediately reflect:
     - Total Cost: `₹8,000`
     - Total Paid: `₹5,000`
     - Total Balance: `₹3,000`

5. **General Procurement**:
   - Owner buys bulk tools for the company yard.
   - Opens **Procurement** → **General Procurement**.
   - Enters: Product: `Cutting Wheel`, Supplier: `Hardware Mart`, Total: `₹2,500`, Paid: `₹2,500`, Balance: `₹0`.
   - Unlinked to any project (`project_id = NULL`).

6. **Derived Supplier Overview**:
   - Owner clicks **Supplier Summary** tab in Procurement.
   - Automatically sees:
     - `ABC Traders` → Purchased: `₹8,000` | Paid: `₹5,000` | Outstanding: `₹3,000`.
     - `Hardware Mart` → Purchased: `₹2,500` | Paid: `₹2,500` | Outstanding: `₹0`.
   - Zero vendor master entries were ever manually created.

---

## 17. Phase-by-Phase Implementation Plan

To execute this transition safely without breaking any active functionality, the implementation should follow this sequenced roadmap:

```
┌────────────────────────────────────────────────────────┐
│ Step 1: Labor & Daily Wage Matrix Re-architecture       │
│  - Simplify Labor Registration (Name + Phone)          │
│  - Day-wise multi-laborer wage entry sheet             │
│  - Weekly wage aggregation calculation & view          │
└────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ Step 2: Project Architecture Simplification            │
│  - 2-field Project Creation (Name + Client)            │
│  - Streamline SiteDetailPage into Project Hub          │
└────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ Step 3: Procurement Re-architecture                     │
│  - Transparent free-text product & supplier resolution │
│  - 6-field Project Purchase with auto-balance          │
│  - Dedicated General Procurement (project_id = NULL)   │
│  - Derived Supplier Summary view                       │
│  - Deprecate standalone Materials & Suppliers pages    │
└────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ Step 4: Navigation & Global Shell Unification          │
│  - Update Sidebar & MobileNav to 4 core items          │
│  - Update Quick Add to 5 core actions                  │
│  - Update test suites & regression validation          │
└────────────────────────────────────────────────────────┘
```

---

## 18. Risks & Mitigation Strategies

1. **Risk: Free-Text Supplier / Product Typos Splitting Summaries**
   - *Issue*: A user typing "ABC Trader" on one purchase and "ABC Traders" on another would generate two supplier summary rows.
   - *Mitigation*: Provide lightweight auto-complete suggestions based on previously entered names as the user types, while still permitting free-text entry.
2. **Risk: Breaking Existing Test Suites**
   - *Issue*: The current 1,317 automated tests verify older phase assumptions.
   - *Mitigation*: Keep underlying data hooks backward-compatible; add dedicated tests for the new simplified workflows while preserving core business invariant tests.
3. **Risk: Concurrent Day-Wise Attendance Constraint Violations**
   - *Issue*: The database has a unique constraint on `(company_id, employee_id, attendance_date)`.
   - *Mitigation*: The day-wise wage sheet must perform an upsert (insert or update) so editing an existing entry for that day never throws a duplicate key error.

---

## 19. Final Recommendation

1. **Approve the Plan**: The architecture outlined above achieves 100% of the client's simplicity requirements with **zero database migrations** and zero disruption to underlying relational integrity.
2. **Execute Step 1 (Labor & Wages)** upon user approval, followed systematically by Project simplification, Procurement unification, and Navigation finalization.
3. **Strict Stop**: In accordance with instructions, no application code or database changes have been performed during this planning phase. Awaiting user instruction to proceed.
