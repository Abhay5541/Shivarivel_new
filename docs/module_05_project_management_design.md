# MODULE 05 — PROJECT MANAGEMENT MODULE DESIGN SPECIFICATION
## Shivarivel Construction & Interiors ERP

---

### Executive Summary & System Philosophy
The **Project Management Module** is the operational and financial core of the **Shivarivel Construction & Interiors** ERP. In civil contracting and interior architecture across Tamil Nadu, a project is not a passive digital database record; it is an active physical construction site where raw materials are received, skilled labor (masons, carpenters, electricians, painters) is mobilized, daily inspections are conducted, customer milestones are billed, and statutory engineering documents are preserved.

This specification establishes a complete, high-fidelity design for the **Project Management Module**, functioning as the **Central Command Center** of the ERP while maintaining absolute fidelity to:
1. **The Master Design Brief & Established Shell Architecture** (Deep Maroon `#4A0E0E`, Warm Construction Gold `#C99A2E`, Warm Cream `#F7F5F0`, Charcoal `#242424`, 1px Architectural Stone Borders `#E2DDD5`).
2. **Rule 18 Non-Netting Standards**: Strict structural bifurcation between **Customer Inflow/Receivables** and **Recorded Project Cost** (Purchases + Earned Wages + Direct Site Expenses). **Zero speculative profit or net margin calculations**.
3. **Field-Engineered Ergonomics**: Designed for bright outdoor Tamil Nadu sunlight, high-dust environments, single-handed 360px mobile viewport operation, touch targets $\ge 44\times 44\text{px}$, and seamless desktop-to-field synchronization.
4. **Installed Design Skill Standards**: Anthropic Frontend Design (hierarchy & composition), UI/UX Pro Max (operational workflows & accessibility), Taste (craft & restraint), Vercel Web Design Guidelines (semantic structure & responsiveness), and Impeccable (rigorous anti-slop audit).

---

## 1. PROJECTS LIST (`/projects`)

### 1.1 Page Header & Controls
- **Page Title**: `Projects` (`Plus Jakarta Sans`, 28px desktop / 22px mobile, Bold, `#242424`).
- **Supporting Description**: *"Manage active construction and interior projects, track on-site execution, and monitor recorded costs."* (`Inter`, 14px, Regular, `#6B6B6B`).
- **Header Actions**:
  - **Primary CTA**: `[+ New Project]` (Height: 40px desktop / 44px mobile, background Deep Maroon `#4A0E0E`, text `#FFFFFF`, border `1px solid #380A0A`, icon `lucide: Plus`, hover background `#380A0A`).
  - **Quick Add Compatibility**: Available globally via Header `[+ Quick Add]` and mobile floating action button (FAB).
  - **View Switcher (Desktop Only)**: Segmented control (`Table View` [Default] | `Card View`), compact 36px height with 1px stone border `#E2DDD5`.

### 1.2 Project Search
- **Search Context**: Full-text instant search matching:
  - Project Reference / Code (e.g., `PRJ-2026-004`)
  - Project Name (e.g., `Er. Senthil Nathan Residence - 3BHK Villa`)
  - Customer Name & Phone (e.g., `Senthil Nathan`, `+91 98421 XXXXX`)
  - Site Location / Landmark (e.g., `Kovaipudur, Coimbatore`)
- **Desktop Search UX**:
  - Container width 320px, height 40px, rounded-md, `1px solid #E2DDD5`, pure white background `#FFFFFF`.
  - Leading search icon (`lucide: Search`, 16px, `#8C8880`).
  - Native placeholder: *"Search by project, customer, or site location..."* (`#8C8880`).
  - **Focused State**: Border transitions to Deep Maroon `#4A0E0E` with `outline: 2px solid rgba(74, 14, 14, 0.15)`.
  - **Clear State**: Trailing cross button (`lucide: X`, 16px, `#6B6B6B`) appears when input has value. Keyboard shortcut: `Esc` clears search.
- **Mobile Search UX**:
  - Prominent full-width search input above filter pills with sticky behavior during scroll.
  - Dedicated search clear button with $44\times 44\text{px}$ touch target.
- **No-Results State**:
  - In-line table banner: *"No projects matching '{query}'"*. Displays a quick button: `[Clear Search]`.

### 1.3 Project Filters
- **Filter Categories**:
  1. **Project Status**: `All (14)`, `Active (8)`, `Planning (2)`, `Completed (3)`, `On Hold (1)`, `Archived (0)`.
  2. **Customer**: Searchable customer dropdown selector.
  3. **Date Range / Timeline**: `All Time`, `This Month`, `Active This Quarter`, `Custom Date Range`.
- **Desktop Filter Pattern**:
  - Inline horizontal pill tabs for status with numeric count badges (`bg-stone-100 text-stone-700` unselected; `bg-[#F9F3E5] text-[#4A0E0E] font-semibold border border-[#C99A2E]` active).
  - Filter row toolbar containing Customer and Date dropdowns with active filter counters.
- **Mobile Filter Pattern**:
  - Top scrollable status pill strip (`overflow-x-auto no-scrollbar py-2`).
  - Dedicated `[Filters]` button displaying active badge count `(2)` that triggers a native **Filter Bottom Sheet** (`max-h-[80vh]`, slide-up, sticky footer with `[Reset Filters]` and `[Apply Filters]`).

---

### 1.4 Desktop Projects Table
Designed for high scannability, dense data review, and zero horizontal overflow on standard $1280\text{px}+$ viewports.

```
+---------------+-----------------------------+-------------------+----------+-------------+----------------+----------------+----------------+---------+
| Project ID    | Project & Site              | Customer          | Status   | Progress    | Contract Val   | Received (In)  | Cost Recorded  | Actions |
+---------------+-----------------------------+-------------------+----------+-------------+----------------+----------------+----------------+---------+
| PRJ-2026-004  | Er. Senthil Nathan Villa    | Senthil Nathan    | Active   | [==== 42%]  | ₹48,50,000.00  | ₹20,00,000.00  | ₹14,20,000.00  |  [...]  |
|               | Kovaipudur, Coimbatore      | +91 98421 11223   |          | Substructure| Due: ₹28.50 L  | Verified Bank  | Purchases+Wages|         |
+---------------+-----------------------------+-------------------+----------+-------------+----------------+----------------+----------------+---------+
```

#### Table Columns & Alignment Hierarchy:
1. **Project Reference**: `JetBrains Mono`, 13px, Medium, `#4A0E0E`. Hover reveals link to `/projects/:id`.
2. **Project & Site**:
   - Line 1: Project Name (`Plus Jakarta Sans`, 14px, SemiBold, `#242424`).
   - Line 2: Site Location (`Inter`, 12px, Regular, `#6B6B6B`, e.g., *"Kovaipudur, Coimbatore"*).
3. **Customer**:
   - Customer Name (`Inter`, 14px, Medium, `#242424`) with clickable link to `/customers/:id`.
   - Contact phone (`Inter`, 12px, Regular, `#8C8880`).
4. **Status**: Restrained semantic pill badge:
   - `Active`: Emerald dot + `#EAF5EE` background + `#1E6B37` text.
   - `Planning`: Amber dot + `#FEF5E7` background + `#B86E00` text.
   - `Completed`: Teal dot + `#E6F4F2` background + `#115E59` text.
   - `On Hold`: Slate dot + `#F1F3F5` background + `#55595D` text.
5. **Physical Progress**:
   - Progress bar (Height: 6px, rounded-full, background `#EFECE6`, active fill Warm Gold `#C99A2E`).
   - Readout: Bold percentage (e.g., `42%`) + current milestone stage (e.g., `Substructure / Plinth Beam`).
6. **Contract Value**: Right-aligned, `Inter` (tabular numbers), 14px, SemiBold, `#242424`, Indian formatted (e.g., `₹48,50,000.00`).
7. **Customer Received**: Right-aligned, `Inter` (tabular numbers), 14px, SemiBold, `#1E6B37` (Emerald), with secondary line showing Outstanding Due (`Due: ₹28,50,000.00` in muted crimson `#9E2A2B`).
8. **Recorded Project Cost**: Right-aligned, `Inter` (tabular numbers), 14px, Medium, `#242424` (Neutral Charcoal). **Strictly zero profit shown**. Secondary label: *"Purchases + Labor + Direct"*.
9. **Row Actions**: Contextual button menu `[...]` (`lucide: MoreVertical`, 18px):
   - `Open Command Center` (`/projects/:id`)
   - `+ Add Daily Site Report` (Opens modal prefilled with project)
   - `+ Record Purchase Voucher` (Opens purchase drawer)
   - `+ Record Customer Milestone Receipt` (Opens payment drawer)
   - `View Customer Profile` (`/customers/:id`)

#### Table States:
- **Hover**: Background subtle tint `#FAFAF7`, row border remains `#E2DDD5`.
- **Loading**: 6 skeleton rows with shimmering text blocks and progress tracks.
- **Pagination**: Compact bottom footer: *"Showing 1–8 of 14 projects"*, Previous/Next button group with 1px stone borders.
- **Empty**: Centered architectural illustration + *"No active projects found"* + `[+ Create New Project]`.
- **Error**: Inline banner with retry button: *"Unable to retrieve projects ledger. [Retry Connection]"*.

---

### 1.5 Mobile Project Cards (`< 768px`)
On mobile devices (360px–430px), data tables are completely retired in favor of high-touch, structured operational cards.

#### Mobile Card Layout Structure:
```
+-----------------------------------------------------------+
| PRJ-2026-004                        [● Active]            |
| Er. Senthil Nathan Residence - 3BHK Villa                 |
| Senthil Nathan • Kovaipudur, Coimbatore                   |
|-----------------------------------------------------------|
| Physical Progress: 42% (Plinth Beam Level)               |
| [========================>                               ]|
|-----------------------------------------------------------|
| Contract Value      | Received          | Recorded Cost   |
| ₹48,50,000.00       | ₹20,00,000.00     | ₹14,20,000.00   |
|                     | Due: ₹28.50 L     | Non-Netted      |
|-----------------------------------------------------------|
| [View Command Center >]               [+ Daily Report]   |
+-----------------------------------------------------------+
```
- **Touch Target**: Entire card body is tapped to navigate to `/projects/:id`.
- **Secondary Action Button**: Quick `[+ Daily Report]` button directly on the card allows on-site supervisors to log progress in 1 tap without navigating through desktop sub-menus.
- **Typography & Spacing**: Strict 16px internal padding, 12px vertical card gap, 1px `#E2DDD5` border, pure white background.

---

## 2. NEW PROJECT EXPERIENCE (`/projects/new` or Slide-Over Drawer)

### 2.1 Creation Architecture & Field Structure
The New Project experience is designed to feel like registering an actual construction site, rather than saving a database row.

```
+---------------------------------------------------------------------------------------+
| NEW PROJECT REGISTRATION                                              [Close / Esc]  |
| Register a new contracted civil construction or interior site                         |
|=======================================================================================|
| SECTION A: CUSTOMER IDENTIFICATION                                                    |
| Customer Selector: [ Search or Select Customer...                        ▼ ] [ + New ]|
| Selected Client: Er. Senthil Nathan | +91 98421 11223 | Kovaipudur, Coimbatore        |
|---------------------------------------------------------------------------------------|
| SECTION B: PROJECT IDENTITY & WORK SCOPE                                              |
| Project Name: [ Er. Senthil Nathan Residence - 3BHK Villa                           ] |
| Project Code: [ PRJ-2026-004 ] (System Generated Monospace)                           |
| Work Category: [x] Civil Contracting  [x] Interior Work  [ ] 3D Elevation             |
| Site Address: [ Plot 18, Sri Krishna Nagar, Kovaipudur, Coimbatore - 641042        ] |
|---------------------------------------------------------------------------------------|
| SECTION C: TIMELINE & COMMERCIAL FOUNDATION                                           |
| Start Date: [ 15/10/2026 ]        Expected Handover Date: [ 30/06/2027 ]              |
| Contract Value (₹): [ ₹48,50,000.00 ]                                                 |
| Linked Estimate: [ EST-2026-009: Villa BOQ Quotation (Accepted)         ▼ ]           |
|---------------------------------------------------------------------------------------|
| SECTION D: OPERATIONAL ASSIGNMENTS                                                    |
| Site Supervisor / Engineer: [ Er. M. Suresh (Senior Engineer)            ▼ ]          |
| Initial Project Status:     [ Active                                     ▼ ]          |
| Scope Notes & Remarks:      [ Ground + 1 Floor RCC framed structure...             ] |
|=======================================================================================|
| [Discard]                                           [Save as Draft] [Create Project]  |
+---------------------------------------------------------------------------------------+
```

### 2.2 Customer Selection UX
- **Autocomplete Dropdown**: Search by customer name, phone number, or company.
- **Immediate Detail Card**: Upon selection, a compact preview card appears with:
  - Customer Full Name & Code (`CUST-0024`)
  - Primary Contact Number with WhatsApp link
  - Default Billing Address
- **Action Affordance**: `[Change Customer]` text link allows single-click clearing without clearing other form inputs.
- **New Customer Quick-Create**: Secondary button `[+ New Customer]` opens an overlay modal allowing registration of client contact details without leaving the project creation flow.

### 2.3 Field Specification & Terminology
- **System Generated**: `Project Code` (read-only monospace badge, e.g., `PRJ-2026-004`).
- **Required Fields**:
  - `Customer ID`
  - `Project Name` (e.g., *"Arun Kumar Commercial Complex"* or *"Priya Residence Interior"*)
  - `Site Address` (Location where physical delivery occurs)
  - `Start Date` (Contract commencement)
  - `Contract Value` (Gross agreed contract sum in INR)
- **Optional Fields**:
  - `Linked Estimate ID` (Allows pre-filling contract value and BOQ line items)
  - `Expected Completion Date`
  - `Assigned Site Supervisor`
  - `Scope Notes & Special Client Conditions`

### 2.4 Date Validation UX
- **Temporal Integrity Rule**: Expected Completion Date **must never be earlier** than Start Date.
- **UX Feedback**: If an invalid end date is chosen, the date field turns to Brick Crimson border (`#9E2A2B`), with an immediate inline message: *"Expected handover date cannot precede project commencement date (15/10/2026)"*. The primary submit button is disabled until corrected.

### 2.5 Save & Form Submission States
- **Normal State**: `[Create Project]` (Deep Maroon `#4A0E0E`, text `#FFFFFF`).
- **Saving / In-Flight**: Button shows spinning loader (`lucide: Loader2`), text changes to *"Registering Site & Setting Up Ledger..."*, all form fields disabled to prevent double-submission.
- **Validation Failure**: The form scrolls smoothly to the first erroneous field with an alert summary banner at the top.
- **Unsaved Changes Shield**: If the user attempts to close the drawer/modal with dirty inputs, a standard prompt appears: *"Discard unsaved project? All entered information will be lost."* (`[Keep Editing]` | `[Discard]`).
- **Mobile Sticky Action Bar**: Bottom action bar remains anchored at viewport base (`bottom-0 bg-white border-t border-[#E2DDD5] p-3 shadow-lg`).

---

## 3. PROJECT DETAIL: THE ERP COMMAND CENTER (`/projects/:id`)

The Project Detail page is the **most critical operational surface in the entire ERP**. It consolidates engineering, commercial, procurement, workforce, and field activity into one cohesive view.

```
+-------------------------------------------------------------------------------------------------------+
| [<- Back to Projects]      PRJ-2026-004                          [● Active]    [+ Quick Add ▼] [Edit] |
| Er. Senthil Nathan Residence - 3BHK Villa                                                             |
| Senthil Nathan | Plot 18, Sri Krishna Nagar, Kovaipudur, Coimbatore | Supervisor: Er. M. Suresh        |
|=======================================================================================================|
| [ Overview ]  [ Work Progress ]  [ Finance ]  [ Purchases ]  [ Workforce ]  [ Daily Reports ]  [ Docs ]|
|=======================================================================================================|
|                                                                                                       |
| [Active Tab Content Renders Below with Zero Page Refresh]                                             |
|                                                                                                       |
+-------------------------------------------------------------------------------------------------------+
```

### 3.1 Project Detail Header
- **Breadcrumb & Navigation**: `[<- Projects]` link (`#6B6B6B` text, hover `#242424`).
- **Project Identity**:
  - Main Title: `Er. Senthil Nathan Residence - 3BHK Villa` (24px `Plus Jakarta Sans`, Bold, `#242424`).
  - Monospace Ref Code: `PRJ-2026-004` (in soft stone badge `#EFECE6`).
  - Status Indicator: `● Active` (6px pulsing emerald dot inside `#EAF5EE` pill).
- **Metadata Ribbon**:
  - Customer: `Senthil Nathan` (Clickable link with external link icon).
  - Location: `Plot 18, Sri Krishna Nagar, Kovaipudur, Coimbatore`.
  - Supervisor: `Er. M. Suresh (Site Engineer)`.
- **Primary Actions**:
  - `[+ Quick Add ▼]`: Dropdown containing:
    - *Add Daily Site Report*
    - *Add Material Purchase*
    - *Record Customer Payment*
    - *Log Direct Site Expense*
    - *Upload Document / Plan*
  - `[Edit Project]`: Ghost button with pencil icon, opens edit drawer.
  - `[Print / Share Summary]`: Opens clean print layout.

### 3.2 The 7 Core Operational Tabs
The tab bar uses an architectural horizontal rail. Active tab is highlighted with Deep Maroon text (`#4A0E0E`) and a solid 2px Warm Construction Gold (`#C99A2E`) underline indicator with soft gold background tint (`#F9F3E5`).

```
1. Overview         -> Executive 10-second site pulse & recent activity
2. Work Progress    -> Physical milestone tracker & trade execution stages
3. Finance          -> Rule 18 non-netting financial cockpit (NO PROFIT)
4. Purchases        -> Material procurement invoices & delivery tracking
5. Workforce        -> Site labor allocation, attendance muster & wages
6. Daily Reports    -> Supervisor daily logs, weather & on-site photos
7. Documents        -> 11-category blueprint & statutory approval vault
```

---

## 4. TAB 1: PROJECT OVERVIEW

### 4.1 Purpose & Layout
The Overview tab is not a duplicate of other tabs; it is an executive operational cockpit that lets the business owner evaluate project health within 10 seconds.

```
+-------------------------------------------------------------------------------------------------------+
| PHYSICAL PROGRESS                               | FINANCIAL PULSE (Rule 18 Non-Netted)                 |
| Stage: Substructure (Plinth Beam Level)         | Contract Value:     ₹48,50,000.00                    |
| Progress: 42% Complete                          | Customer Received:  ₹20,00,000.00 (Due: ₹28.50 L)    |
| [=====================>                       ] | Recorded Site Cost: ₹14,20,000.00 (Zero Profit Shown)|
| Next Milestone: Column Raising (Due: 18 Oct)   | [View Full Financial Ledger >]                       |
|-------------------------------------------------+-----------------------------------------------------|
| ACTIVE SITE ATTENTION & ALERTS (2)              | TODAY'S SITE WORKFORCE                              |
| [!] Steel stock low on site (TMT 16mm < 0.5 T)  | 14 Workers On-Site Today:                            |
| [!] Customer Milestone 2 payment due (₹5,00,000)| 4 Masons, 6 Helpers, 2 Carpenters, 2 Bar Benders    |
|-------------------------------------------------+-----------------------------------------------------|
| LATEST DAILY SITE REPORT (Yesterday, 30 Sep)   | RECENT SITE PHOTOS (4)                               |
| "Completed plinth beam shuttering and pouring   | [ Photo 1 ]  [ Photo 2 ]  [ Photo 3 ]  [ Photo 4 ]    |
| concrete grade M25. 14 laborers on site."       | Concrete Pouring | Shuttering Check | Beam Level     |
| Filed by: Er. M. Suresh at 06:45 PM             | [View All 18 Reports & 46 Photos >]                 |
+-------------------------------------------------------------------------------------------------------+
```

### 4.2 Progress Summary Card
- **Progress Gauge**: Linear progress bar with 8px height, rounded corners, Warm Gold `#C99A2E` fill.
- **Stage Label**: High-contrast indicator displaying the current civil/interior phase (e.g., *"Substructure / Plinth Beam"*).
- **Target Dates**: Commencement Date (`15/10/2026`) vs Scheduled Handover (`30/06/2027`) with days remaining counter (`273 days remaining`).

### 4.3 Contextual Alerts Card
Only legitimate, operationally actionable construction triggers appear here:
- **Financial Alerts**: *"Milestone 2 payment overdue by 4 days (₹5,00,000.00)"*.
- **Procurement Alerts**: *"Pending delivery: 200 Bags Zuari Cement expected today"*.
- **Quality / Inspection Alerts**: *"Structural engineer inspection required before slab pouring"*.

---

## 5. TAB 2: WORK PROGRESS & MILESTONES

### 5.1 Construction Stage Structure
Civil contracting and interior works follow standardized sequential trade stages. The Work Progress tab structures site execution without cumbersome, fragile Gantt charts:

```
+-------------------------------------------------------------------------------------------------------+
| WORK PROGRESS BREAKDOWN                                                [ + Add Milestone / Stage ]     |
| Track physical execution against contract milestones                                                  |
|=======================================================================================================|
| [v] STAGE 1: SUBSTRUCTURE & FOUNDATION                                              [ 100% Complete ] |
|     - Earthwork Excavation & PCC 1:4:8                              [ Verified | 24/09/2026 ]         |
|     - Column Footing & Stub Columns                                 [ Verified | 28/09/2026 ]         |
|     - Plinth Beam Concreting                                        [ Verified | 30/09/2026 ]         |
|-------------------------------------------------------------------------------------------------------|
| [v] STAGE 2: SUPERSTRUCTURE & RCC FRAMED STRUCTURE                                 [ 35% In Progress ]|
|     - Ground Floor Column Casting (12 Nos)                          [ 100% Done | 01/10/2026 ]        |
|     - Brickwork / Solid Block Masonry (Ground Floor)                [ 30% In Progress ]              |
|     - First Floor Roof Slab Shuttering & Steel Reinforcement        [ Scheduled for 12/10/2026 ]      |
|-------------------------------------------------------------------------------------------------------|
| [>] STAGE 3: PLASTERING & ELECTRICAL/PLUMBING CONDUITING                            [ Not Started ]   |
|-------------------------------------------------------------------------------------------------------|
| [>] STAGE 4: INTERIOR WORKS, FALSE CEILING & FLOORING                               [ Not Started ]   |
|-------------------------------------------------------------------------------------------------------|
| [>] STAGE 5: PAINTING, ELEVATION FINISHING & HANDOVER                               [ Not Started ]   |
+-------------------------------------------------------------------------------------------------------+
```

### 5.2 Milestone Verification Interaction
- **Verification Workflow**:
  - Site supervisors or engineers mark work as complete.
  - Verification dialog requires:
    1. Completion Date
    2. Verification Notes (e.g., *"Concrete cube test result verified at 28 days - 26.5 N/mm²"*)
    3. Mandatory Supporting Photo attachment from site.
- **Visual Hierarchy**: Completed items display a dark emerald checkmark badge (`#1E6B37`), in-progress stages show Warm Gold active progress stripes, and upcoming items are displayed in soft muted stone `#8C8880`.

---

## 6. TAB 3: PROJECT FINANCE (STRICT NON-NETTING & ZERO PROFIT)

### 6.1 The Non-Netting Mandate (Rule 18)
In strict accordance with the core accounting integrity rules of the Shivarivel ERP:
- **Never Net Inflows Against Costs**: Customer receipts are NEVER netted against contractor supplier payables or wages.
- **Never Display Speculative Profit**: Construction margins cannot be calculated mid-project because unliquidated supplier bills, retention money, and labor settlements remain unsettled. Showing a speculative "Profit: ₹5,80,000" gives a dangerously false picture of liquidity.
- **Explicit Bifurcation**: Screen is strictly partitioned into **CUSTOMER SIDE (Receivables)** and **COST SIDE (Liabilities & Expenses)**.

```
+-------------------------------------------------------------------------------------------------------+
| PROJECT FINANCIAL COCKPIT (Strict Non-Netting Standard)                                                |
| Cumulative commercial position. Figures represent verified financial vouchers. Zero speculative profit|
|=======================================================================================================|
| CUSTOMER COMMERCIAL POSITION (INFLOW SIDE)                                                            |
| +-----------------------------------+-----------------------------------+-----------------------------+
| | Total Agreed Contract Value       | Total Customer Collections        | Uncollected Customer Balance|
| | ₹48,50,000.00                     | ₹20,00,000.00                     | ₹28,50,000.00               |
| | Base BOQ + Approved Additions     | Verified Bank Receipts (3)        | Pending Client Dues         |
| +-----------------------------------+-----------------------------------+-----------------------------+
|                                                                                                       |
| RECORDED PROJECT COSTS (OUTFLOW & LIABILITY SIDE)                                                     |
| +-----------------------------------+-----------------------------------+-----------------------------+
| | Material Purchases Incurred       | Site Labor Wages Incurred         | Direct Site Expenses        |
| | ₹9,40,000.00                      | ₹3,80,000.00                      | ₹1,00,000.00                |
| | 12 Vendor Invoices                | Cumulative Daily Muster Wages     | Fuel, Machinery, Approvals  |
| +-----------------------------------+-----------------------------------+-----------------------------+
| | TOTAL RECORDED PROJECT COST (Purchases + Labor + Direct Expenses):   ₹14,20,000.00                  |
| +-----------------------------------------------------------------------------------------------------+
|                                                                                                       |
| LEDGER DRILL-DOWNS & STATEMENTS                                                                       |
| [View Customer Payment Receipts (3) >]          [View Detailed Material Purchase Ledger (12) >]       |
| [View Site Wage Muster History >]               [View Petty Cash & Direct Expense Vouchers (7) >]     |
+-------------------------------------------------------------------------------------------------------+
```

### 6.2 Financial Visual Language & Precision
- **Currency Format**: Strict Indian numbering system with two decimal places (`₹48,50,000.00`), using `tnum` (tabular numbers) to ensure vertical digit alignment.
- **Color Discipline**:
  - Inflows / Verified Receipts: Deep Emerald Forest (`#1E6B37` text on `#EAF5EE`).
  - Customer Outstanding Due: Brick Crimson (`#9E2A2B` text on `#FCEEEE`).
  - Recorded Project Costs: Authoritative Neutral Charcoal (`#242424`).
- **Audit Integrity Tooltip**: Every financial card has an information tooltip icon (`lucide: Info`, 14px): *"In accordance with construction accounting standards, speculative profit is withheld until project commissioning and final retention release."*

---

## 7. TAB 4: PROJECT PURCHASES (PROCUREMENT & MATERIALS)

### 7.1 Scope & Hierarchy
Provides complete visibility into all materials ordered, delivered, and billed for this specific site, avoiding the need to search the global procurement directory.

```
+-------------------------------------------------------------------------------------------------------+
| PROJECT MATERIAL PURCHASES                                              [ + Record Purchase Voucher ] |
| Total Purchases Incurred for this Site: ₹9,40,000.00 across 12 invoices                               |
|=======================================================================================================|
| Voucher Ref  | Date       | Supplier Name         | Items / Materials          | Total (₹)     | Status   |
|--------------+------------+-----------------------+----------------------------+---------------+----------|
| PUR-2026-081 | 01/10/2026 | Sri Lakshmi Steels    | 16mm & 12mm TMT Bars (3.5T)| ₹2,45,000.00  | Paid     |
| PUR-2026-074 | 28/09/2026 | Zuari Cements Agency  | 200 Bags Zuari OPC 53 Gr.  | ₹84,000.00    | Unpaid   |
| PUR-2026-068 | 25/09/2026 | Kovai Blue Metal Sand | M-Sand 2 Units, Coarse Agg | ₹38,500.00    | Paid     |
| PUR-2026-062 | 20/09/2026 | National Brick Works  | 10,000 Wire Cut Bricks     | ₹92,000.00    | Partial  |
+-------------------------------------------------------------------------------------------------------+
```

### 7.2 Voucher Row Interaction
- Clicking any row navigates directly to `/purchases/:id` (in Module 06).
- Unpaid vouchers display a subtle warning tag (`[Unpaid - ₹84,000.00]`).
- Quick filter tabs: `All Purchases`, `Steel & Cement`, `Aggregates & Sand`, `Electrical & Plumbing`, `Finishes`.

---

## 8. TAB 5: PROJECT WORKFORCE & SITE LABOR

### 8.1 On-Site Labor Allocation
Presents workforce deployment specifically dedicated to this site, linking directly to the Daily Muster and Wage Ledgers (Module 07).

```
+-------------------------------------------------------------------------------------------------------+
| PROJECT WORKFORCE & SITE ATTENDANCE                                     [ Fast Muster Attendance ]    |
| Today's On-Site Headcount: 14 Workers | Cumulative Labor Cost: ₹3,80,000.00                           |
|=======================================================================================================|
| Worker Name        | Trade / Skill           | Daily Rate  | Days on Site | Cumulative Earned Wages   |
|--------------------+-------------------------+-------------+--------------+---------------------------|
| Karuppasamy M.     | Head Mason              | ₹950.00/day | 28 Days      | ₹26,600.00                |
| Murugesan P.       | Mason (Brickwork)       | ₹850.00/day | 26 Days      | ₹22,100.00                |
| Selvam R.          | Bar Bender / Steel Mech | ₹800.00/day | 18 Days      | ₹14,400.00                |
| Arumugam K.        | Civil Helper            | ₹600.00/day | 28 Days      | ₹16,800.00                |
| Thangavel S.       | Civil Helper            | ₹600.00/day | 27 Days      | ₹16,200.00                |
+-------------------------------------------------------------------------------------------------------+
```
- **Contextual Action**: Clicking `[Fast Muster Attendance]` opens the 60-second site attendance sheet pre-filtered to workers assigned to this site.
- **Non-Netting Enforcement**: Displays earned wages strictly as an incurred cost item; worker advance loans are managed in the dedicated Workforce module.

---

## 9. TAB 6: DAILY SITE REPORTS & FIELD LOGS

### 9.1 The Daily Site Report Architecture
Daily reports bridge the physical construction site and the central office. They must be submitted every evening by the site engineer or supervisor.

```
+-------------------------------------------------------------------------------------------------------+
| DAILY SITE PROGRESS REPORTS                                            [ + File Today's Report ]      |
| Complete chronological log of site activities, weather, labor muster, and high-resolution photos      |
|=======================================================================================================|
| Date        | Filed By        | Work Completed Summary               | Labor | Photos | Status        |
|-------------+-----------------+--------------------------------------+-------+--------+---------------|
| 01/10/2026  | Er. M. Suresh   | Plinth beam concrete curing started. | 14    | 4      | [Verified]    |
| 30/09/2026  | Er. M. Suresh   | Concrete pouring M25 for plinth beam | 14    | 6      | [Verified]    |
| 29/09/2026  | Er. M. Suresh   | Shuttering alignment and reinforcement| 12    | 3      | [Verified]    |
| 28/09/2026  | Er. M. Suresh   | Column footing backfilling & watering| 10    | 2      | [Verified]    |
+-------------------------------------------------------------------------------------------------------+
```

### 9.2 Daily Report Detail View (`/daily-reports/:id` or Modal)
When an individual report row is clicked, it opens a clean, document-grade report sheet:
1. **Header**: Report Date (`Thursday, 1 Oct 2026`), Project Name, Weather (`Sunny, 32°C`), Supervisor Name.
2. **Work Executed Today**: Structured narrative of tasks completed (e.g., *"Completed plinth beam casting using RMC grade M25. Total concrete poured: 18 m³. Curing lines established."*).
3. **Materials Consumed Today**: Quantities recorded on-site (e.g., *18 m³ Ready Mix Concrete, 2 bags OPC for slurry*).
4. **Site Observations & Issues**: Notes on inspections, client visits, or pending approvals.
5. **Labor Deployment**: Breakdown by trade (Masons: 4, Helpers: 6, Steel: 2, Carpenters: 2).
6. **High-Resolution Site Photo Gallery**: Crisp 3:2 aspect-ratio photo grid with visual zoom/lightbox.

---

### 9.3 New Daily Report Experience (Outdoor Field-Optimized)
Engineered for use directly on an active construction site using a mobile smartphone with glare, dust, and intermittent 4G connectivity:

```
+-------------------------------------------------------------------+
| NEW DAILY SITE REPORT                               [Close / X]   |
| Project: PRJ-2026-004 (Senthil Nathan Residence)                  |
| Date: [ 01/10/2026 (Today) ]          Weather: [ Clear / Sunny ▼ ]|
|===================================================================|
| WORK EXECUTED TODAY *                                             |
| [ Describe work completed on site today...                      ] |
| [ Voice-to-Text Button / Dictation Support                      ] |
|-------------------------------------------------------------------|
| SITE PHOTOS (Camera / Gallery) *                                  |
| +-------------------+  +-------------------+  +-----------------+ |
| | [ Photo 1 ]   (x) |  | [ Photo 2 ]   (x) |  | [ + Take Photo] | |
| | Beam Shuttering   |  | Concrete Pouring  |  | Camera / Device | |
| +-------------------+  +-------------------+  +-----------------+ |
|-------------------------------------------------------------------|
| ON-SITE HEADCOUNT *                                               |
| Masons: [ 4 ]  Helpers: [ 6 ]  Carpenters: [ 2 ]  Bar Benders: [ 2]|
| Total Workers: 14                                                 |
|-------------------------------------------------------------------|
| REMARKS & SITE ISSUES (Optional)                                  |
| [ E.g., Electricity outage between 11 AM - 1 PM. Tanker ordered. ] |
|===================================================================|
| [Sticky Bottom Save Button: SUBMIT DAILY REPORT (Offline Safe)   ]|
+-------------------------------------------------------------------+
```

#### Field-Specific Interactions:
- **Camera Access First**: Direct HTML5 capture trigger (`accept="image/*" capture="environment"`), allowing one-tap camera launch on Android and iOS.
- **Image Compression Before Upload**: Automatic client-side compression (resizing max dimension to 1920px at 80% JPEG quality) reducing 8MB raw photos to ~450KB for fast field transmission.
- **Offline Draft Preservation**: Unsubmitted reports are preserved in browser `IndexedDB/localStorage` so spotty site internet does not discard entered field observations.

---

## 10. TAB 7: PROJECT DOCUMENTS & BLUEPRINT VAULT

### 10.1 The 11 Supported Document Categories
In construction management, losing approved blueprints or signed agreements causes severe financial and legal disputes. The ERP organizes documents into **11 strict architectural categories**:

```
1. Building Plan         -> Statutory municipality approval drawings, floor plans
2. 3D Plan               -> 3D architectural floor layouts & furniture positioning
3. 3D Elevation          -> Exterior facade renderings, lighting & texture models
4. Approval Document     -> DTCP, CMDA, Panchayat, or Town Planning sanctions
5. Estimate              -> Signed BOQ quotation, rate schedules, revisions
6. Agreement             -> Registered construction contract, legal agreements
7. Invoice               -> Material vendor invoices, contractor RA bills
8. Receipt               -> Customer milestone bank payment receipts
9. Payment Proof         -> NEFT/RTGS transaction screenshots, bank slips
10. Site Photo           -> Stage milestone verification photos, drone surveys
11. Other                -> Soil test reports, structural engineer certificates
```

### 10.2 Document Grid & Preview Interface
```
+-------------------------------------------------------------------------------------------------------+
| PROJECT DOCUMENT REPOSITORY                                             [ + Upload Document ]         |
| Filter by Category: [ All (14) ] [ Building Plans (3) ] [ 3D Elevation (2) ] [ Approvals (1) ]        |
|=======================================================================================================|
| +-----------------------------+  +-----------------------------+  +-----------------------------+     |
| | [ PDF Preview Thumbnail ]   |  | [ Image Render Thumbnail ]  |  | [ PDF Preview Thumbnail ]   |     |
| | Category: Building Plan     |  | Category: 3D Elevation      |  | Category: Approval Document |     |
| | Structural_Staad_Model.pdf  |  | Facade_Evening_View_v3.jpg  |  | CMDA_Building_Sanction.pdf  |     |
| | 4.8 MB • Uploaded 15/09/26  |  | 2.4 MB • Uploaded 18/09/26  |  | 1.8 MB • Uploaded 10/09/26  |     |
| | [Download] [Preview] [...]  |  | [Download] [Preview] [...]  |  | [Download] [Preview] [...]  |     |
| +-----------------------------+  +-----------------------------+  +-----------------------------+     |
+-------------------------------------------------------------------------------------------------------+
```

### 10.3 Document Upload Modal UX
- **Dropzone Canvas**: Drag-and-drop file target with support for `.pdf`, `.dwg`, `.dxf`, `.jpg`, `.png`, `.webp`, `.xlsx`.
- **Category Selector**: Compulsory dropdown selecting one of the 11 established categories.
- **Document Title / Reference**: Defaults to file name, editable by user (e.g., *"Structural Ground Floor Framing Plan - Rev 2"*).
- **Progress Indicator**: Progress bar displaying upload percentage with cancel option.

---

## 11. GLOBAL QUICK ADD INTEGRATION

The Project module integrates seamlessly with the signature **13-Action Global Quick Add** system:

1. **`New Project` Action**:
   - Tapping `New Project` from the global FAB launches the full-featured New Project Drawer.
   - If triggered from a Customer Detail screen (`/customers/:id`), the customer field is locked to that client.
2. **`Add Daily Site Report` Action**:
   - Tapping `Daily Report` opens the field report workflow.
   - If triggered while inside `/projects/:id`, the project is pre-selected and locked to that project.
   - If triggered globally from the Dashboard or My Day, a quick searchable project selector appears at the top.

---

## 12. MOBILE PROJECT EXPERIENCE (`< 768px`, MINIMUM 360px)

```
+---------------------------------------------------+
| [<- Projects]       PRJ-2026-004        [● Active]|
| Er. Senthil Nathan Residence - 3BHK Villa         |
| Kovaipudur, Coimbatore • Er. M. Suresh            |
|---------------------------------------------------|
| [ Overview ] [ Progress ] [ Finance ] [ Purchases]| -> Scrollable Tabs
|---------------------------------------------------|
| PHYSICAL PROGRESS                                 |
| 42% Complete (Plinth Beam Concreting)             |
| [=====================>                          ]|
|---------------------------------------------------|
| FINANCIAL SNAPSHOT (Rule 18 Non-Netted)           |
| Contract Value:   ₹48,50,000.00                   |
| Customer Paid:    ₹20,00,000.00  (Due: ₹28.50 L)  |
| Recorded Cost:    ₹14,20,000.00  (Zero Profit)    |
|---------------------------------------------------|
| QUICK ACTIONS                                     |
| [+ Daily Report]       [+ Purchase]    [Documents]|
|---------------------------------------------------|
| TODAY'S REPORT STATUS                             |
| [✓] Today's report submitted at 06:45 PM (14 labor)|
|---------------------------------------------------|
| [Sticky Bottom FAB: + Add Event]                  |
+---------------------------------------------------+
```

### Mobile Ergonomics & Design Rules:
- **No Endless Horizontal Scrolling Tables**: Data tables are strictly prohibited on mobile; replaced with clean, stacked summary cards.
- **Horizontally Scrollable Tab Rail**: The 7 tabs render as a smooth horizontal scrolling bar with active pill indicators, ensuring immediate accessibility without visual crowding.
- **Sticky Primary Actions**: Mobile floating action triggers allow supervisors to snap photos and submit daily reports with one thumb.
- **Native Safe Areas**: UI components observe `env(safe-area-inset-bottom)` to prevent interference with iOS home indicators and Android navigation bars.

---

## 13. RESPONSIVE BEHAVIOR MATRIX

| Viewport Width | Screen Category | Projects List Layout | Project Detail Tabs | Financial Summary Grid | Work Progress Display |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **360px – 390px** | Small Mobile (iPhone SE, budget Android) | Single-column cards, stacked metrics, large touch buttons | Single horizontal swipeable tab pill bar | 1-column stacked financial cards | Collapsible accordion stages with 1-tap photo expansion |
| **390px – 430px** | Modern Mobile (iPhone 14/15, Galaxy S23) | Single-column cards with 2x2 key-value metric sub-grid | Horizontal tab pill bar with edge gradient fades | 1-column stacked cards with clear Inflow vs Cost dividers | Accordion stages with progress bars and verified badges |
| **768px – 1023px** | Tablet & Small Laptops | 2-column project card grid or compact desktop table | Full horizontal tab bar with text labels | 2-column grid: Customer Side (Left) vs Cost Side (Right) | 2-column layout: Stage breakdown (60%) + Photos/Notes (40%) |
| **1024px – 1279px**| Standard Desktop | Full 9-column data table with inline actions | Full architectural tab rail with numeric count badges | 2-column balanced financial cockpit with ledger links | Structured stage tree with inline task completion verification |
| **1280px – 1440px+**| High-Res Desktop / Studio Displays | Full 9-column data table with hover elevation & full filters | Full tab rail with icon + label + counter pills | Full 4-quadrant financial cockpit with direct ledger drill-downs | Full multi-stage execution board with embedded photo sidecar |

---

## 14. EMPTY STATES SPECIFICATION

Every empty state in the Project module provides an informative, human explanation and an immediate primary CTA:

1. **No Projects Yet (Brand New Workspace)**:
   - **Icon**: `lucide: Building2` inside Warm Gold tint badge (`#F9F3E5`).
   - **Headline**: `No projects registered yet`
   - **Explanation**: *"Register your first civil construction or interior site to begin tracking execution milestones, daily reports, and recorded site costs."*
   - **Primary Action**: `[+ Create First Project]`.
2. **No Active Projects**:
   - **Icon**: `lucide: HardHat` inside soft stone badge (`#EFECE6`).
   - **Headline**: `No active projects underway`
   - **Explanation**: *"All ongoing construction projects are currently in planning, on hold, or completed."*
   - **Primary Action**: `[View All Projects]`.
3. **No Purchases for this Project**:
   - **Icon**: `lucide: ShoppingCart` inside soft stone badge (`#EFECE6`).
   - **Headline**: `No material purchases recorded`
   - **Explanation**: *"No cement, steel, sand, or vendor procurement vouchers have been linked to this project site yet."*
   - **Primary Action**: `[+ Record First Material Purchase]`.
4. **No Workforce Activity Recorded**:
   - **Icon**: `lucide: Users` inside soft stone badge (`#EFECE6`).
   - **Headline**: `No site labor muster logged`
   - **Explanation**: *"Daily worker attendance has not been filed for this site. Open Fast Muster to log masons and helpers."*
   - **Primary Action**: `[Open Fast Field Muster]`.
5. **No Daily Reports Filed**:
   - **Icon**: `lucide: ClipboardList` inside warm gold badge (`#F9F3E5`).
   - **Headline**: `No daily site progress reports`
   - **Explanation**: *"Field supervisors have not submitted daily logs or progress photos for this site yet."*
   - **Primary Action**: `[+ Submit Today's Daily Report]`.
6. **No Documents Uploaded**:
   - **Icon**: `lucide: FolderUp` inside soft stone badge (`#EFECE6`).
   - **Headline**: `No architectural plans or documents`
   - **Explanation**: *"Upload municipal building sanctions, 3D elevations, structural blueprints, or customer agreements."*
   - **Primary Action**: `[+ Upload First Document]`.
7. **No Financial Activity (Zero Vouchers)**:
   - **Icon**: `lucide: ReceiptIndianRupee` inside emerald tint badge (`#EAF5EE`).
   - **Headline**: `No financial vouchers recorded`
   - **Explanation**: *"No customer receipts or site expense vouchers have been posted to this project's commercial ledger."*
   - **Primary Action**: `[Record Customer Payment]`.
8. **No Matching Search Results**:
   - **Icon**: `lucide: SearchX` inside soft stone badge (`#EFECE6`).
   - **Headline**: `No projects match your search`
   - **Explanation**: *"We couldn't find any projects matching '{search_query}'. Try checking for typos or clear active filters."*
   - **Primary Action**: `[Clear All Filters]`.

---

## 15. LOADING STATES (SHIMMER SKELETONS & TAB ISOLATION)

- **Isolated Tab Loading Boundaries**: Each tab (`Overview`, `Work Progress`, `Finance`, `Purchases`, `Workforce`, `Daily Reports`, `Documents`) loads data independently. If the user clicks into `Finance`, only the finance cards shimmer; the project header and tab bar remain fully interactive.
- **Projects List Skeleton**:
  - Desktop: 6 rows of shimmering table bars (`h-12 bg-stone-200 animate-pulse rounded`).
  - Mobile: 3 stacked cards with shimmering header, progress bar, and 2x2 metric blocks.
- **Project Detail Skeleton**:
  - Header: Shimmering title (`w-72 h-7 bg-stone-200 rounded`), badge (`w-20 h-5 bg-stone-200 rounded-full`), and action buttons.
  - Active Tab: Structured skeleton blocks mirroring the specific tab's final layout geometry.
- **Photo Upload Shimmer**: During image compression and upload, photo tiles display a spinning spinner (`lucide: Loader2`) and progress percentage overlay (`Uploading 72%...`).

---

## 16. ERROR RECOVERY & RESILIENCE SPECIFICATION

- **Tab-Level Fault Isolation**: A network failure while loading Daily Reports **must never crash or freeze the Project Detail Command Center**. The header, financial summary, and other tabs remain completely accessible.
- **Standardized Error Patterns**:
  1. **Tab Data Loading Failure**:
     - Inline banner inside active tab: *"Unable to load material purchases. Your internet connection may be unstable."*
     - Action: `[Retry Loading Purchases]` (without full-page refresh).
  2. **Photo Upload Interrupted**:
     - Failed photo tile displays a brick crimson border with retry overlay: `[!] Upload Failed - Tap to Retry`. Raw photos are retained in memory.
  3. **Validation Error on Form Submission**:
     - Auto-focuses the first invalid input field with red focus ring and clear, construction-specific error message (e.g., *"Contract Value must be greater than ₹0.00"*).
  4. **Access Restriction (Role Boundary)**:
     - Field supervisors accessing financial ledger drill-downs see: *"Financial ledger restricted to Company Owners and Accountants. Contact Administrator for commercial access."*

---

## 17. NAVIGATION & BI-DIRECTIONAL RELATIONSHIPS

The Project module sits at the heart of the business graph:

```
                  +---------------------------+
                  |         CUSTOMER          |
                  |     (/customers/:id)      |
                  +-------------+-------------+
                                |
                                v
                  +---------------------------+
                  |         ESTIMATE          |
                  |     (/estimates/:id)      |
                  +-------------+-------------+
                                |
                                v
+---------------------------------------------------------------+
|                        PROJECT RECORD                         |
|                       (/projects/:id)                         |
+-------+---------------+---------------+---------------+-------+
        |               |               |               |
        v               v               v               v
  +-----------+   +-----------+   +-----------+   +-----------+
  | PURCHASES |   | WORKFORCE |   |  REPORTS  |   | DOCUMENTS |
  | (/purchases|  | (/wages & |   |  (/daily- |   | (/docs &  |
  |    /:id)  |   | attendance)   |  reports) |   |  photos)  |
  +-----------+   +-----------+   +-----------+   +-----------+
```

### Contextual Traversal Rules:
1. **From Customer**: Clicking `[View Active Projects]` on `/customers/:id` filters the Projects list or opens the project directly.
2. **From Estimate**: Converting an accepted quotation on `/estimates/:id` routes to `/projects/new` with Customer, Site Address, Contract Value, and BOQ Scope pre-filled.
3. **From Project to Purchase**: Clicking a voucher in the Purchases tab opens `/purchases/:id` with a return breadcrumb: `[<- Back to PRJ-2026-004]`.
4. **From Project to Customer Ledger**: Clicking Customer Received opens the Customer Payment Ledger filtered to this project's receipts.

---

## 18. ACCESSIBILITY SPECIFICATION (WCAG 2.1 AA)

- **Keyboard Navigation**:
  - All 7 tabs in Project Detail are structured as a standard WAI-ARIA tablist (`role="tablist"`).
  - Arrow keys (`Left` / `Right`) move focus between tabs; `Enter` or `Space` activates the tab.
  - Active tab panel uses `role="tabpanel"` with appropriate `aria-labelledby`.
- **Focus Rings**:
  - High-visibility focus indicator: `outline: 2px solid #4A0E0E; outline-offset: 2px`. Never disabled or hidden on keyboard focus.
- **Color-Independent Status Indicators**:
  - Every project and voucher status includes a **text label** alongside a 6px solid geometric dot indicator, ensuring full comprehension for colorblind users.
- **Touch Target Integrity**:
  - Every interactive button, filter pill, table row action, and photo tile has a minimum physical bounding box of **$44\times 44\text{px}$** on touch viewports.
- **Screen Reader Support**:
  - Progress bars include `aria-valuenow="42" aria-valuemin="0" aria-valuemax="100" aria-label="Physical project completion progress: 42 percent"`.
  - Financial figures include explicit screen-reader text: `₹48,50,000.00` is pronounced as *"Rupees Forty Eight Lakh Fifty Thousand"*.

---

## 19. FINAL DESIGN QUALITY AUDIT & CRAFT CRITIQUE

The design specification has been audited against the installed design skills (**Impeccable**, **Taste**, **Anthropic Frontend Design**, **UI/UX Pro Max**, **Vercel Web Design Guidelines**):

| Audit Dimension | Evaluation & Resolution | Status |
| :--- | :--- | :--- |
| **Command Center Feel** | Project Detail unites engineering, workforce, purchases, and finance into an authoritative cockpit without visual clutter. | **PASSED** |
| **Rule 18 Financial Integrity** | Strict bifurcation of Customer Inflow vs Recorded Project Cost. **Zero speculative profit or net margin displayed**. | **PASSED** |
| **Construction Terminology** | Uses authentic civil contracting terms: Substructure, Plinth Beam, Wire Cut Bricks, M-Sand, OPC 53 Grade, Fast Muster. | **PASSED** |
| **Outdoor Field Usability** | Daily Reports feature camera-first triggers, client-side photo compression, offline draft safety, and high-contrast typography. | **PASSED** |
| **Visual Taste & Aesthetics** | Pure white surface cards, 1px stone borders (`#E2DDD5`), Deep Maroon accents (`#4A0E0E`), and Warm Gold highlights (`#C99A2E`). Zero generic SaaS slop. | **PASSED** |
| **Mobile-First Ergonomics** | Retires desktop tables on mobile in favor of structured operational cards and swipeable horizontal tabs. Touch targets $\ge 44\text{px}$. | **PASSED** |
| **Fault Isolation** | Tab boundaries prevent failures in photo or report queries from disrupting access to financial or overview records. | **PASSED** |
| **Accessibility (WCAG 2.1 AA)** | ARIA tablist/tabpanel, color-independent status badges, high-contrast focus rings, and screen-reader currency pronunciation. | **PASSED** |

---

### Conclusion & Implementation Readiness
This specification completes **Module 05 — Project Management Module Design**. It provides the complete UX/UI architecture, interaction standards, responsive behaviors, and state matrices required to build the core operational engine of the **Shivarivel Construction & Interiors** ERP.

**DESIGN PHASE COMPLETE. DO NOT WRITE PRODUCTION CODE OR PROCEED TO IMPLEMENTATION UNTIL ORDERED.**
