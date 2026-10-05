# SHIVARIVEL ERP — UI/UX STRATEGY & PRODUCT REDESIGN SPECIFICATION
**Simple for the User, Logical Underneath**
*Author: Senior Product Designer & Frontend UX Architect*
*Date: 2026-10-04*
*Version: 2.0 (Post-Reset Master Specification)*

---

## 1. Executive Summary

Shivarivel Construction & Interiors operates in Tamil Nadu, India, executing turnkey civil structures, residential villas, commercial interiors, and modular fit-outs. 

Historically, ERP systems built for construction attempt to model corporate general contractor complexity: multi-level work breakdown structures, Gantt charts, complex material issue requisitions, advance loan recovery schedules, and double-entry general ledgers. In practice, the sole decision-maker—**the Business Owner**—operates with a much simpler, immediate mental model:

1. **Who is the customer, and which site are we working on?** (Customers & Projects)
2. **Who worked on site today, were they full/half day, and how much cash/UPI did we pay them?** (Daily Wages)
3. **What was purchased for the site or company yard, from which vendor, how much did it cost, and how much balance is pending?** (Procurement)

This specification establishes the definitive product design, UX architecture, visual language, and interaction model for **Shivarivel Simple ERP**. It translates raw relational database engines into a calm, rapid, touch-friendly, single-user tool that requires **zero training, zero master catalog maintenance, and minimal typing**.

---

## 2. Current Application Audit

A thorough audit of the active codebase across architectural layers reveals the following state:

### 2.1 Strengths to Leverage
- **Design Foundation**: `src/index.css` defines a disciplined, culturally grounded visual palette (Chettinad Terracotta Maroon `#4A0E0E`, Teak Brass `#C99A2E`, Sandstone Limestone `#F7F5F0`, Charcoal `#242424`) with `Plus Jakarta Sans` for titles and `Inter` with `tabular-nums` for numerical data.
- **Robust Database Engine**: 20 frozen PostgreSQL migrations provide rock-solid atomic tables (`customers`, `projects`, `employees`, `attendance`, `daily_wages`, `purchases`, `purchase_items`, `suppliers`, `materials`, `supplier_payments`).
- **Pre-computed Financial Views**: Views such as `v_purchase_balance` and `v_supplier_balance` already derive balances without requiring separate client-side accounting engines.
- **Fast Build & Type Safety**: Vite 8.3 compiles in ~1.2s; TypeScript strict mode is intact across 1,317 tests.

### 2.2 Critical UX Deficiencies in the Current Frontend
- **Master-Catalog Friction**: Phases 02–03 introduced screens forcing the user to create a "Supplier" or "Material" before recording a purchase. In real-world job-site conditions, having to leave a purchase form to create a "Cement" item or "Sri Murugan Steels" vendor creates unacceptable friction.
- **HR/Payroll Over-Engineering**: The previous workforce setup modeled daily wage rates on employee profiles and monthly wage calculation summaries. The client's actual model is day-wise muster: on any given day, the owner pays a laborer based on full/half day work and records the exact amount paid.
- **Visual Clutter & Redundant Containers**: Nested card wrappers (`arch-surface` inside `arch-surface`) and secondary KPI stat cards create visual noise without improving task throughput.
- **Navigation Bloat**: The application shell still references legacy ERP routes (`/estimates`, `/enquiries`, `/attendance`, `/advances`, `/employee-payments`, `/finance`), distracting from the owner's core workflows.

---

## 3. Updated Product Scope

### In-Scope (The Core Four)
The application surface is strictly delimited to four operational domains:
1. **Customers**: Simple client contact register (Name, Phone, City).
2. **Projects**: Central operational job entity (Project Name, Client Name).
3. **Wages**: Day-wise labor muster entry (`Full Day`, `Half Day`, `Absent` + Amount Paid) and dynamic Weekly Wages roll-up.
4. **Procurement**:
   - **Project Procurement**: Purchases tied to a project with free-text Product and Supplier, Qty, Unit, Total Value, Amount Paid, and Balance.
   - **General Procurement**: Bulk purchases unlinked to any project (`project_id = NULL`).
   - **Supplier Summary**: Derived balance ledger generated automatically by aggregating purchase and payment entries.

### Explicitly Out-of-Scope (Prohibited from UI)
- Multi-user authentication, roles, permissions, supervisor logins, worker portals.
- Standalone Supplier Master and Material Catalog management screens.
- HR modules: designations, departments, employee IDs, biometric sync, shifts, leave requests.
- Payroll modules: salary processing, advance recovery schedules, payment vouchers, deductions.
- CRM & Pre-sales: enquiries, site visit logs, quotation builders, estimates.
- Complex Accounting: balance sheets, P&L, profit margins, ROI, EBITDA, invoice tax splitting.
- Project Controls: milestone percentages, Gantt charts, budget variance, daily progress logs.

---

## 4. Product UX Principles

Guided by the **Operate** and **Distill** directives, these six principles govern every layout, button, and interaction:

### Principle 1: The Tool Disappears into the Task
The owner is managing noisy construction sites, dust, labor negotiations, and phone calls. The UI must not demand deliberate study. Standard, earned affordances outrank visual novelty.

### Principle 2: Zero Master-Data Prerequisites
The user never has to "set up" data before using it. To log cement from ABC Traders, they simply type "Cement" and "ABC Traders". The system transparently handles backend relational linking behind the scenes.

### Principle 3: Date-First for Labor, Project-First for Procurement
- When recording labor, the mental model is temporal: *"What happened today (Monday, 5 Oct)?"*
- When recording materials, the mental model is spatial/contractual: *"What was delivered to Arun Residence?"*

### Principle 4: Amount Entered = Amount Paid
No deferred liability accounts or multi-step settlement vouchers for laborers. Recording `₹900` against Ravi for today means `₹900` was paid out.

### Principle 5: Progressive Disclosure over Modals-on-Modals
Modals are reserved for fast transactional entries (e.g. Add Customer, Quick Purchase). Core analytical work (Weekly Wages, Project Breakdown) lives inline on dedicated, full-width views.

### Principle 6: One-Handed Mobile Field Usability
Every primary field action must be executable on a 390px mobile viewport with one hand: large 44px+ touch targets, sticky save buttons, numeric keyboards on money fields, and zero horizontal table scrolling.

---

## 5. Information Architecture & Navigation Strategy

### 5.1 Site Map Hierarchy

```
SHIVARIVEL SIMPLE ERP (Owner Context)
│
├── 1. Customers (/customers)
│   ├── Customer List (Search by name/phone)
│   ├── [+ Add Customer Modal] (Name, Phone, City)
│   └── Customer Detail View (/customers/:id)
│       └── Projects belonging to this customer
│
├── 2. Projects (/projects)
│   ├── Project Directory (Cards/Table with Client Name)
│   ├── [+ Add Project Modal] (Project Name, Client Name)
│   └── Project Hub (/projects/:id)
│       ├── Overview (Client Link, Location)
│       ├── Section A: Project Procurement (Purchases, Paid, Balance, [+ Add Purchase])
│       └── Section B: Labor & Site Wages (Laborers worked, Total Labor Cost)
│
├── 3. Wages (/wages)
│   ├── Sub-View 1: Daily Wage Sheet (Date Picker, Multi-Laborer Table/Cards, [+ Add Laborer])
│   └── Sub-View 2: Weekly Wages Summary (Week Picker, Days Breakdown, Totals per Laborer)
│
└── 4. Procurement (/procurement)
    ├── Tab 1: Project Purchases (Filterable by Project, Shows Balance)
    ├── Tab 2: General Purchases (Unlinked purchases, Shows Balance, [+ Add General Purchase])
    └── Tab 3: Supplier Summary (Derived totals: Purchased, Paid, Outstanding by Vendor)
```

### 5.2 Desktop vs Mobile Shell

| Navigation Component | Desktop (`>= 1024px`) | Mobile (`< 1024px`) |
|---|---|---|
| **Primary Nav** | Left Vertical Sidebar (240px fixed width). Clean icons + text labels for Customers, Projects, Wages, Procurement. | Persistent Bottom Bar (64px height) with 4 navigation tabs + central Quick Add `+` button. |
| **Header** | Top utility bar with Page Title, Active Company badge ("Shivarivel Construction"), and Quick Add button. | Compact top bar with Brand mark and current screen title. |
| **Quick Add** | Header `+` button opens 5-action modal: Customer, Project, Daily Wage, Project Purchase, General Purchase. | Central bottom bar `+` button triggers an ergonomic bottom action sheet. |

---

## 6. User Mental Models & Concrete Workflows

We trace the archetype journey of Owner **Mr. Velusamy** managing client **Arun Kumar** and laborer **Ravi**:

```
[Arun Kumar (Client)]
       │
       ▼
[Arun Kumar Residence (Project)]
       │
       ├─────────────────────────────────────────┐
       ▼                                         ▼
[Daily Labor: 05 Oct 2026]              [Procurement: 05 Oct 2026]
Ravi → Full Day → ₹900 Paid             Cement → ABC Traders → 20 Bags
                                        Total: ₹8,000 | Paid: ₹5,000 | Balance: ₹3,000
       │                                         │
       ▼                                         ▼
[Weekly Wages: 05-11 Oct]               [Supplier Summary]
Ravi: 5 Full, 1 Half, 1 Absent          ABC Traders:
Total Paid: ₹4,950                      Purchased: ₹8,000 | Paid: ₹5,000 | Balance: ₹3,000
```

1. **How the Owner Thinks**:
   - *"I don't care about debit/credit ledgers. I need to know how much cash left my pocket today for labor, and which supplier is going to call me tomorrow asking for their balance."*
2. **Immediate Visibility**:
   - Total labor paid this week.
   - Total supplier balance pending across all sites.
3. **Correction Mental Model**:
   - *"I made a mistake yesterday: Ravi was Half Day, not Full Day."*
   - Change date to yesterday → click on Ravi's row → toggle to Half Day → update amount to ₹450 → Save. Instantly corrected everywhere.

---

## 7. Deep Functional UX Specifications

---

### 7.1 Customer UX (`/customers`)

- **Purpose**: Fast register of property owners/clients.
- **Fields**: Name (`*`), Phone, City/Location.
- **Interactions**:
  - Search bar filters in real time by name or phone.
  - Clicking a customer card displays their linked projects.
  - Adding a customer is possible inline or via modal in under 10 seconds.
- **Anti-Patterns Ban**: No CRM stages (Lead, MQL, SQL), no enquiry intake forms, no email/tax identity requirements.

---

### 7.2 Project UX (`/projects` & `/projects/:id`)

- **Purpose**: The central physical container connecting labor and procurement.
- **Project Creation Form**: Strictly **2 fields**:
  1. `Project Name` (e.g. "Arun Kumar Residence")
  2. `Client Name` (Dropdown with existing clients + instant inline "+ Add New Client" type-in).
- **Project Hub Page Structure**:
  1. **Header Profile**: Project Name, Client Link (clickable to phone customer), Site Address (optional).
  2. **Procurement Card / Section**:
     - Metric Pills: `Total Purchased: ₹85,000` | `Total Paid: ₹60,000` | `Pending Balance: ₹25,000` (highlighted in red/amber if > 0).
     - Table of purchases specifically delivered to this project.
     - `[ + Add Purchase ]` button pre-selecting this project.
  3. **Labor / Wages Section**:
     - Metric Pill: `Total Labor Paid: ₹34,200`.
     - Breakdown per laborer who has worked on this site.
     - `[ + Record Wages ]` quick link.

---

### 7.3 Laborer UX (`/wages` or `/laborers`)

- **Registration Fields**:
  1. `Name` (e.g. "Ravi")
  2. `Phone Number` (e.g. "9876543210")
- **Internal System Assignment**: Automatically issues `EMP-XXXX` code behind the scenes; the user only sees "Ravi".
- **Terminology**: Labeled consistently as **Laborer** or **Worker**, never "Employee / Staff / Resource".

---

### 7.4 Daily Wages UX (`/wages` — Daily Sheet Tab)

This is the highest-frequency operational surface in the ERP.

#### Interaction Pattern
1. **Date Header**: Prominent date selector with quick arrows `[ < ] [ Today: Mon, 05 Oct 2026 ] [ > ]`.
2. **Muster Entry Sheet**:
   - Desktop: Dense, high-speed editable table.
   - Mobile: High-contrast stacked row cards with large segmented pills.
3. **Columns / Fields Per Laborer**:
   - **Laborer**: Name (searchable selector or pre-listed active crew).
   - **Project / Site**: Dropdown of active projects (e.g. "Arun Kumar Residence").
   - **Attendance**: 3-segment toggle button:
     - `Full Day` (Green highlight)
     - `Half Day` (Amber highlight)
     - `Absent` (Neutral/Gray highlight)
   - **Amount Paid (₹)**: Numeric input with bold currency prefix. Default `0` if Absent.
   - **Action**: Fast trash icon to remove row or auto-save on blur.
4. **Instant Action & Feedback**:
   - `[ + Add Laborer Row ]` button adds a blank row below.
   - Sticky bottom bar showing: **Day Total: ₹4,950 (3 Laborers)** with a high-contrast `[ Save Daily Sheet ]` button.
   - On save: instantaneous toast notification *"Saved Monday muster (₹4,950)"*, and sheet stays in view with confirmed checkmarks.

---

### 7.5 Weekly Wages UX (`/wages` — Weekly View Tab)

#### Interaction Pattern
1. **Week Selector**: Date range picker switching weeks (e.g. `[ < ] Week 41: 05 Oct – 11 Oct 2026 [ > ]`).
2. **Weekly Aggregated Matrix**:
   - Table headers:
     `Laborer | Full Days | Half Days | Absent | Projects Worked | Total Paid (₹)`
   - Example row:
     `Ravi | 5 | 1 | 1 | Arun Residence, Kumar Villa | ₹4,950`
     `Mani | 6 | 0 | 1 | Arun Residence | ₹5,100`
3. **Grand Total Bar**:
   - `Grand Total Wages Paid: ₹10,050 across 11 man-days`.
4. **Drilldown**:
   - Clicking a row expands the laborer's 7-day breakdown (Mon–Sun) showing which site they were at on each day.

---

### 7.6 Project Procurement UX

- **Context**: Accessed inside the Project Hub or via the Procurement screen filtered by project.
- **Entry Form (6 Fields Only)**:
  1. `Product / Material`: Free text (e.g. "Ultratech 53 Grade Cement").
  2. `Supplier / Vendor`: Free text (e.g. "ABC Traders").
  3. `Quantity`: Numeric (e.g. `20`).
  4. `Unit`: Dropdown/text (e.g. `Bags`, `Loads`, `Nos`, `Kg`, `Sq.Ft`, `Cu.Ft`, `Tonnes`).
  5. `Total Value (₹)`: Total purchase bill amount (e.g. `8000`).
  6. `Amount Paid (₹)`: Amount handed over in cash or paid via UPI/NEFT (e.g. `5000`).
- **Dynamic Field**:
  - `Balance to Pay`: Auto-computed live as `Total Value - Amount Paid` (e.g. `₹3,000`).
- **Additional Payments**:
  - Clicking `[ Pay Balance ]` on any purchase opens a minimal modal: `Amount Paying Now (₹)` → updates `Amount Paid` and reduces `Balance`.

---

### 7.7 General / Bulk Procurement UX

- **Context**: Tab within `/procurement` for company-wide materials not bought for a specific client site (e.g. warehouse steel rods, safety helmets, scaffolding grease).
- **Behavior**: Same 6 fields as Project Procurement, but **Project is explicitly omitted** (stored with `project_id = NULL`).
- **Summary Cards**:
  - `Total Bulk Purchases: ₹45,000` | `Total Paid: ₹35,000` | `Total Outstanding: ₹10,000`.

---

### 7.8 Supplier Summary UX (Derived Balances)

- **Context**: Dedicated analytical tab in `/procurement`.
- **Purpose**: Answer the owner's recurring question: *"How much money do I owe ABC Traders overall?"*
- **Layout**:
  - List of all distinct suppliers derived from purchase transactions.
  - For each supplier:
    - **Supplier Name** (e.g. "ABC Traders")
    - **Total Purchased**: Sum of all purchases across all sites + bulk.
    - **Total Paid**: Sum of all payments recorded.
    - **Pending Balance**: High-contrast badge (`₹15,000 Pending`).
  - Clicking a supplier row opens an itemized history of all purchases from that supplier and their respective project allocations.

---

## 8. Visual Design Direction & Design System

The visual language follows the **Restrained / Operate** ethos: calm, authoritative, architectural, and completely devoid of generic SaaS decoration.

### 8.1 Palette & Color Tokens

```
Primary Brand / Identity
  --color-maroon:          #4A0E0E  (Deep Chettinad Terracotta: Primary buttons, brand headers, key active states)
  --color-maroon-hover:    #380A0A  (Deepened action hover)
  --color-maroon-light:    #F7EFEF  (Subtle maroon tint for active tab pills)

Accent / Warmth
  --color-gold:            #C99A2E  (Teak brass / architectural gold: Selection indicators, star elements)
  --color-gold-light:      #F9F3E5  (Warm golden highlight background)

Surfaces & Layout
  --color-cream-bg:        #F7F5F0  (Plaster limestone page canvas: Anti-glare, calm)
  --color-card-surface:    #FFFFFF  (Pure white elevated cards)
  --color-border-subtle:   #E2DDD5  (Hairline masonry borders: 1px crisp separation)
  --color-border-strong:   #C5BEB3  (Input active and hover border)

Typography & Neutrals
  --color-charcoal-text:   #242424  (High legibility body text, optical contrast 14.5:1)
  --color-muted-text:      #6B6B6B  (Metadata, units, auxiliary timestamps)

Semantic Financial States
  --color-success:         #166534  (Paid in full / Present attendance)
  --color-success-bg:      #DCFCE7  (Soft pastel green pill)
  --color-warning:         #92400E  (Half day / partial balance pending)
  --color-warning-bg:      #FEF3C7  (Soft pastel amber pill)
  --color-danger:          #991B1B  (Overdue balance / Absent attendance)
  --color-danger-bg:       #FEE2E2  (Soft pastel red pill)
```

### 8.2 Typography Scale
- **Headings**: `Plus Jakarta Sans` (weights: 600 SemiBold, 700 Bold).
  - Page Title: `1.5rem (24px)` — line height 1.25.
  - Section Title: `1.125rem (18px)` — line height 1.35.
- **Body & Controls**: `Inter` (weights: 400 Regular, 500 Medium, 600 SemiBold).
  - Body Text: `0.875rem (14px)` — line height 1.5.
  - Labels & Headers: `0.75rem (12px)` uppercase tracking-wider.
  - Numbers & Currency: `0.875rem` or `1rem` with `font-variant-numeric: tabular-nums`.

### 8.3 Elevation, Radius & Borders
- **Border Radius**: Consistent `0.75rem (12px)` for cards, `0.5rem (8px)` for inputs and buttons, `9999px` for status badges.
- **Borders**: Single 1px hairline border `#E2DDD5` on all cards and tables. Zero border-collapse glitches.
- **Shadows**: Restrained micro-shadows (`box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05)`). No floaty heavy drop shadows.

---

## 9. Screen-by-Screen Detailed UX Specification

---

### Screen 1: Customers Directory (`/customers`)
- **Purpose**: Manage the contact list of clients.
- **Primary Action**: `[ + Add Customer ]` (top right, Maroon button).
- **Secondary Actions**: Real-time Search input (by name or phone).
- **Information Hierarchy**:
  1. Header: "Customers" + Count badge + Add button.
  2. Search bar.
  3. Grid of Customer Cards: Name, Phone (with `tel:` link), City, Count of linked projects.
- **Form Fields (Add/Edit)**:
  - Required: `Customer Name` (min 2 chars).
  - Optional: `Phone Number`, `City / Address`.
  - Must NOT exist: GSTIN, PAN, Email, Credit limits, Billing tags.
- **Mobile Adaptation**: Cards span full width (360px+); phone icon triggers native dialer in 1 tap.
- **Empty State**: Centered card with `Users` icon: *"No customers added yet. Add your first customer to start tracking projects."*

---

### Screen 2: Projects Directory (`/projects`)
- **Purpose**: Primary index of all active construction and interior sites.
- **Primary Action**: `[ + Add Project ]`.
- **Secondary Actions**: Filter by active/completed status (optional toggle).
- **Information Hierarchy**:
  1. Header: "Projects" + Add Project button.
  2. Cards displaying: Project Name (bold uppercase), Client Name (with user icon), Site Location.
  3. Quick summary metrics on card: `Materials: ₹...` | `Labor: ₹...`.
- **Form Fields (Add/Edit)**:
  - Required: `Project Name`, `Client Name` (select from dropdown or type new).
  - Optional: `Site Address / Landmark`.
  - Must NOT exist: Project codes, Start/End dates, Contract values, Supervisor selectors, Milestones, Percent complete.
- **Mobile Adaptation**: Single-column vertical feed. Direct navigation to Project Hub on card tap.

---

### Screen 3: Project Hub (`/projects/:id`)
- **Purpose**: Consolidated view of everything that happened at a specific job site.
- **Primary Action**: `[ + Add Purchase ]` (in Procurement section) and `[ + Record Wages ]` (in Labor section).
- **Information Hierarchy**:
  1. **Site Header**: Project Name, Client Link, Address, Edit button.
  2. **Section A — Project Procurement**:
     - 3 Summary Pills: `Total Purchases` | `Paid` | `Balance to Pay`.
     - List of purchases: Product, Supplier, Qty, Total, Paid, Balance, `[ Pay Balance ]` action.
  3. **Section B — Labor / Site Wages**:
     - Summary Pill: `Total Labor Paid at Site: ₹...`.
     - Roster breakdown: Laborer Name, Days Worked at this site, Total wages earned here.
- **Must NOT exist**: Financial margin cards, profit graphs, change order forms, architect signoff tabs.

---

### Screen 4: Wages — Day-Wise Muster (`/wages`)
- **Purpose**: Record all laborers who worked on a given day.
- **Primary Action**: `[ Save Daily Sheet ]` (sticky button).
- **Secondary Actions**: Date navigation (`Prev Day`, `Next Day`, `Today` shortcut), `[ + Add Laborer ]`.
- **Information Hierarchy**:
  1. Sub-nav tabs: `[ Daily Sheet ]` | `[ Weekly Summary ]`.
  2. Date Selector Banner: Large day title (e.g. *"Monday, 05 Oct 2026"*).
  3. Muster Matrix Table/Cards:
     - Laborer Name selector.
     - Project selector.
     - Attendance pill toggle: `Full Day` | `Half Day` | `Absent`.
     - Amount Paid input (`₹`).
     - Remove row button.
  4. Footer Bar: Total Labor Paid for selected date.
- **Field Constraints**:
  - Default Attendance: `Full Day`.
  - Amount Paid: Must be non-negative numeric.
  - Duplicate Protection: If a laborer is added twice for the same date and site, alert inline and update the existing row rather than crashing with unique constraint error.
- **Mobile Adaptation**: Each laborer renders as an ergonomic card with a 3-way toggle button spanning the width of the card. Numeric keypad auto-opens when tapping Amount.

---

### Screen 5: Wages — Weekly View (`/wages?tab=weekly`)
- **Purpose**: View the weekly payout roll-up per laborer for salary disbursement verification.
- **Primary Action**: Week selector navigation (`Prev Week`, `Next Week`).
- **Information Hierarchy**:
  1. Header with Week Date Range (e.g. *"05 Oct – 11 Oct 2026"*).
  2. Aggregated Summary Table:
     - `Laborer`
     - `Full Days Count`
     - `Half Days Count`
     - `Absent Count`
     - `Projects Worked`
     - `Total Paid (₹)`
  3. Grand Total Summary Row: Total days worked across the company, Total cash paid.
- **Must NOT exist**: Deductions, PF/ESI, overtime rates, bank account transfers, advance recovery ledgers.

---

### Screen 6: Procurement Hub (`/procurement`)
- **Purpose**: Unified procurement command center across project and bulk materials.
- **Navigation Tabs**:
  - `Tab 1: Project Purchases` (grouped or filterable by Project).
  - `Tab 2: General Purchases` (bulk purchases where project is None).
  - `Tab 3: Supplier Summary` (derived balance per vendor).
- **Primary Action**: `[ + Add Purchase ]`.
- **Form Fields (Project & General Purchase)**:
  - `Product / Material`: Free text.
  - `Supplier / Company`: Free text.
  - `Quantity`: Number.
  - `Unit`: Text or dropdown (Bags, Loads, Nos, Sq.Ft).
  - `Total Value (₹)`: Number.
  - `Amount Paid (₹)`: Number.
  - `Balance`: Auto-calculated (`Total - Paid`).
  - `Project`: Pre-selected or optional dropdown (omitted on General Purchase tab).
- **Tab 3 Layout (Supplier Summary)**:
  - Table of Suppliers derived from purchases:
    - Vendor Name
    - Total Purchased (₹)
    - Total Paid (₹)
    - Outstanding Balance (₹)
- **Empty States**: Clear illustrative empty state guiding the owner to log their first material purchase.

---

## 10. Existing UI Audit: Keep, Modify, Hide, or Replace

| File / Component | Current Location | Verdict | Implementation Action Required |
|---|---|---|---|
| `SimpleCustomerModal.tsx` | `src/components/business/` | **KEEP AS-IS** | Perfect 3-field form. Retain unchanged. |
| `CustomersPage.tsx` | `src/pages/customers/` | **KEEP AS-IS** | Clean, fast list. Retain unchanged. |
| `SitesPage.tsx` | `src/pages/projects/` | **MODIFY** | Rename title from "Sites" to "Projects" in UI. Retain core cards. |
| `SimpleSiteModal.tsx` | `src/components/business/` | **MODIFY** | Strip unused metadata inputs; keep Project Name + Client Name. |
| `SiteDetailPage.tsx` | `src/pages/projects/` | **MODIFY** | Redesign as the consolidated Project Hub (Materials + Labor). |
| `SimpleEmployeeModal.tsx` | `src/components/business/` | **MODIFY** | Remove "Default Daily Wage" field. Only Name + Phone. |
| `EmployeesPage.tsx` | `src/pages/workforce/` | **HIDE / COMBINE**| Remove from primary navigation. Laborers are managed directly via Wages. |
| `SimpleDailyWageModal.tsx`| `src/components/business/` | **REPLACE** | Replace single-worker popup with the Day-Wise Multi-Laborer Sheet. |
| `WagesPage.tsx` | `src/pages/workforce/` | **REPLACE** | Replace monthly table with Day-Wise Muster Sheet + Weekly Wages View. |
| `MaterialsPage.tsx` | `src/pages/procurement/` | **REMOVE / HIDE** | Delete from navigation. Product is free text in purchases. |
| `SuppliersPage.tsx` | `src/pages/procurement/` | **REPLACE** | Replace standalone vendor master with Derived Supplier Summary view. |
| `PurchasesPage.tsx` | `src/pages/procurement/` | **MODIFY** | Update to house Project Purchases, General Purchases, and Supplier Summary. |
| `SimplePurchaseModal.tsx` | `src/components/business/` | **REPLACE** | Replace pre-saved selectors with free-text Product & Supplier + auto Balance. |
| `Sidebar.tsx` & `MobileNav`| `src/components/layout/` | **MODIFY** | Simplify navigation items strictly to: Customers, Projects, Wages, Procurement. |
| `QuickAddModal.tsx` | `src/components/quick-add/`| **MODIFY** | Streamline actions to 5 core operations. |

---

## 11. Backend Compatibility & Safe Integration Observations

Our inspection of PostgreSQL migrations `0001` through `0020` confirms:
1. **Zero Schema Alterations**:
   - `employees` allows nullable wage/trade/address.
   - `attendance` check constraint (`Present`, `Half Day`, `Absent`) directly maps to `Full Day`, `Half Day`, `Absent`.
   - `purchases.project_id` is nullable (`ON DELETE SET NULL`), enabling General Procurement out-of-the-box.
   - `v_supplier_balance` already calculates derived vendor balances.
2. **Transparent Auto-Resolution Wrapper**:
   - The frontend procurement hook will transparently resolve free-text supplier and material names by looking up or creating backend records in `suppliers` and `materials`.
   - This satisfies all foreign key constraints (`fk_purchases_supplier_company`, `fk_purchase_items_material_company`) without exposing catalog management to the user.

---

## 12. Accessibility & Mobile Responsive Strategy

### 12.1 Touch & Ergonomics
- All touch targets strictly `>= 44px` height (`h-11` on mobile inputs and primary buttons).
- Segmented control pills (`Full Day | Half Day | Absent`) feature minimum 48px height with immediate tactile state change.
- Safe-area bottom padding (`env(safe-area-inset-bottom)`) prevents mobile navigation overlapping OS home bars.

### 12.2 Accessibility & Color Independence
- WCAG AA contrast ratio `>= 4.5:1` across all typography (Charcoal `#242424` on Cream `#F7F5F0` achieves 14.5:1).
- Financial statuses (Paid, Partial, Overdue) always pair color with text labels and status icons—never color alone.
- Native `input type="number"` and `input type="date"` trigger appropriate mobile keyboards (numeric keypad vs date wheel).

---

## 13. Potential UX Risks & Mitigation

| UX Risk | Severity | Root Cause | Preventive Design Mitigation |
|---|---|---|---|
| **Free-text vendor typos** | Medium | User types "ABC Traders" on one purchase and "ABC Trader" on another. | Implement lightweight auto-complete dropdown showing previously entered supplier names without enforcing a catalog lock. |
| **Fatigue entering 10+ laborers daily** | High | Repetitive manual input on every row. | "Repeat Yesterday's Crew" action that pre-populates active laborers with `Full Day`, allowing the owner to simply tweak amounts. |
| **Accidental duplicate daily wage** | Medium | Adding the same laborer twice for the same site on one day. | Client-side deduplication warning and auto-upsert in backend hook to prevent unique constraint error. |
| **Unsaved daily sheet loss** | High | Owner closes browser or app before hitting save on a 10-person sheet. | Auto-persist draft to `localStorage` until "Save Daily Sheet" is confirmed. |

---

## 14. Final Self-Critique & Verification Checklist

1. **Is this actually simpler than the original ERP?**
   - *Yes*: Reduced from 33 modules to 4 core workflows (Customers, Projects, Wages, Procurement).
2. **Can a non-ERP user understand the navigation?**
   - *Yes*: Navigation contains only plain-English everyday construction terms.
3. **Can someone record 10 laborers for one day quickly?**
   - *Yes*: The Day-Wise Muster Sheet allows selecting workers, toggling Full/Half, typing amount, and batch saving in under 60 seconds.
4. **Can someone correct yesterday's wage entry easily?**
   - *Yes*: Arrow back to yesterday's date, edit the row inline, and save.
5. **Can someone understand weekly wages without knowing payroll?**
   - *Yes*: Simple 5-column table showing days worked and total cash paid. No tax, deductions, or PF.
6. **Can someone add a purchase without registering a supplier or material first?**
   - *Yes*: Product and Supplier are 100% free-text inputs.
7. **Have we accidentally recreated catalog management or payroll?**
   - *No*: Catalogs and payroll remain completely hidden/eliminated.
8. **Does the design work with the existing frozen database?**
   - *Yes*: 100% compliant with existing tables, constraints, and views. Zero migrations required.

---

## 15. Implementation Sequencing Roadmap (Future Phases)

When approved, frontend execution should proceed in 4 tightly bounded steps:

```
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 02: Labor & Daily Wages Matrix                                   │
│  - Simplify laborer modal (Name + Phone)                              │
│  - Implement Day-Wise Muster Sheet with Full/Half/Absent toggles       │
│  - Implement Weekly Wages roll-up view with expandable daily drilldown │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 03: Projects Hub & Customer Streamlining                         │
│  - 2-field Project Creation (Name + Client)                            │
│  - Redesign Project Hub consolidating Site Procurement & Labor wages   │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 04: Unified Procurement Hub                                      │
│  - Free-text Project Purchases with live auto-balance calculation       │
│  - General Procurement view (project_id = NULL)                        │
│  - Derived Supplier Summary balance ledger                             │
│  - Deprecate standalone Materials and Suppliers pages                  │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 05: Navigation Unification & Final UI Polish                     │
│  - Streamline Sidebar & Mobile Bottom Nav to the Core Four             │
│  - Final responsive QA across 360px–1440px viewports                   │
│  - Automated regression test suite validation                          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 16. Strict Stop Confirmation

In strict compliance with instructions:
- **No production code has been modified.**
- **No components have been rewritten.**
- **No database schemas or migrations have been altered.**
- **This phase is strictly research, design specification, and documentation.**
- Execution is halted here pending human review and approval.
