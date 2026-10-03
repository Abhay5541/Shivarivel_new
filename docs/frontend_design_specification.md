# SHIVARIVEL CONSTRUCTION & INTERIORS — FRONTEND UX/UI DESIGN SPECIFICATION

---

## 1. PRODUCT IDENTITY & BRAND VISUAL LANGUAGE

### 1.1 Brand Identity & Personality
- **Product Name**: SHIVARIVEL ERP
- **Company Name**: SHIVARIVEL CONSTRUCTION & INTERIORS
- **Business Domain**:
  - Building Planning & 3D Planning
  - Approval Plans & Site Surveying
  - Estimates & Valuations
  - Building Contracting & Civil Construction
  - 3D Elevation & Structural Detailing
  - Interior & Exterior Works
  - False Ceiling & Profile Lighting
- **Visual Personality**:
  - **Premium**: Crafted with refined contrast, authoritative typography, and architectural dignity.
  - **Professional & Trustworthy**: Clear numbers, solid borders, unmistakable audit trails, and zero decorative fluff.
  - **Construction-Focused**: Utilitarian hierarchy designed for dirty job sites on mobile as well as high-resolution desktop monitors in the planning studio.
  - **Modern & Clean**: Generous breathing room, crisp tabular alignments, structured metadata, and deliberate whitespace.
  - **Avoid**: Generic SaaS/dashboard templates, neon colors, glassmorphism, heavy drop shadows, decorative illustrations, and floating blobs.

### 1.2 Color Palette & Semantic Tokens
The visual palette is directly derived from the official Shivarivel brand identity:

| Token | Name | HEX Code | Tailwind Utility | Semantic Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `primary` | Deep Maroon | `#4A0E0E` | `bg-[#4A0E0E]`, `text-[#4A0E0E]` | Primary branding, primary CTA buttons, active sidebar item backgrounds, modal headers |
| `primary-hover` | Dark Maroon | `#380A0A` | `bg-[#380A0A]` | Hover/pressed states for primary actions |
| `accent` | Warm Construction Gold | `#C99A2E` | `bg-[#C99A2E]`, `text-[#C99A2E]` | Active state indicators, key highlights, progress bars, milestone stars, badges |
| `accent-light` | Soft Gold Tint | `#F9F3E5` | `bg-[#F9F3E5]` | Background tint for active tabs, selected states, gold badge backgrounds |
| `background` | Warm Cream | `#F7F5F0` | `bg-[#F7F5F0]` | Global application background (warm, architectural canvas, non-harsh white) |
| `surface` | Pure White | `#FFFFFF` | `bg-white` | Cards, tables, drawers, dialogs, dropdown menus |
| `surface-subtle`| Muted Stone | `#EFECE6` | `bg-[#EFECE6]` | Table header background, card border lines, input disabled backgrounds |
| `border` | Architectural Border | `#E2DDD5` | `border-[#E2DDD5]` | Standard 1px structural container divider and card outline |
| `text-primary` | Charcoal | `#242424` | `text-[#242424]` | Page titles, primary data points, table cells, input values |
| `text-secondary`| Muted Charcoal | `#6B6B6B` | `text-[#6B6B6B]` | Metadata labels, breadcrumbs, timestamps, secondary captions |
| `text-muted` | Sub-label Stone | `#8C8880` | `text-[#8C8880]` | Form placeholders, deactivated labels, table column headers |

#### Semantic Financial & Operational Status Colors (Used Sparingly & Intentionally)
- **Positive / Inflow / Confirmed / Completed**:
  - Emerald Forest: `#1E6B37` (Badge text/icon), `#EAF5EE` (Badge background)
- **Warning / Overdue / Pending Review / Attention Required**:
  - Amber Ochre: `#B86E00` (Badge text/icon), `#FEF5E7` (Badge background)
- **Danger / Outflow / Cancelled / Urgent**:
  - Brick Crimson: `#9E2A2B` (Badge text/icon), `#FCEEEE` (Badge background)
- **Draft / Inactive / Archived**:
  - Slate Grey: `#55595D` (Badge text/icon), `#F1F3F5` (Badge background)

---

## 2. TYPOGRAPHY SYSTEM

### 2.1 Font Stack
- **Headings & Display**: `Plus Jakarta Sans`, sans-serif (Architectural clarity, geometric precision, modern weight).
- **Body, Inputs & Metadata**: `Inter`, sans-serif (Optimized readability on mobile devices, tabular numeral alignments).
- **Monospace & Code**: `JetBrains Mono` or `ui-monospace` (Used for system-generated voucher codes like `PRJ-2026-0001`, `PAY-0042`).

### 2.2 Scale & Hierarchy

| Element | Font Family | Size | Weight | Line Height | Letter Spacing |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Page Title (Desktop)** | Plus Jakarta Sans | 30px (1.875rem) | Bold (700) | 38px | -0.02em |
| **Page Title (Mobile)** | Plus Jakarta Sans | 24px (1.5rem) | Bold (700) | 32px | -0.015em |
| **Section Title / H2** | Plus Jakarta Sans | 20px (1.25rem) | SemiBold (600) | 28px | -0.01em |
| **Sub-section Title / H3** | Plus Jakarta Sans | 16px (1.0rem) | SemiBold (600) | 24px | 0em |
| **KPI Headline Value** | Plus Jakarta Sans | 28px (1.75rem) | Bold (700) | 34px | -0.02em |
| **Body (Default)** | Inter | 14px (0.875rem) | Regular (400) | 20px | 0em |
| **Body Medium / Action**| Inter | 14px (0.875rem) | Medium (500) | 20px | 0em |
| **Supporting / Caption** | Inter | 12px (0.75rem) | Regular (400) | 16px | +0.01em |
| **Badge / Tag** | Inter | 11px (0.6875rem) | SemiBold (600) | 14px | +0.02em |
| **Financial Figures** | Inter | Tabular figures (`tnum`), Medium/Bold | Consistent aligned widths |

---

## 3. DESIGN SYSTEM & COMPONENT LIBRARY

### 3.1 Buttons
- **Primary Button**: Background `#4A0E0E`, text `#FFFFFF`, 1px solid `#380A0A`, 6px rounded corners (`rounded-md`). Subtle hover darken to `#380A0A`. Height: 40px desktop, 44px mobile (strict minimum touch target).
- **Secondary Button**: Background `#FFFFFF`, text `#4A0E0E`, 1px solid `#4A0E0E`, hover background `#F9F3E5`.
- **Outline / Neutral Button**: Background `#FFFFFF`, text `#242424`, 1px solid `#E2DDD5`, hover background `#F7F5F0`.
- **Ghost Button**: Background transparent, text `#6B6B6B`, hover text `#242424`, hover background `#EFECE6`.
- **Destructive / Danger Button**: Background `#9E2A2B`, text `#FFFFFF`, hover `#7C1F20`.
- **Icon Button**: 40x40px square/rounded, centered SVG icon (Lucide icons), transparent background, hover `#EFECE6`.

### 3.2 Cards & KPI Metrics
- **Container**: Background `#FFFFFF`, border `1px solid #E2DDD5`, shadow `0 1px 3px rgba(0,0,0,0.04)`, border-radius `8px`.
- **KPI Card Structure**:
  - Top row: Metric label (`13px text-secondary uppercase tracking-wider`) + contextual icon or badge.
  - Middle: Primary value (`28px bold Plus Jakarta Sans text-primary font-bold tracking-tight`).
  - Bottom row: Comparison/context note (`12px text-secondary` or sub-breakdown).
  - Optional: Subtle 3px colored top border (Maroon, Gold, Emerald, or Charcoal) indicating category.

### 3.3 Status Badges
- Strict pill format (`px-2.5 py-0.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5`).
- Includes a 6px solid dot indicator beside the text so colorblind users perceive status instantly.
- Examples:
  - `Draft`: Grey pill (`bg-slate-100 text-slate-700`) + Grey dot.
  - `Confirmed` / `Active`: Green pill (`bg-[#EAF5EE] text-[#1E6B37]`) + Green dot.
  - `On Hold` / `Pending`: Amber pill (`bg-[#FEF5E7] text-[#B86E00]`) + Amber dot.
  - `Cancelled`: Red pill (`bg-[#FCEEEE] text-[#9E2A2B]`) + Red dot.

### 3.4 Data Tables (Desktop) & Stacked Cards (Mobile)
- **Desktop Table**:
  - Header: `#EFECE6`, text 12px uppercase tracking-wider `#6B6B6B`, height 40px, border-bottom `1px solid #E2DDD5`.
  - Rows: Height 52px, zebra hover `#FAFAF7`, border-bottom `1px solid #E2DDD5`. Text 14px `#242424`.
  - Column alignment: Text left-aligned; Numbers/Currency strictly right-aligned (`font-mono` / `tabular-nums`); Status centered; Actions right-aligned with ellipsis or button group.
- **Mobile Stacked Cards (Auto-switched at `< 768px`)**:
  - Eliminates awkward horizontal table scrolling for primary entities.
  - Card header: Primary title (bold 15px) + Status badge.
  - Card body: 2-column key-value grid (e.g., "Date: 12 Oct 2026", "Amount: ₹45,000", "Customer: Priya R").
  - Card footer: Quick actions (View, Edit, Call, WhatsApp) separated by a 1px border.

### 3.5 Drawers, Modals & Bottom Sheets
- **Desktop**:
  - Quick forms & edits: Right-sliding drawer (width 480px or 640px) with backdrop blur overlay. Keeps the main list visible in background.
  - Confirmations & deletions: Centered modal dialog (width 440px).
- **Mobile**:
  - All drawers and quick forms transform into smooth **Draggable Bottom Sheets** with drag handles (`h-1.5 w-12 rounded-full bg-stone-300 mx-auto my-2`), occupying 85–95% viewport height with sticky bottom action bars.

### 3.6 Form Elements & Inputs
- **Text & Select Inputs**: Height 42px, border `1px solid #E2DDD5`, background `#FFFFFF`, text 14px `#242424`, focus ring `2px solid #4A0E0E` with zero blur spread.
- **Currency Input**: Fixed prepended `₹` symbol in muted stone background; automatic Indian locale comma formatting as user types (`₹1,25,000.00`).
- **Date Picker**: Direct native mobile date input (`type="date"`) on touch devices for maximum UX speed; custom calendar popover on desktop.
- **Quantity & Rate Inputs**: Side-by-side auto-calculating total display (`Quantity × Unit Rate = ₹ Total`).

---

## 4. APPLICATION SHELL ARCHITECTURE

### 4.1 Desktop Shell (`>= 1024px`)
- **Three-zone layout**:
  ```
  +-----------------------------------------------------------------------------------+
  | SIDEBAR (240-260px)   | TOP HEADER (Height: 64px, Sticky)                        |
  |                       +-----------------------------------------------------------+
  | Brand Mark            | Breadcrumb / Title | [Global Search] [Quick Add] [User]   |
  | Nav Groups            +-----------------------------------------------------------+
  | - Main                | MAIN CONTENT AREA (Scrollable, max-w-7xl, px-8 py-6)      |
  | - Business            |                                                           |
  | - Projects            |                                                           |
  | - Procurement         |                                                           |
  | - Workforce           |                                                           |
  | - Finance             |                                                           |
  | - Reports             |                                                           |
  | - Settings            |                                                           |
  +-----------------------------------------------------------------------------------+
  ```
- **Collapsible Sidebar**:
  - Full width (250px) expands navigation groups with icon + label + counter pills.
  - Collapsed state (68px) shows tooltip-supported icons with active maroon highlight dot.

### 4.2 Tablet Shell (`768px - 1023px`)
- Sidebar defaults to collapsed (68px) or hamburger drawer overlay.
- Top header maintains full search and Quick Add.
- 2-column card layouts collapse from 4-column desktop grids.

### 4.3 Mobile Shell (`< 768px`, Minimum 360px)
- **Top Bar (Height: 56px)**:
  - Left: Hamburger menu / Company logo.
  - Center: Contextual page title (`Plus Jakarta Sans 18px font-bold text-center truncate`).
  - Right: Notification Bell + Profile thumbnail.
- **Bottom Navigation Bar (Height: 64px, Fixed at bottom, safe-area-inset padded)**:
  ```
  [ Today ]     [ Projects ]     ( + Quick Add )     [ Money ]     [ More ]
     📅              🏗️              [Maroon FAB]         💰           ☰
  ```
  - **Today**: Instant route to `My Day` (owner's morning agenda).
  - **Projects**: Direct route to `Projects List`.
  - **Central + Action Button**: 52x52px elevated Deep Maroon circular button with Warm Gold `+` icon. Triggers Quick Add bottom sheet.
  - **Money**: Consolidated Financial Command Center (Customer Dues, Supplier Balances, Wage Payables).
  - **More**: Full-screen slide-over menu containing Workforce, Procurement, Reports, and Settings.

---

## 5. GLOBAL QUICK ADD MASTER INTERACTION (13 STANDARDIZED ACTIONS)

The **Global Quick Add** is one of the signature, high-frequency interactions of the Shivarivel ERP. It allows the business owner, project manager, and field staff to capture any operational event in under 30 seconds without navigating away from their current screen.

### 5.1 Trigger Affordance & Positions
- **Desktop Trigger**:
  - **Floating Gold FAB**: Fixed at the bottom-right corner (`bottom-8 right-8 z-40`). 56x56px circular button in Warm Construction Gold (`bg-[#C99A2E] text-white hover:bg-[#B38722] shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95`). Contains a crisp 24px plus icon (`lucide: Plus`).
  - **Secondary Desktop Trigger**: Persistent `[+ Quick Add]` pill in the top header and global keyboard shortcut (`Q` or `Cmd+K` / `Ctrl+K`).
  - **Desktop Display**: Smooth centered backdrop modal / popover (`max-w-2xl w-full bg-white rounded-xl shadow-2xl border border-[#E2DDD5] p-6 animate-in fade-in zoom-in-95 duration-150`).
- **Mobile Trigger**:
  - **Central Bottom-Navigation FAB**: Positioned prominently in the exact center of the bottom navigation bar (`bottom-4 left-1/2 -translate-x-1/2 z-50`). 52x52px elevated gold circle (`bg-[#C99A2E] text-white shadow-lg active:scale-90 transition-transform`).
  - **Mobile Display**: Native-feeling swipeable **Bottom Sheet** (`rounded-t-2xl bg-white max-h-[85vh] overflow-y-auto p-5 shadow-2xl border-t border-[#E2DDD5] animate-in slide-in-from-bottom duration-200`). Features a subtle top drag handle indicator (`w-12 h-1.5 bg-[#E2DDD5] rounded-full mx-auto mb-4`).

---

### 5.2 The 13 Signature Actions (Grouped by Operational Domain)

Each item in the Quick Add grid presents a dedicated container with a 40x40px icon badge, bold title, and a crisp one-line explanatory description:

#### Domain A: Commercial & Customer Pipeline
1. **New Customer**:
   - **Icon**: `lucide: UserPlus` (Warm Gold icon `#C99A2E` inside `#F9F3E5` rounded square)
   - **Title**: `New Customer`
   - **Description**: *"Register a prospective client, site address, and contact details"*
2. **New Enquiry**:
   - **Icon**: `lucide: HelpCircle` (Deep Maroon icon `#4A0E0E` inside `#F7F5F0`)
   - **Title**: `New Enquiry`
   - **Description**: *"Log incoming requirement (Planning, 3D Elevation, Contracting)"*
3. **Site Visit**:
   - **Icon**: `lucide: Compass` (Deep Maroon icon)
   - **Title**: `Site Visit`
   - **Description**: *"Schedule preliminary plot inspection or structural survey"*
4. **New Estimate**:
   - **Icon**: `lucide: Calculator` (Warm Gold icon)
   - **Title**: `New Estimate`
   - **Description**: *"Generate a detailed itemized BOQ valuation for client approval"*

#### Domain B: Projects & Site Execution
5. **New Project**:
   - **Icon**: `lucide: Building2` (Deep Maroon icon)
   - **Title**: `New Project`
   - **Description**: *"Convert an accepted estimate into an active construction site"*
6. **Task**:
   - **Icon**: `lucide: CheckSquare` (Warm Gold icon)
   - **Title**: `Task`
   - **Description**: *"Assign an actionable site inspection, customer call, or milestone check"*
7. **Daily Report**:
   - **Icon**: `lucide: ClipboardList` (Warm Gold icon)
   - **Title**: `Daily Report`
   - **Description**: *"Submit evening supervisor progress log, weather, and site photos"*

#### Domain C: Procurement & Expenses
8. **Add Purchase**:
   - **Icon**: `lucide: ShoppingCart` (Warm Gold icon)
   - **Title**: `Add Purchase`
   - **Description**: *"Record material procurement invoice, cement/steel delivery, or vendor PO"*
9. **Expense**:
   - **Icon**: `lucide: Receipt` (Deep Maroon icon)
   - **Title**: `Expense`
   - **Description**: *"Log direct site petty cash, fuel, equipment hire, or municipal fees"*

#### Domain D: Treasury & Workforce Settlements (Rule 18 Compliant)
10. **Customer Payment**:
    - **Icon**: `lucide: ArrowDownLeft` (Emerald Forest icon `#1E6B37` inside `#EAF5EE`)
    - **Title**: `Customer Payment`
    - **Description**: *"Record milestone revenue collection received from client"*
11. **Supplier Payment**:
    - **Icon**: `lucide: ArrowUpRight` (Deep Charcoal icon `#242424` inside `#EFECE6`)
    - **Title**: `Supplier Payment`
    - **Description**: *"Record material bill liquidation payment to vendor"*
12. **Employee Payment**:
    - **Icon**: `lucide: Banknote` (Deep Maroon icon)
    - **Title**: `Employee Payment`
    - **Description**: *"Record worker wage payout settlement or cash advance loan recovery"*
13. **Attendance**:
    - **Icon**: `lucide: CalendarCheck2` (Emerald Forest icon)
    - **Title**: `Attendance`
    - **Description**: *"Open Fast Field Muster to verify today's labor shifts across sites"*

---

### 5.3 Interaction & Form Transition Standard
- **Instant Drawer Launch**: Tapping any of the 13 actions immediately dismisses the Quick Add sheet/popover and opens the official native creation drawer for that resource (sliding from right on desktop, sliding up on mobile).
- **Zero Duplicate Logic**: The Quick Add uses the exact same React Hook Form schemas, validation rules, default company multi-tenancy scoping, and Supabase audit logs as the primary listing pages.
- **Context Awareness**: If the user triggers Quick Add while inside a specific project page (`/projects/PRJ-001`), the project dropdown inside the opened form is automatically pre-selected and locked to that project.

---

## 6. FINANCIAL DISPLAY & INTEGRITY RULES

1. **Indian Currency Notation**:
   - Every financial number is strictly formatted using the Indian numbering system: `₹1,25,000` (thousands, lakhs, crores), never Western `125,000` or unformatted raw numbers.
2. **Explicit Financial Separation (Rule 18 Non-Netting)**:
   - Financial categories are visually separated into dedicated columns/cards:
     - **Received** (Customer receipts)
     - **Outstanding Due** (Customer unpaid balance)
     - **Supplier Paid** (Payments issued to vendors)
     - **Supplier Balance** (Pending vendor liability)
     - **Wages Earned** (Labor cost incurred)
     - **Wages Paid** (Labor wages disbursed)
     - **Wage Payable** (Unpaid earned wages)
     - **Advances Given** (Employee cash advance)
     - **Advances Recovered** (Recoveries deducted from wage payments)
     - **Outstanding Advance Balance** (Pending recovery)
3. **No "Profit" Displays**:
   - The ERP never shows a "Profit" or "Net Margin" label in the MVP.
   - It strictly displays **Recorded Project Cost** (sum of purchases + paid/payable wages + project expenses) alongside **Total Invoiced / Contract Value**.
4. **Immutability Signage**:
   - Confirmed financial vouchers display a subtle lock icon with the tooltip: *"Confirmed financial transaction — adjustments require recorded reversal entries"*.

---

## 7. EXHAUSTIVE PAGE SPECIFICATIONS ACROSS ALL 8 MODULES

---

### MODULE 1: MAIN (COMMAND CENTER)

#### Page 1.1: Dashboard (`/dashboard`)
- **Purpose**: High-altitude financial and operational pulse. Gives the owner immediate answers to: *What needs my attention?*, *Who owes me money?*, *Who do I need to pay?*, and *Are my projects moving?*
- **Primary User**: Managing Director / Owner / Partner.
- **Desktop Layout**:
  - Row 1: 4 Top KPI Cards (Active Projects, Total Customer Dues, Total Supplier Balance, Total Wage Payable).
  - Row 2: 2 Column Split (60% Active Project Progress Cards, 40% Financial Health Breakdown).
  - Row 3: Today's Action Center (Overdue Follow-ups, Site Visits Today, Unapproved Daily Reports).
- **Mobile Layout**:
  - Single column stream. Top horizontal swipeable KPI strip followed by urgent action alerts, then collapsed project accordion cards.
- **Header**:
  - Greeting: *"Good morning, Velmurugan"* + Subtitle: *"Here is your company status for Thursday, 1 Oct 2026"*.
  - Right actions: `[Date Filter: This Month ▼]`, `[+ Quick Add]`.
- **KPI Cards**:
  1. `Active Projects`: Count + Total Contract Value (`₹48,50,000`).
  2. `Customer Dues`: Total pending receivables (`₹14,20,000`) with count of overdue customers.
  3. `Supplier Payables`: Total pending vendor balances (`₹6,80,000`).
  4. `Wage Payable`: Pending worker earned wages (`₹1,45,000`).
- **Main Sections**:
  - **Project Snapshot Grid**: Cards showing project name, client name, completion percentage bar, and Recorded Project Cost vs Contract Value.
  - **My Day Quick Widget**: Top 3 urgent tasks and next scheduled site visit with a link to `/my-day`.
  - **Recent Activity Feed**: Real-time log of purchases added, payments received, and reports submitted.
- **Empty State**: When brand new company: Welcoming setup checklist (1. Setup company profile, 2. Add first customer, 3. Create first estimate).
- **Loading State**: Shimmer skeleton blocks mirroring KPI cards and table widgets.

---

#### Page 1.2: My Day (`/my-day`)
- **Purpose**: Operational command center for daily execution. Groups actionable work into three clear temporal buckets: OVERDUE, TODAY, and UPCOMING.
- **Primary User**: Owner, Site Supervisors, Project Managers.
- **Desktop Layout**:
  - Left / Main column (70%): Three distinct collapsible task lists (Overdue items with red badge, Today's agenda with gold badge, Upcoming next 7 days).
  - Right sidebar (30%): Scheduled Site Visits Map/List + Quick Follow-up Log.
- **Mobile Layout**:
  - Tabbed top selector: `[Overdue (4)]` `[Today (7)]` `[Upcoming (12)]`. Full screen swipeable card items with 1-tap completion checkboxes.
- **Header**:
  - Title: `My Day` + Date picker (defaults to `Today, 1 Oct 2026`).
  - Actions: `[+ Add Task]`, `[+ Add Follow-up]`.
- **Cards & Items**:
  - Task Card: Checkbox, Title, Category Badge (`Call`, `Site Visit`, `Order Material`, `Collect Payment`), Associated Project/Customer, Due Date tag.
  - Follow-up Card: Customer name, phone click-to-call button, WhatsApp direct button, notes from previous conversation.
- **Interactive Actions**:
  - Checking a task triggers optimistic strikethrough, records timestamp `completed_at = now()`, and pops a undo-toast.
- **Empty State**: Green celebration badge: *"All clear! No pending tasks or follow-ups for today."* + Button `[Plan Tomorrow]`.

---

### MODULE 2: BUSINESS (CRM & SALES PIPELINE)

#### Page 2.1: Customers Directory (`/customers`)
- **Purpose**: Centralized client phonebook and commercial relationship hub.
- **Primary User**: Owner, Office Admin, Sales Executive.
- **Desktop Layout**: Full-width data table with search, status filters (`Active`, `Inactive`), and summary metric strip.
- **Mobile Layout**: Search input on top, followed by customer contact cards with direct call & WhatsApp floating buttons.
- **Table Columns (Desktop)**:
  - Customer Name & Code (`CUST-0012`)
  - Phone & Email
  - City / Site Area
  - Active Projects count
  - Total Invoiced (₹)
  - Total Received (₹)
  - Outstanding Due (₹ highlighted in maroon if > 0)
  - Status Badge (`Active` / `Inactive`)
  - Actions (`View`, `Edit`)
- **Filters**: Search by name/phone/address; Status filter; Outstanding Dues toggle (`Has balance > 0`).
- **Modals / Drawers**:
  - `New Customer Drawer`: Name (required), Phone (required, 10-digit validation), Email, Address, GSTIN (optional), Notes.

---

#### Page 2.2: Customer Detail View (`/customers/:id`)
- **Purpose**: 360-degree commercial profile of a single client.
- **Header**: Customer Name, Code, Phone, WhatsApp quick link, Total Lifetime Value, Total Outstanding Due badge.
- **Main Tabs**:
  1. `Overview`: Primary contact info, site addresses, notes, customer status toggle.
  2. `Enquiries & Visits`: Timeline of all inquiries received and site visits conducted.
  3. `Estimates`: All historical estimates sent with acceptance status.
  4. `Projects`: List of active and completed projects for this customer.
  5. `Payments & Ledger`: Statement of all customer payments, receipts, and outstanding dues.
  6. `Documents`: KYC, ID proofs, plan approvals, site photos.
- **Quick Actions**: `[+ New Enquiry]`, `[+ Schedule Visit]`, `[+ Create Estimate]`, `[+ Record Payment]`.

---

#### Page 2.3: Enquiries Pipeline (`/enquiries`)
- **Purpose**: Track prospective customer leads from first phone call through estimate conversion.
- **Desktop Layout**: Toggle between **Kanban Board** view and **Table View**.
- **Kanban Columns**:
  1. `New Leads`
  2. `Contacted`
  3. `Site Visit Planned`
  4. `Estimate Prepared`
  5. `Converted` (Won)
  6. `Lost / On Hold`
- **Mobile Layout**: Filterable list cards with status pills and 1-tap call button.
- **Card Content**: Customer Name, Service Type (e.g. *Interior & Elevation*, *False Ceiling*), Estimated Value (`₹6,50,000`), Lead Source (`Referral`, `Poster`, `Instagram`), Next Follow-up Date.
- **Quick Action Drawer**: `Record Enquiry Form` with auto-complete customer selector or `[+ Quick Add Customer]`.

---

#### Page 2.4: Site Visits Tracker (`/site-visits`)
- **Purpose**: Manage field visits, measurements, site inspection notes, and GPS/address coordination.
- **Desktop Layout**: Calendar view + List view toggle.
- **Mobile Layout**: Chronological agenda feed for the field supervisor.
- **Table / Card Columns**:
  - Visit Date & Time
  - Customer & Contact Number
  - Site Address with Google Maps link icon
  - Assigned Supervisor / Engineer
  - Purpose (*Initial Measurement*, *Elevation Inspection*, *Client Review*)
  - Status (`Scheduled`, `Completed`, `Rescheduled`, `Cancelled`)
- **Complete Visit Modal**: Allows supervisor to upload 1–4 quick site photos, input recorded site dimensions, add observations, and schedule next follow-up.

---

#### Page 2.5: Estimates & Quotations (`/estimates`)
- **Purpose**: Professional quotation preparation with line-item breakdown (Materials, Labor, Square Feet rates).
- **Desktop Layout**: Listing table with status badges (`Draft`, `Sent`, `Accepted`, `Rejected`, `Converted to Project`).
---

#### Page 2.6: Create New Estimate Form (`/estimates/new`)
- **Purpose**: Multi-section construction estimate creation workflow allowing quick drafting of commercial quotations with dynamic trade line items, automated subtotal/adjustment math, and instant client/service autocompletion.
- **Visual Design Identity**: Deep Maroon accents, Warm Gold highlights, 1px architectural borders on crisp white cards, clean tabular alignments, and field-work-ready numeric inputs.
- **Form Sections**:
  - **SECTION 1: Client & Site Details**:
    - Customer Autocomplete Selector: Search by name or phone (+ `[+ Quick Add Customer]` inline drawer).
    - Site Address / Location field: Auto-populates from selected customer's default site address; editable for project-specific site locations.
    - Estimate Date: Defaults to current local date (`DD/MM/YYYY`).
    - Validity Period: Dropdown presets (`15 Days`, `30 Days (Default)`, `60 Days`, `Custom Date`) with auto-calculated expiry date.
  - **SECTION 2: Services / Trades Involved**:
    - Tag/pill selector representing commercial trades (*False Ceiling & Profile Lighting*, *Interior Woodwork*, *Building Planning & 3D*, *Civil Construction*, *Structural Detailing*).
    - Multi-select pills with gold indicator for selected state; enables rapid pre-filtering of item templates.
  - **SECTION 3: Dynamic Work Items (Bill of Quantities)**:
    - Dynamic row manager with `[+ Add Work Item]` button.
    - Row Fields:
      - `Item Description`: Rich text input with trade presets (e.g., *"Saint-Gobain Gypsum False Ceiling with peripheral cove channel"*).
      - `Quantity`: Decimal number with `inputMode="decimal"` for mobile.
      - `Unit`: Architectural unit dropdown (`Sq.ft`, `R.ft`, `Lump sum`, `Nos`, `Bags`, `Ton`, `Cum`).
      - `Rate (₹)`: Unit rate in INR.
      - `Amount (₹)`: Auto-calculated read-only field (`Quantity * Rate`), formatted in Indian currency (`₹1,23,250`).
      - Actions: Row drag-handle for reordering, `[Duplicate Row]`, `[Delete Row]` (with red hover).
    - Sub-grouping capability: Ability to add trade section headers (e.g., *"Trade A: False Ceiling & Lighting"*, *"Trade B: Modular Kitchen"*).
  - **SECTION 4: Commercial Summary**:
    - `Subtotal`: Sum of all line item amounts (`₹2,21,850`).
    - `Adjustments / Discount`: Toggle between Flat INR discount or Percentage, with clear negative notation (`-₹11,850`).
    - `Tax / GST`: Optional toggle (Exempted / 18% GST).
    - `Grand Total`: Prominent display in bold Plus Jakarta Sans (`₹2,10,000`), highlighted in Warm Gold, with words representation: *"Rupees Two Lakh Ten Thousand Only"*.
  - **SECTION 5: Notes & Scope Conditions**:
    - Execution timeframe, payment milestone schedule, exclusions, and client approval terms.
    - Template selector: *"Standard Interior Work Terms"*, *"Civil Contracting Terms"*.
- **Bottom Sticky Action Bar**:
  - Desktop & Mobile: Persistent bottom bar with live Subtotal display on left.
  - Actions on right: `[Cancel]` (ghost), `[Save as Draft]` (outline with neutral border), `[Save & Continue / Review]` (Primary Deep Maroon `#4A0E0E`).
- **Mobile Responsive Behavior**:
  - Full-screen distraction-free form layout with clean vertical section progression.
  - Autocomplete selectors expand to native bottom-sheets with search bar and auto-focus.
  - Numeric keyboard enforcement (`inputmode="decimal"`) on Quantity, Rate, and Discount fields.
  - Dynamic work items rendered as responsive touch-friendly cards on narrow viewports (`<640px`) with large 48px touch targets for quantity steppers and delete actions.
  - Sticky bottom action bar fixed to viewport bottom with safe-area padding for mobile home bars.

---

### MODULE 3: PROJECTS (OPERATIONAL COMMAND CENTER)

#### Page 3.1: Projects Listing (`/projects`)
- **Purpose**: Portfolio overview of all contracted civil construction and interior sites. Enables immediate tracking of physical execution progress, contract values, customer collections, outstanding dues, and recorded site costs without netting or calculation of speculative profit.
- **Header**:
  - Title: `Projects`
  - Subtitle: *"Portfolio overview of active civil construction and interior sites."*
  - Primary CTA: `[+ New Project]` (Deep Maroon `#4A0E0E` button with 1px border `#380A0A`).
- **Toolbar & Filter Navigation**:
  - **Search Input**: Full-width / 320px responsive input with search icon; searches across Project ID, Project Name, Customer Name, Supervisor, and Location.
  - **Status Filter Tabs (Horizontal Pills with Count Badges)**:
    - `Active`: Currently ongoing on-site execution.
    - `Planning`: Contract approved, procurement and approvals underway, site work yet to begin.
    - `Completed`: Handover complete, final billing settled.
    - `On Hold`: Temporarily paused (awaiting client approval/payments/materials).
    - `Archived`: Closed historical records.
- **Desktop Table Columns**:
  1. `Project ID`: Architectural monospace code (e.g. `PRJ-2026-0012`), clickable to detail.
  2. `Project Name`: Bold Plus Jakarta Sans text (e.g. *Velmurugan Villa Interiors*).
  3. `Customer`: Client name with link to Customer profile (e.g. *K. Velmurugan*).
  4. `Location`: Site location / city snippet (e.g. *Plot 42, Bypass Rd, Madurai*).
  5. `Supervisor`: Assigned site engineer or supervisor with small avatar badge (e.g. *M. Suresh*).
  6. `Progress`: Horizontal visual progress bar (Warm Gold `#C99A2E` fill on Stone `#EFECE6` track) with bold percentage label (e.g. `68%`). Complete projects display emerald green bar at `100%`.
  7. `Contract Value`: Total agreed contract amount formatted in Indian currency (`₹18,50,000`).
  8. `Received`: Total verified payments collected from the customer (`₹12,00,000`), styled in deep emerald forest.
  9. `Outstanding`: Uncollected customer balance (`₹6,50,000`), highlighted in brick crimson when overdue.
  10. `Recorded Cost`: Total cumulative recorded site expenses (purchases + earned wages + direct site expenses) (`₹8,24,500`), strictly without netting or false "profit" calculations (Rule 18).
  11. `Status`: Visually obvious semantic status badge with 6px solid dot:
      - `Active`: Emerald dot + tint (`bg-emerald-50 text-emerald-800 border-emerald-200`)
      - `Planning`: Amber dot + tint (`bg-amber-50 text-amber-800 border-amber-200`)
      - `Completed`: Slate-emerald dot + tint (`bg-teal-50 text-teal-800 border-teal-200`)
      - `On Hold`: Slate grey dot + tint (`bg-slate-100 text-slate-700 border-slate-300`)
      - `Archived`: Muted stone badge
  12. `Actions`: `[...]` menu button (`View Detail`, `Add Daily Report`, `Add Purchase`, `Record Customer Payment`).
- **Interactive Row Behavior**:
  - Entire table row is clickable and navigates directly to `Project Detail` (`/projects/:id`).
- **Mobile Responsive Layout (Large Project Cards)**:
  - Table collapses into expansive, touch-friendly project cards on viewports `<1024px`.
  - **Card Structure**:
    - **Header Row**: Project Name (16px bold) + Status Badge (top right).
    - **Meta Sub-row**: Project ID + Customer Name + Location + Supervisor.
    - **Progress Bar Section**: Prominent 8px tall rounded progress bar with percentage readout (`68% Complete`).
    - **Financial Matrix (2x2 Compact Grid)**:
      - `Contract Value`: `₹18,50,000`
      - `Received`: `₹12,00,000` (Emerald)
      - `Outstanding`: `₹6,50,000` (Brick Crimson)
      - `Recorded Cost`: `₹8,24,500` (Neutral Charcoal)
    - **Touch Affordance**: Minimum 48px touch targets, subtle chevron `>` indicator on right, full card click navigates to `/projects/:id`.

---

#### Page 3.2: Project Detail Command Center (`/projects/:id`)
- **Purpose**: The central operational command center for a construction or interior project. Provides the business owner, project manager, and site supervisor with complete real-time visibility across physical execution progress, commercial milestones, daily workforce presence, procurement logs, and document vaults in a structured, information-dense layout.
- **Visual Aesthetic**: Architectural clarity with Deep Maroon (`#4A0E0E`) primary accents, Warm Gold (`#C99A2E`) progress indicators, crisp white surface cards with 1px architectural borders (`#E2DDD5`), and charcoal typography.
- **Header & Meta Ribbon**:
  - **Top Row**:
    - Breadcrumb: `Projects / PRJ-2026-0012`
    - Left Title: `Velmurugan Villa Interiors` (26px Plus Jakarta Sans bold)
    - Code: Monospace tag `PRJ-2026-0012`
    - Status Badge: `● Active` (Emerald pill with pulse dot indicator)
    - Action Buttons (Right Aligned):
      - `[Edit]` (Ghost/Outline neutral button, pencil icon)
      - `[+ Quick Add ▼]` (Primary Deep Maroon `#4A0E0E` dropdown menu: *Add Daily Report*, *Add Purchase*, *Record Payment*, *Log Expense*, *Upload Document*)
      - `[Upload]` (Outline button with upload icon: *Site Photos*, *PDF Drawings*, *Permits*)
      - `[More ▼]` (Icon button with kebab `...`: *Export Project Sheet (PDF)*, *Print Summary*, *Duplicate Specs*, *Mark as Completed*, *Archive Project*)
  - **Meta Information Strip (Horizontal Architectural Banner)**:
    - **Customer**: `K. Velmurugan` (`+91 98401 23456`, click to open Customer Profile or WhatsApp)
    - **Location**: `Plot 42, Bypass Road, Madurai` (with map pin icon, opens Google Maps)
    - **Supervisor**: `M. Suresh (Site Engineer)` (with avatar pill, phone call icon)
    - **Timeline**: `15 Jul 2026 → 30 Nov 2026` (`138 Days Total • 78 Days Elapsed • 60 Days Left`)
- **Master Navigation Tabs (7 Structured Workspaces)**:
  1. `Overview` (Active Command Center Dashboard)
  2. `Work Progress` (Stage-by-stage Gantt, task checklist, % milestone tracker)
  3. `Finance` (Contract Value, Milestone billing, Receipts, Project Expenses, Recorded Cost)
  4. `Purchases` (Material orders, supplier bills, delivery slips, pending balances)
  5. `Workforce` (Daily attendance, mason/carpenter headcounts, cumulative wage ledger)
  6. `Daily Reports` (Chronological site logs, supervisor notes, weather, photo feed)
  7. `Documents` (2D approval blueprints, 3D renderings, contracts, inspection sign-offs)

---

### Command Center Cockpit (Overview Tab Breakdown)

The Overview tab is arranged into an information-dense 12-column architectural grid:

#### Zone A: Financial Health Ribbon (Full Width, 4 Distinct Cards — Rule 18 Compliant)
Strictly enforces separation between receivables and costs without netting or artificial "profit" labels:
1. **Contract Value**:
   - `₹18,50,000` (Agreed estimate / signed contract value)
   - Caption: `Revised from baseline EST-2026-0045`
2. **Customer Received**:
   - `₹12,00,000` (Total verified milestone receipts in emerald)
   - Caption: `64.8% of contract collected`
3. **Customer Outstanding**:
   - `₹6,50,000` (Pending customer dues, highlighted in brick crimson)
   - Caption: `Milestone 3 (Flooring & Ceiling) due`
4. **Recorded Project Cost**:
   - `₹8,24,500` (Total cumulative actual expenditure on this site)
   - Caption: `Materials: ₹5.1L • Wages: ₹2.4L • Expenses: ₹74.5K`

#### Zone B: Operational Pulse & Physical Progress (Left Column, 7 Columns Desktop)
1. **Physical Progress & Execution Status**:
   - **Progress Bar**: 10px tall Warm Gold bar (`68% Physical Completion`).
   - **Milestone Stepper**:
     - `[✓] Phase 1: Planning & 3D Approval (100%)`
     - `[✓] Phase 2: Masonry & Electrical Piping (100%)`
     - `[▶] Phase 3: False Ceiling & Lighting (75% In Progress)`
     - `[ ] Phase 4: Modular Woodwork & Finishing (0%)`
     - `[ ] Phase 5: Deep Cleaning & Handover (0%)`
   - **Services Contracted**: Tags for *False Ceiling & Profile Lighting*, *Interior Woodwork*, *3D Elevation*.
2. **Recent Daily Reports Feed**:
   - Displays the last 3 field logs with supervisor timestamp, weather, workforce count, and thumbnail photo carousel.
   - Latest entry: *"Yesterday, 5:45 PM by M. Suresh: Living room false ceiling perimeter channels anchored. Profile light grooves cut."*
   - Includes 3 thumbnail preview photos with zoom modal + `[View All 24 Daily Reports →]`.
3. **Recent Material Purchases**:
   - Compact table showing the last 4 purchase allocations:
     - `PUR-2026-0089` | *Saint-Gobain Gypsum 12.5mm (60 Sheets)* | Sri Balaji Hardware | `₹24,600` | Delivered
     - `PUR-2026-0084` | *Polycab 12W LED Profile Strips (150m)* | Surya Electricals | `₹18,200` | Delivered
   - Link: `[View All 18 Purchases →]`.

#### Zone C: Workforce, Live Site Status & Documents (Right Column, 5 Columns Desktop)
1. **Today's Workforce on Site (Live Muster)**:
   - **Headcount Indicator**: Large bold badge `12 Active Workers Today`.
   - **Trade Breakdown**:
     - *Masons*: 4 Present (₹850/day)
     - *Carpenters*: 5 Present (₹900/day)
     - *Helpers*: 3 Present (₹550/day)
   - **Today's Estimated Wage Incurred**: `₹9,550`.
   - **Cumulative Project Labor**: `248 Man-Days Total • ₹2,18,500 Total Labor Cost`.
   - Action: `[Manage Site Workforce / Attendance →]`.
2. **Documents & Quick Blueprints**:
   - 1-click preview cards for critical site blueprints:
     - `velmurugan_false_ceiling_layout_v3.pdf` (Architectural CAD sheet)
     - `3d_living_room_render_final.jpg` (High-res 3D elevation visual)
     - `client_handover_agreement_signed.pdf`
   - Action: `[+ Upload New File]`.
3. **Recent Activity Audit Feed**:
   - Real-time timestamped log:
     - *10:15 AM Today*: Daily site attendance logged (12 workers present).
     - *Yesterday 4:30 PM*: Customer payment of `₹3,00,000` recorded (NEFT-8921).
     - *28 Sep 2026*: Purchase order `PUR-2026-0089` approved.

---

### Responsive Behavior (Desktop vs Tablet vs Mobile)
- **Desktop (>=1024px)**: 12-column layout with 4-card finance strip across top, 7-column execution stream on left, and 5-column workforce/document vault on right.
- **Tablet (768px - 1023px)**: 2-column stacked layout with full-width financial cards in a 2x2 grid.
- **Mobile (<768px)**:
  - Header actions collapse into `+ Quick Add` floating button and kebab `More` sheet.
  - Tabs become horizontally scrollable pills with active Warm Gold indicator.
  - Financial Ribbon displays as swipeable cards or 2x2 compact matrix.
  - Large touch-target cards for daily reports, workforce status, and purchases.
  - 1-tap call button for Supervisor and Customer directly from top banner.

---

#### Page 3.3: Work Progress Management (`/projects/:id/progress`)
- **Purpose**: Field-tested construction milestone and physical execution tracker. Enables site engineers and project managers to track, update, and audit physical work items by trade (Civil, Electrical, False Ceiling, Woodwork, Finishing) with verifiable proof, without looking like an abstract SaaS analytics dashboard.
- **Header**:
  - **Project Name & Monospace Code**: `Velmurugan Villa Interiors • PRJ-2026-0012`
  - **Overall Physical Progress Banner**:
    - Headline: `68% Physical Progress` (Large 28px Plus Jakarta Sans bold)
    - Milestone Subtitle: `14 of 21 work items completed • 4 in progress • 3 pending`
    - High-contrast visual progress bar: 12px tall Warm Gold (`#C99A2E`) fill on Stone (`#EFECE6`) track.
    - Quick Trade Filter Pills: `All (21)` • `False Ceiling (4)` • `Interior Woodwork (8)` • `Electrical & Lighting (5)` • `Civil & Tiling (4)`
- **Work Items Progress Cards (Construction Grid)**:
  - Displayed as structured, high-contrast job cards organized by trade division:
  - **Card Structure**:
    1. **Top Row**:
       - Work Item Title: e.g. *Living Room False Ceiling & Cove Channel Framing* (16px bold Charcoal).
       - Trade Tag: Pill badge e.g. `[False Ceiling & Lighting]` (soft gold tint `#F9F3E5` with `#C99A2E` text).
       - Status Badge: Semantic status pill with 6px dot:
         - `● Completed` (Emerald Forest `#1E6B37` on `#EAF5EE`)
         - `● In Progress` (Warm Gold `#C99A2E` on `#FEF5E7`)
         - `● Pending` (Slate Grey `#55595D` on `#F1F3F5`)
         - `● Blocked / Delayed` (Brick Crimson `#9E2A2B` on `#FCEEEE`)
    2. **Middle Section — Physical Progress Indicator**:
       - Horizontal progress bar: Smooth 8px bar (Gold for in-progress, Green for 100% complete).
       - Percentage Readout: Prominent tabular numeral e.g. `85%`.
       - Scope Quantity Checklist: e.g. *720 of 850 Sq.ft completed*.
    3. **Bottom Audit Row**:
       - Last Updated: e.g. *Updated today, 4:15 PM by M. Suresh (Site Engg)*.
       - Latest Site Remark snippet: *"Perimeter channels anchored. Gypsum screw fastening underway."*
       - Photo Proof Indicator: Camera icon with count e.g. `2 Site Photos Attached`.
    4. **Primary Card Action**:
       - `[Update Progress]` button (Secondary white button with Deep Maroon border `#4A0E0E` on desktop; full-width 48px touch button on mobile).
- **"Update Progress" Action Modal / Bottom Sheet**:
  - **Trigger**: Clicking `[Update Progress]` on any card.
  - **Controls**:
    - **Progress % Quick Chips**: Large 48px touch chips for instant increment: `[25%]`, `[50%]`, `[75%]`, `[90%]`, `[100% Completed]`, or direct numeric slider.
    - **Physical Status**: Segmented toggle: `In Progress` | `Completed` | `Blocked / Issue`.
    - **Field Inspection Notes**: Textarea for supervisor observations (e.g., *"Cove lighting wiring completed by electrician; ready for final gypsum board jointing tape and putty coat"*).
    - **Direct Site Photo Upload**: Direct camera hardware hook `[+ Capture Site Photo]` to attach 1–2 timestamped verification photos.
    - **Action Buttons**: `[Cancel]` (Ghost) and `[Save Progress Update]` (Deep Maroon `#4A0E0E` primary button).
- **Mobile Field Experience (<768px)**:
  - Clean vertical stack of full-width touch cards.
  - Progress updates open a native swipeable bottom sheet optimized for one-thumb field use.
  - 48px minimum touch clearance on all numeric chips and buttons.
  - Offline sync safety: Progress updates made in basement or low-connectivity zones are cached locally and synchronized upon network reconnection.

---

#### Page 3.4: Daily Site Reports Listing (`/daily-reports`)
- **Purpose**: Daily operational logbook capturing on-site activities across all active projects. Serves as the primary source of truth for physical work accomplished, supervisor observations, daily workforce headcounts, and verified site photos.
- **Header**:
  - Title: `Daily Site Reports`
  - Subtitle: *"Field supervisor logs, daily workforce muster, site execution records, and photo documentation."*
  - Primary CTA: `[+ Daily Report]` (Deep Maroon `#4A0E0E` button, 1px border `#380A0A`).
- **Toolbar & Filter Controls**:
  - **Project Filter**: Dropdown with search (`All Projects (8 Active)` or select specific project).
  - **Date Filter**: Quick date pill selector (`Today` • `Yesterday` • `This Week` • `Custom Date Range`).
  - **Supervisor Filter**: Dropdown to filter by reporting site engineer (`All Supervisors` • `M. Suresh` • `R. Vignesh`).
  - **Search Input**: Text search across work completed notes and obstacle descriptions.
- **Desktop Table & List Presentation**:
  - High-density tabular layout with structured columns:
  1. **Report Date**: Tabular date format (`01 Oct 2026, Thu`) with time filed (`5:45 PM`).
  2. **Project**: Bold project title (*Velmurugan Villa Interiors*) with monospace ID link (`PRJ-2026-0012`).
  3. **Supervisor**: Supervisor avatar circle + name (*M. Suresh - Site Engg*).
  4. **Workers Headcount**: Pill badge displaying total count + trade breakdown (`12 Workers: 4 Masons, 5 Carpenters, 3 Helpers`).
  5. **Work Completed**: Truncated 2-line summary (*"Living room false ceiling perimeter channels anchored. Profile light grooves cut. Bedroom drywall framing 80% done."*).
  6. **Photos**: Mini thumbnail strip displaying up to 3 site photos + counter badge (`+2 more`). Hovering expands a quick preview; clicking opens the full-screen photo lightbox.
  7. **Status**: Semantic status badge with 6px dot:
     - `● Approved`: Verified by Project Lead / MD (Emerald `#1E6B37` on `#EAF5EE`).
     - `● Submitted`: Pending review (Warm Gold `#C99A2E` on `#FEF5E7`).
     - `● Needs Review`: Flagged with issue or obstacle (Brick Crimson `#9E2A2B` on `#FCEEEE`).
  8. **Action**: `View Report →` link button.
- **Interactive Row Behavior**:
  - Entire table row is clickable and routes directly to `Daily Report Detail` (`/daily-reports/:id`).
- **Mobile Responsive Layout (Date-First Field Cards)**:
  - On mobile devices (`<1024px`), the view shifts to a **date-first card presentation** optimized for field supervisors and business owners reviewing reports on the road:
  - **Card Structure**:
    - **Top Row**: 
      - Left: Date block with bold calendar badge (`01 OCT • THU`).
      - Right: Status badge (`● Submitted` or `● Approved`).
    - **Project & Supervisor Row**:
      - Project Name: 16px bold Plus Jakarta Sans (*Velmurugan Villa Interiors*).
      - Supervisor snippet: *M. Suresh • Filed at 5:45 PM*.
    - **Workforce Chip Strip**:
      - Pill tag: `👷 12 Workers on site` (4 Masons, 5 Carpenters, 3 Helpers).
    - **Work Completed Snippet**:
      - 3-line clear reading text describing site progress in plain language.
    - **Photo Reel**:
      - Horizontal swipeable thumbnail strip (72x72px square thumbnails with rounded corners).
    - **Touch Affordance**: Minimum 48px touch clearance across entire card surface with subtle right chevron (`>`).
- **Empty State**:
  - Clipboard icon with message: *"No site reports filed for this date"*.
  - Prompt: *"Field supervisors have not submitted reports yet for today. Tap below to log site progress."*
  - CTA button: `[+ File Today's Report]`.

#### Page 3.5: Central Documents & Digital Assets Vault (`/documents`)
- **Purpose**: Unified corporate digital repository for blueprints, engineering drawings, statutory approvals, contracts, billing documents, and site progress media. Provides structured document management across projects, customers, suppliers, and workforce personnel.
- **Header & Master Action Bar**:
  - **Page Title**: `Documents` (24px bold Plus Jakarta Sans)
  - **Subtitle**: *"Central repository for architectural blueprints, statutory approvals, commercial agreements, invoices, and site photos."*
  - **Primary CTA**: `[+ Upload Document]` (Deep Maroon `#4A0E0E` button with upload icon)
- **Top Filter & Search Bar**:
  - **Search Input**: Full-text search across filename, tags, and linked entity names.
  - **Category Filter (Horizontal Pills with Count Badges)**:
    - `All Documents (142)`
    - `Building Plan (24)`
    - `3D Plan (18)`
    - `3D Elevation (15)`
    - `Approval Document (12)`
    - `Estimate (19)`
    - `Agreement (8)`
    - `Invoice (22)`
    - `Receipt (14)`
    - `Payment Proof (6)`
    - `Site Photo (38)`
    - `Other (7)`
  - **Entity / Project Filter**: Dropdown filtering by specific project, customer, supplier, or employee.
  - **File Type Filter**: `All Types`, `PDF`, `Images (JPG, PNG, WEBP)`, `Spreadsheets (XLSX)`, `Documents (DOCX)`.
  - **View Toggle**: Grid View (Visual Cards - Default) vs Tabular List View.

- **Visual Document Card Specification**:
  - Container: 1px architectural border `#E2DDD5`, pure white background `#FFFFFF`, rounded corners (`rounded-lg`), subtle hover lift (`shadow-sm`).
  - **Card Header / Preview Canvas (Height: 140px)**:
    - For Images (`jpg`, `png`, `webp`): High-resolution crisp image thumbnail with aspect-ratio fill and subtle gradient overlay.
    - For Blueprints / PDF (`pdf`): First-page vector preview or distinguished PDF icon with page count badge.
    - For Spreadsheets (`xlsx`): Muted emerald document badge with grid icon.
    - For Word Docs (`docx`): Muted navy document badge with text icon.
    - **Category Badge (Top Left Overlay)**: Translucent dark badge (e.g., `Building Plan`, `3D Elevation`, `Agreement`).
    - **File Size & Type Tag (Top Right Overlay)**: Compact badge (e.g., `PDF • 4.2 MB`, `JPG • 2.8 MB`).
  - **Card Body (Metadata)**:
    - **Filename**: Bold 14px Charcoal (`text-[#242424]`), single line with ellipsis (e.g., `Structural_Ground_Floor_Plan_v2.pdf`). Tooltip reveals full filename.
    - **Linked Entity**: Clickable entity badge with trade/project icon (e.g., `PRJ-2026-0001: Dr. Arun Kumar Res.` or `CUST-002: Priya R.` or `SUP-001: Sri Lakshmi Steel`).
    - **Upload Metadata**: Timestamp with uploader name (e.g., `Uploaded 02 Oct 2026 by Er. Sundar (Project Manager)`).
    - **Security & Privacy Indicator**: Muted lock icon indicating internal encrypted Supabase storage.
  - **Card Actions Toolbar (Bottom Pin)**:
    - `[Preview]`: Opens full-screen lightbox / document previewer (zoom, pan, multi-page PDF navigation, image comparison).
    - `[Download]`: Direct secure download using short-lived signed Supabase Storage URL.
    - `[Delete]` (Conditional): Red trash icon, **strictly role-gated** (visible and active only for Owner/Manager roles; disabled/hidden for field supervisors). Prompts a 2-step confirmation modal: *"Are you sure you want to delete this document? This action cannot be undone."*

- **Upload Modal & Drag-and-Drop Experience**:
  - Triggered via `[+ Upload Document]` button or global Quick Add.
  - **Upload Area**:
    - **Desktop**: Large dashed border dropzone (`border-2 border-dashed border-[#C99A2E]/60 bg-[#F7F5F0] hover:bg-[#F9F3E5]`). Support for multi-file drag-and-drop.
    - **Mobile**: Quick dual-button interface: `[Take Photo / Camera]` and `[Choose from Gallery / Files]`.
    - **Native File Picker**: Standard OS browse button `[Browse Files]`.
  - **Strict Constraints & Validation**:
    - **Maximum File Size**: `15 MB` per file. Instant client-side validation displays an amber alert if a selected file exceeds 15 MB: *"File size exceeds 15 MB limit. Please compress drawing or photo."*
    - **Allowed Formats**: `.jpg`, `.png`, `.webp`, `.pdf`, `.docx`, `.xlsx`. Disallowed extensions are blocked immediately with clear error pill.
  - **Metadata Assignment Form (Per Upload)**:
    - **Category Dropdown (Mandatory)**: Select one of the 11 official categories (`Building Plan`, `3D Plan`, `3D Elevation`, `Approval Document`, `Estimate`, `Agreement`, `Invoice`, `Receipt`, `Payment Proof`, `Site Photo`, `Other`).
    - **Linked Entity (Mandatory)**: Select target `Project` (default if initiated from project detail) or `Customer`, `Supplier`, or `Employee`.
    - **Document Title / Description (Optional)**: Friendly caption or notes.
  - **Upload Progress**: Real-time progress bar with upload speed, bytes transferred, and green checkmark on completion.
- **Private-Document UX Standards**:
  - Watermark options for client-facing shared plans.
  - All files are stored in private Supabase Storage buckets with strict access policies. No public bucket URLs are ever exposed.

---

### MODULE 4: PROCUREMENT & SUPPLIERS

#### Page 4.1: Suppliers Directory (`/suppliers`)
- **Purpose**: Directory and commercial ledger overview for all material vendors, hardware merchants, plywood dealers, electrical distributors, and civil suppliers. Enables instant tracking of total purchases billed, payments disbursed, and outstanding vendor liabilities (Rule 18 compliant).
- **Header**:
  - Title: `Suppliers`
  - Subtitle: *"Manage material vendors, hardware distributors, and trade supplier balances."*
  - Primary CTA: `[+ New Supplier]` (Deep Maroon `#4A0E0E` button, 1px border `#380A0A`).
- **Toolbar & Filter Controls**:
  - **Search Input**: Full-width / 320px responsive input; searches across Supplier Name, Contact Person, Phone, and Shop Address.
  - **Category Filter Pills**: `All (18)` • `Plywood & Hardware (5)` • `Electrical & Lighting (4)` • `Civil Materials (6)` • `Paints & Putty (3)`.
  - **Balance Filter**: Quick toggle to show: `All Suppliers` • `With Outstanding Dues (12)` • `Fully Settled (6)`.
- **Desktop Table Specification**:
  - High-density architectural table with crisp 1px borders and tabular numerals:
  1. **Supplier**:
     - Vendor Shop Name: 14px bold Plus Jakarta Sans (*Sri Balaji Hardware & Plywoods*).
     - Category Tag: Pill badge e.g. `[Plywood & Hardware]` (soft gold tint `#F9F3E5` with `#C99A2E` text).
     - Contact Person snippet: *Proprietor: R. Balakrishnan*.
  2. **Phone**:
     - Phone number in tabular font: `+91 94431 87654`.
     - Direct action icons: Phone call icon + WhatsApp icon with pre-filled message hook.
  3. **Purchases**:
     - Total cumulative purchases billed across all projects in Indian currency: `₹4,25,000`.
  4. **Payments**:
     - Total cumulative payments disbursed to vendor: `₹3,15,000` (Emerald Forest `#1E6B37`).
  5. **Outstanding**:
     - Pending vendor liability: `₹1,10,000`.
     - Visual cue: Highlighted in bold Brick Crimson (`#9E2A2B` on `#FCEEEE`) when > ₹0; muted stone (`₹0`) when completely settled.
  6. **Status**:
     - Semantic badge with 6px dot: `● Active` (Emerald) or `● Inactive` (Slate Grey).
  7. **Actions**:
     - `[...]` menu button (`View Supplier Detail`, `Record Payment Allocation`, `Create Purchase Bill`, `Edit Contact`).
- **Interactive Row Behavior**:
  - Entire table row is clickable and navigates directly to `Supplier Detail` (`/suppliers/:id`).
- **Mobile Responsive Layout (Supplier Cards)**:
  - On mobile devices (`<1024px`), table rows transform into high-contrast vendor cards:
  - **Card Structure**:
    - **Header Row**: Supplier Name (16px bold) + Status Badge (top right).
    - **Category & Contact Strip**:
      - Trade Category Pill (`[Electrical & Lighting]`).
      - Contact Person name + 1-tap phone and WhatsApp buttons (48px touch target).
    - **Financial Matrix (3-Column Clean Tile)**:
      - `Purchases`: `₹4,25,000` (Tabular Charcoal)
      - `Paid`: `₹3,15,000` (Forest Emerald)
      - `Outstanding`: `₹1,10,000` (Bold Brick Crimson with soft red background)
    - **Card Affordance**: Minimum 48px touch clearance across entire card surface with subtle right chevron (`>`), tap opens `/suppliers/:id`.
- **Empty State**:
  - Truck/Box icon with title: *"No suppliers registered yet"*.
  - Description: *"Add your local hardware merchants, cement dealers, and lighting suppliers to start tracking material purchases and payments."*
  - Action button: `[+ Add First Supplier]`.

---

#### Page 4.2: Supplier Detail Command Center (`/suppliers/:id`)
- **Purpose**: Comprehensive commercial profile, purchase history, payment disbursement ledger, and statement of accounts for a single material supplier.
- **Header**:
  - Breadcrumb: `Suppliers / Sri Balaji Hardware & Plywoods`
  - Supplier Title: `Sri Balaji Hardware & Plywoods` (24px bold Plus Jakarta Sans)
  - Category Badge: `[Plywood & Hardware]` (Gold tinted pill)
  - Status Badge: `● Active` (Emerald pill)
  - Contact Snippet: *Proprietor: R. Balakrishnan • 📞 +91 94431 87654*
  - Action Controls:
    - Primary Action: `[Record Supplier Payment]` (Deep Maroon `#4A0E0E` button, 1px border `#380A0A`).
    - Secondary Actions: `[+ Add Purchase]`, `[Edit Profile]`, `[Download Statement PDF]`.
- **Top Financial Summary (3 High-Contrast Cards — Rule 18 Compliant)**:
  1. **Total Purchases**:
     - Headline: `₹4,25,000` (Tabular Charcoal)
     - Caption: `14 Purchase bills recorded across 3 projects`
  2. **Total Payments**:
     - Headline: `₹3,15,000` (Emerald Forest `#1E6B37`)
     - Caption: `74.1% of total billed purchases cleared`
  3. **Outstanding Balance Due**:
     - Headline: `₹1,10,000` (Bold Brick Crimson `#9E2A2B` on soft pink `#FCEEEE`)
     - Caption: `Unpaid vendor liability • 2 bills pending settlement`
- **Master Navigation Tabs (5 Workspaces)**:
  1. `Overview` (Master Profile & Quick Snapshots)
  2. `Purchases` (All purchase orders, vendor invoices & delivery receipts)
  3. `Payments` (All payment disbursement vouchers & bank UTRs)
  4. `Documents` (GST certificate, price lists, bill scans)
  5. `Activity` (Audit trail of bills created and payments settled)

---

### Tab Breakdowns:

#### Tab 1: Overview
- **Left Column: Supplier Commercial Profile Card**:
  - `Contact Person`: *R. Balakrishnan (Proprietor)*
  - `Phone Number`: `+91 94431 87654` (with 1-tap Call and WhatsApp shortcuts)
  - `Email`: `balajihardware.mdu@gmail.com`
  - `Shop Address`: *48, West Masi Street, Madurai - 625001*
  - `GSTIN`: `33AAAAA0000A1Z5`
  - `Banking & UPI Details`:
    - Bank: *HDFC Bank, West Masi Branch*
    - Account No: `50200012345678` | IFSC: `HDFC0000123`
    - UPI ID: `balajihardware@okaxis` (with copy-to-clipboard button)
- **Right Column: Recent Purchases & Recent Payments**:
  - **Recent Purchases Mini-Table**: Shows last 3 bills with Bill No, Project Name, Amount, and status badge.
  - **Recent Payments Mini-Table**: Shows last 3 disbursements with Voucher No, Date, Payment Mode (NEFT/UPI/Cheque), and Amount.
  - **Projects Supplied**: Badges showing projects utilizing materials from this vendor (*Velmurugan Villa Interiors*, *Kavitha Residence*).

#### Tab 2: Purchases
- Complete chronological table of all purchase transactions:
  - Columns: Purchase No (`PUR-2026-0089`), Bill Date, Vendor Invoice/Challan No, Project Allocated, Material Description, Total Amount (₹), Payment Status (`Paid`, `Partially Paid`, `Unpaid`), Delivery State (`Delivered`, `Partial`, `Pending`).
  - Action: Click row to view full Purchase Voucher with material line items.

#### Tab 3: Payments (Disbursement Ledger)
- Chronological list of payments made to this supplier:
  - Columns: Payment Voucher No (`SPAY-2026-0034`), Payment Date, Amount Paid (₹ in Emerald), Payment Mode (`NEFT`, `UPI`, `Cheque`, `Cash`), Bank / Reference UTR No, Bills Allocated, Receipt Attachment icon.
  - Action: `[View Payment Receipt]`.

#### Tab 4: Documents
- Grid of vendor-associated files:
  - Scanned GST Certificate PDF
  - Current Trade Price List / Quotation sheet (PDF)
  - Vendor Cancelled Cheque image
  - Physical bill carbon-copy scans
  - Action: `[+ Upload Document]`.

#### Tab 5: Activity
- Real-time audit stream:
  - *Today, 11:30 AM*: Payment `SPAY-2026-0034` of `₹50,000` recorded by Admin (NEFT Ref: 2026100198).
  - *28 Sep 2026*: Purchase `PUR-2026-0089` (`₹24,600`) created and allocated to *Velmurugan Villa Interiors*.

---

- **Mobile Layout**:
  - Full-screen stacked cards with sticky bottom primary CTA: `[Record Supplier Payment]`.
  - 1-tap phone and WhatsApp buttons in profile header.
  - Horizontally swipeable tabs with Warm Gold indicator.

#### Page 4.3: Materials Master-Data Directory (`/materials`)
- **Purpose**: Centralized reference catalog and master-data dictionary for all standard construction, interior, electrical, and civil materials. Provides standard measurement units and market reference rates used across Estimates and Purchase Bills. 
- **MVP Architectural Scope Guard**: Strictly designed as a master-data reference interface; full warehouse stock keeping, batch tracking, and inventory depletion calculations are intentionally excluded from MVP scope.
- **Header**:
  - Title: `Materials`
  - Subtitle: *"Standard construction material catalog, reference procurement rates, and measurement units."*
  - Scope Pill: `Master Reference Catalog` (Neutral stone badge)
  - Primary CTA: `[+ New Material]` (Deep Maroon `#4A0E0E` button, 1px border `#380A0A`).
- **Toolbar & Filter Controls**:
  - **Search Input**: Full-width / 320px responsive input; searches across Material Name, Brand, Specifications, and Code.
  - **Trade Category Filter Pills**: `All (42)` • `Civil & Masonry (12)` • `Plywood & Boards (8)` • `False Ceiling (6)` • `Electrical & Lighting (10)` • `Paints & Putty (6)`.
  - **Status Filter**: Segmented tabs `All` • `Active (38)` • `Inactive (4)`.
- **Desktop Table Specification**:
  - Clean, high-density architectural master-data table:
  1. **Material**:
     - Name: 14px bold Plus Jakarta Sans (*Saint-Gobain Gypsum Board 12.5mm*).
     - Code / SKU: Monospace snippet `MAT-FC-0012` • Brand: *Saint-Gobain Gyproc*.
  2. **Category**:
     - Trade Category Pill Badge: `[False Ceiling]` (Soft gold tint `#F9F3E5` with `#C99A2E` text).
  3. **Unit**:
     - Standard Measurement Unit Pill: `Sheets` (Clean architectural outline tag).
     - Other standard units in system: `Bags`, `Coils`, `Sq.ft`, `R.ft`, `Nos`, `Liters`, `Tons`, `Cum`.
  4. **Reference Information**:
     - **Market Reference Rate**: `₹480.00 / Sheet` (Tabular Charcoal, updated monthly).
     - **Technical Spec**: *6ft × 4ft (24 Sq.ft/sheet) • Tapered edge*.
     - **Preferred Supplier**: *Sri Balaji Hardware & Plywoods* (link to supplier profile).
  5. **Status**:
     - Semantic badge with 6px dot: `● Active` (Emerald) or `● Inactive` (Slate Grey).
  6. **Actions**:
     - `Edit` (Pencil icon opens edit drawer).
     - `[...]` menu (`Update Reference Rate`, `View Recent Purchases with this Material`, `Deactivate`).
- **Mobile Responsive Layout (Material Reference Cards)**:
  - Table collapses into compact reference cards on viewports `<1024px`:
  - **Card Structure**:
    - **Top Row**: Material Name (15px bold) + Category Tag + Status Badge.
    - **Reference Rate & Unit**:
      - `Ref Rate`: `₹480.00` per `Sheet` (Highlighted with subtle Warm Gold accent).
    - **Technical Spec & Preferred Vendor**:
      - Dimensions: *6ft × 4ft (12.5mm)*.
      - Vendor: *Sri Balaji Hardware*.
    - **Touch Actions**: Large 44px `[Edit]` button and quick-view drawer.
- **Drawer: "Add / Edit Material Master Item"**:
  - Slide-over drawer (450px desktop, full-screen mobile):
    - Material Name (Required text, e.g. *UltraTech Super Cement*)
    - Brand Name (e.g. *UltraTech*)
    - Category (Dropdown: *Civil*, *Plywood*, *False Ceiling*, *Electrical*, *Paint*, *Hardware*)
    - Standard Unit (Dropdown: *Bags*, *Sheets*, *Coils*, *Sq.ft*, *R.ft*, *Nos*, *Liters*, *Tons*)
    - Reference Unit Rate (₹ numeric input with `inputMode="decimal"`)
    - Standard Pack / Dimensions Description (e.g. *50 Kg HDPE bag*, *8ft x 4ft sheet*)
    - Preferred Supplier (Optional dropdown linked to `/suppliers`)
    - Active Status toggle (Checked by default)
    - Action Buttons: `[Cancel]` and `[Save Material]`.

#### Page 4.4: Purchases Listing (`/purchases`)
- **Purpose**: Master procurement ledger tracking all material purchase orders, vendor invoices, delivery status, and project cost allocations. Directly feeds into Recorded Project Cost under Rule 18 non-netting standards.
- **Header**:
  - Title: `Purchases`
  - Subtitle: *"Material purchase orders, vendor tax invoices, project cost allocation, and payment settlement status."*
  - Primary CTA: `[+ Add Purchase]` (Deep Maroon `#4A0E0E` button, 1px border `#380A0A`).
- **Toolbar & Filter Controls**:
  - **Search Input**: Responsive search input; searches across Purchase No (`PUR-...`), Supplier Name, Project Name, and Vendor Invoice/Challan No.
  - **Supplier Filter**: Searchable dropdown (`All Suppliers (18)` or filter by vendor).
  - **Project Filter**: Dropdown to isolate purchases for a specific site (`All Projects (8 Active)` • *Velmurugan Villa* • *Kavitha Residence*).
  - **Date Filter Pills**: Segmented presets `All` • `Today` • `This Week` • `This Month` • `Custom Range 📅`.
  - **Payment Status Filter**: Horizontal pills with counts: `All (34)` • `Paid (18)` • `Partially Paid (6)` • `Unpaid (8)` • `Draft (2)`.
- **Desktop Table Specification**:
  - High-density tabular layout with architectural borders and tabular numerals:
  1. **Purchase No**:
     - Monospace code: `PUR-2026-0089` (Clickable link to Purchase Detail).
  2. **Supplier**:
     - Shop Name: 14px bold Plus Jakarta Sans (*Sri Balaji Hardware & Plywoods*).
  3. **Project**:
     - Allocated Project: Clickable project link (*Velmurugan Villa Interiors* • `PRJ-2026-0012`).
  4. **Date**:
     - Bill / Procurement Date: Tabular numeral `28 Sep 2026`.
  5. **Invoice**:
     - Vendor Tax Invoice / Delivery Challan No: `INV-8921` + paperclip icon indicating uploaded bill scan.
  6. **Total**:
     - Total Billed Amount in Indian currency: `₹24,600` (Tabular Charcoal bold).
  7. **Allocated**:
     - Payments Disbursed & Applied: `₹0` (or `₹24,600` in Emerald Forest `#1E6B37`).
  8. **Outstanding**:
     - Remaining Unpaid Balance on this bill: `₹24,600`.
     - Visual cue: Highlighted in bold Brick Crimson (`#9E2A2B` on `#FCEEEE`) when > ₹0; muted stone (`₹0`) when settled.
  9. **Status**:
     - Semantic badge with 6px dot:
       - `● Paid`: Emerald Forest (`#1E6B37` on `#EAF5EE`).
       - `● Partially Paid`: Warm Gold (`#C99A2E` on `#FEF5E7`).
       - `● Unpaid`: Brick Crimson (`#9E2A2B` on `#FCEEEE`).
       - `● Draft`: Slate Grey (`#55595D` on `#F1F3F5`).
  10. **Actions**:
      - `[...]` menu button (`View Purchase Detail`, `Allocate Payment`, `Download Voucher PDF`, `Edit Draft`).
- **Interactive Row Behavior**:
  - Entire table row is clickable and navigates directly to `Purchase Detail` (`/purchases/:id`).
- **Mobile Responsive Layout (Purchase Cards)**:
  - On mobile viewports (`<1024px`), table rows transform into compact procurement cards:
  - **Card Structure**:
    - **Header Row**: Purchase No (`PUR-2026-0089`) + Status Badge (`● Unpaid`).
    - **Supplier & Project Meta**:
      - Supplier: 15px bold (*Sri Balaji Hardware & Plywoods*).
      - Project: *Velmurugan Villa Interiors*.
    - **Date & Invoice Strip**:
      - `Date: 28 Sep 2026` • `Invoice: INV-8921` (with paperclip icon).
    - **Financial Matrix (3-Column Clean Tile)**:
      - `Total Bill`: `₹24,600` (Charcoal)
      - `Paid`: `₹0`
      - `Outstanding`: `₹24,600` (Bold Brick Crimson with soft red background)
    - **Card Affordance**: Minimum 48px touch clearance across entire card surface with subtle right chevron (`>`), tap opens `/purchases/:id`.
- **Empty State**:
  - Receipt/Document icon with title: *"No purchase bills recorded for this filter"*.
  - Description: *"Log material purchases, vendor bills, and site delivery receipts to track project costs."*
  - CTA button: `[+ Add First Purchase]`.

---

#### Page 4.5: Purchase Detail View (`/purchases/:id`)
- **Purpose**: Comprehensive purchase voucher view detailing procured materials, line items, project cost attribution, attached physical invoices, and payment settlement allocations.
- **Header**:
  - Breadcrumb: `Purchases / PUR-2026-0089`
  - Purchase Code: `PUR-2026-0089` (Monospace bold)
  - Status Badge: `● Unpaid` (Brick Crimson pill) or `● Paid` (Emerald pill)
  - Action Controls:
    - Primary Action: `[Record Payment]` (Deep Maroon `#4A0E0E` button, opens modal to settle this bill).
    - Secondary Action: `[Allocate Payment]` (Outline button to match from existing unallocated vendor advance).
    - Attachment Action: `[+ Add Document]` (Upload additional delivery slip, invoice, or site receipt).
- **Core Meta Strip (Architectural Card)**:
  - **Supplier**: *Sri Balaji Hardware & Plywoods* (Clickable link to `/suppliers/:id`, with phone & address).
  - **Allocated Project**: *Velmurugan Villa Interiors* (Clickable link to `/projects/:id`).
  - **Vendor Invoice Number**: `INV-8921` (Delivery Challan Ref: `DC-4019`).
  - **Purchase Date**: `28 Sep 2026` (Recorded by: *Admin User*).
- **Material Line Items Table (Bill of Materials)**:
  - Clean engineering table with tabular alignments:
  | # | Material Item Description | Quantity | Unit | Unit Rate (₹) | Total Amount (₹) |
  | :- | :--- | :- | :- | :- | :- |
  | 1 | Saint-Gobain Gyproc 12.5mm Gypsum Board (6x4) | 60 | Sheets | ₹410.00 | ₹24,600.00 |
  - Subtotal: `₹24,600.00`
  - Tax / Freight Adjustments: `₹0.00`
  - Total Bill Amount: `₹24,600.00` (*Rupees Twenty Four Thousand Six Hundred Only*)
- **Financial Settlement Box (Rule 18 Compliant)**:
  - 3-card horizontal summary:
    1. **Purchase Total**: `₹24,600` (Agreed material bill value)
    2. **Allocated Payments**: `₹0` (No payment vouchers matched yet)
    3. **Outstanding Due**: `₹24,600` (Bold Brick Crimson `#9E2A2B` on `#FCEEEE`)
- **Documents & Verification Vault**:
  - Grid of attached verification documents:
    1. **Vendor Tax Invoice Scan**: High-resolution image/PDF preview of original paper bill (`INV-8921_scan.jpg`) with zoom modal.
    2. **Payment Receipt / Advice**: Downloadable payment voucher PDF (visible once payments are allocated).
    3. **Other Attachments**: Site unloading photo showing gypsum sheets stacked in the living room (`site_delivery_proof_28sep.jpg`) and signed delivery challan copy.
    4. Upload Tile: `[+ Drag & Drop or Click to Attach New Document]`.
- **Payment Allocation History (Audit Sub-Table)**:
  - Displays any payment vouchers linked to this bill:
    - Voucher Code (`SPAY-0034`), Payment Date, Payment Mode (`NEFT`), Bank Reference (`UTR 2026...`), and Amount Allocated (`₹24,600`).
- **Mobile Responsive Layout**:
  - Sticky bottom action bar with `[Record Payment]` and `[Allocate Payment]`.
  - Line items formatted as stacked touch cards with 48px touch targets.
  - Direct camera attachment for uploading physical bills on site.

---

#### Page 4.6: Supplier Payments (`/supplier-payments`)
- **Purpose**: Dedicated disbursement ledger for vendor settlements, purchase bill allocations, and tracking unallocated vendor advances. 
- **Rule 18 & Isolation Guardrails**: Strictly restricted to material supplier and trade vendor disbursements. Customer receipts (`/customer-payments`) and employee wages/advances (`/employee-payments`) are strictly barred from this interface to prevent netting errors and cross-ledger contamination.
- **Header**:
  - Title: `Supplier Payments`
  - Subtitle: *"Vendor disbursement ledger, bank transaction references, and purchase bill allocations."*
  - Isolation Badge: `Material Vendor Outflows Only` (Slate neutral badge)
  - Primary CTA: `[Record Supplier Payment]` (Deep Maroon `#4A0E0E` button, 1px border `#380A0A`).
- **Toolbar & Filter Controls**:
  - **Search Input**: Full-width / 320px responsive input; searches across Supplier Name, Voucher Number (`SPAY-...`), Reference/UTR number, and Cheque numbers.
  - **Date Filter Pills**: `All` • `Today` • `This Week` • `This Month` • `Custom Date Range`.
  - **Allocation Status Filter**: `All Payments` • `Fully Allocated (18)` • `Partially Allocated (4)` • `Unallocated Advance (2)`.
  - **Payment Mode Filter**: `All Modes` • `NEFT / RTGS` • `UPI` • `Cheque` • `Cash`.
- **Desktop Table Specification (Clear Outflow Direction Styling)**:
  - Tabular layout with crisp 1px borders and distinct outbound payment semantics:
  1. **Date**:
     - Payment Date: Tabular numeral `01 Oct 2026` + Voucher Code `SPAY-2026-0034`.
  2. **Supplier**:
     - Name: 14px bold Plus Jakarta Sans (*Sri Balaji Hardware & Plywoods*).
     - Category Tag: `[Plywood & Hardware]`.
  3. **Amount (Outflow Styled)**:
     - Prominent outbound indicator: `↘ -₹50,000` (Charcoal text with Deep Maroon outbound arrow icon and negative prefix, explicitly declaring vendor cash outflow).
  4. **Reference**:
     - Payment Mode badge + Transaction Identifier:
       - `NEFT`: `UTR 202610019842` (HDFC Main Account)
       - `Cheque`: `Cheque #402918 (HDFC)`
       - `UPI`: `balaji@okaxis (Txn: 984210984)`
       - `Cash`: `Petty Cash Voucher #042`
  5. **Allocated**:
     - Amount matched against verified purchase bills: `₹50,000` (100% matched to `PUR-2026-0076`).
  6. **Unallocated**:
     - Excess disbursement / Advance credit retained with vendor:
       - `₹0` (Clean neutral stone when fully applied).
       - `₹15,000` (Highlighted with Warm Amber badge `Advance Credit` when payment exceeds billed purchases).
  7. **Status**:
     - Semantic status badge with 6px dot:
       - `● Fully Allocated`: Emerald Forest (`#1E6B37` on `#EAF5EE`).
       - `● Partially Allocated`: Warm Gold (`#C99A2E` on `#FEF5E7`).
       - `● Unallocated Advance`: Amber Ochre (`#B86E00` on `#FEF5E7`).
       - `● Void / Reversed`: Muted slate with strikethrough.
  8. **Actions**:
     - `View Receipt` (Icon button opens printable payment voucher).
     - `Reallocate` (Pencil icon to adjust purchase bill allocation).
- **Mobile Responsive Layout (Payment Outflow Cards)**:
  - On mobile viewports (`<1024px`), table rows transform into high-contrast disbursement cards:
  - **Card Structure**:
    - **Header Row**: Date (`01 Oct 2026`) + Status Badge (top right).
    - **Supplier Row**: Supplier Name (16px bold) + Category Pill.
    - **Disbursement Amount Block**:
      - Large 20px bold outbound figure: `↘ -₹50,000` in Charcoal with Deep Maroon accent.
      - Payment Mode & UTR snippet: `NEFT • HDFC • UTR: 202610019842`.
    - **Allocation Split Strip**:
      - `Allocated`: `₹50,000` (100%) | `Unallocated`: `₹0`.
    - **Touch Actions**: `[View Payment Receipt]` button (48px touch height).
- **Modal: "Record Supplier Payment" (Multi-Step Allocation)**:
  - Slide-in modal (650px desktop, full-screen mobile):
    1. **Select Supplier**: Searchable vendor dropdown. Instantly loads vendor's current balance: *"Current Outstanding Due: ₹1,10,000 across 2 bills"*.
    2. **Payment Details**:
       - Payment Date (defaults to today).
       - Total Amount Paid (₹ numeric input with `inputMode="decimal"`).
       - Payment Mode (Segmented toggle: `NEFT / RTGS` | `UPI` | `Cheque` | `Cash`).
       - Bank Account (Dropdown of company accounts: *HDFC Current A/c ...4819*).
       - Reference / UTR / Cheque Number (Required text).
    3. **Purchase Bill Allocation Table**:
       - Lists all unpaid purchase bills for this vendor with: Bill No, Date, Project Name, Bill Total, Pending Balance, and `Allocate Amount` input.
       - Quick CTA: `[Auto-Allocate Oldest Bills First]`.
       - Real-time Balance Tracker:
         - `Total Paid: ₹50,000`
         - `Total Allocated: ₹50,000`
         - `Remaining Unallocated (Advance): ₹0`
    4. **Notes & Attachment**: Upload scanned bank debit advice or cheque counterfoil.
    5. **Buttons**: `[Cancel]` and `[Confirm & Post Disbursement]` (Deep Maroon `#4A0E0E` primary button). Locking voucher upon confirmation.

### MODULE 5: WORKFORCE & LABOR MANAGEMENT

#### Page 5.1: Employees Directory (`/employees`)
- **Purpose**: Master workforce roster managing all site personnel, trade specialists (masons, carpenters, electricians, painters, helpers), and field supervisors. Provides immediate tracking of trade roles, contact numbers, active project assignments, and employment status.
- **Header**:
  - Title: `Employees`
  - Subtitle: *"Master workforce roster, trade classifications, active site assignments, and status."*
  - Primary CTA: `[+ New Employee]` (Deep Maroon `#4A0E0E` button, 1px border `#380A0A`).
- **Toolbar & Filter Controls**:
  - **Search Input**: Full-width / 320px responsive input; searches across Employee Name, Code (`EMP-...`), Phone, and Trade Role.
  - **Status Filter Segment**: `All (28)` • `Active (24)` • `Inactive (4)`.
  - **Role Filter Pills**: `All Roles` • `Master Carpenter (6)` • `Civil Mason (5)` • `Site Engineer (3)` • `Electrician (2)` • `Painter (3)` • `General Helper (5)`.
  - **Project Filter Dropdown**: `[ All Projects (8 Active) ▼ ]` (Filter workers by currently assigned job site).
- **Desktop Table Specification**:
  - High-density tabular layout with crisp 1px borders and trade badges:
  1. **Employee**:
     - Code & Name: Monospace tag `EMP-014` + 14px bold Plus Jakarta Sans (*Muthu Kumar*).
     - Avatar circle with trade initials or worker photo.
  2. **Role**:
     - Architectural trade pill badge: `[Master Carpenter]` (Warm Gold tint `#F9F3E5` with `#C99A2E` text).
     - Standard Wage Rate snippet: `₹950 / day` (Daily Wage) or `₹32,000 / mo` (Monthly Salary).
  3. **Phone**:
     - Contact Number: `+91 98401 54321`.
     - Direct action icons: Phone call icon + WhatsApp icon with 1-tap field connectivity.
  4. **Projects**:
     - Assigned Active Sites: Pill tag linking to project (*Velmurugan Villa Interiors* • `PRJ-2026-0012`).
     - Multi-site indicator if allocated across projects.
  5. **Status**:
     - Semantic badge with 6px dot: `● Active` (Emerald) or `● Inactive` (Slate Grey).
  6. **Actions**:
     - `[...]` menu button (`View Employee Profile`, `View Attendance History`, `Issue Advance`, `Settle Wages`, `Edit Profile`).
- **Interactive Row Behavior**:
  - Entire table row is clickable and navigates directly to `Employee Detail` (`/employees/:id`).
- **Mobile Responsive Layout (Employee Cards)**:
  - On mobile viewports (`<1024px`), table rows transform into high-contrast field worker cards:
  - **Card Structure**:
    - **Header Row**: Employee Name (16px bold) + Status Badge (top right).
    - **Code & Role Row**:
      - Code `EMP-014` • Trade Pill `[Master Carpenter]`.
      - Daily Wage indicator: `₹950 / day`.
    - **Contact Strip**:
      - `📞 +91 98401 54321` with large 48px touch targets for `[Call]` and `[WhatsApp]`.
    - **Assigned Project Strip**:
      - Project: *Velmurugan Villa Interiors* (with subtle site icon).
    - **Card Affordance**: Minimum 48px touch clearance across entire card surface with subtle right chevron (`>`), tap opens `/employees/:id`.
- **Empty State**:
  - Worker/Hardhat icon with title: *"No employees found"*.
  - Description: *"Add your site engineers, master masons, carpenters, and helpers to start tracking daily attendance and wages."*
  - CTA button: `[+ Add First Employee]`.

#### Page 5.2: Employee Detail View (`/employees/:id`)
- **Purpose**: Complete workforce profile, attendance history, daily wage accruals, advance tracking, and wage settlements.
- **Rule 18 Strict Non-Netting Financial Layout**: Wages (earned labor liabilities) and Advances (issued loans/recoveries) are presented in two visually distinct, independent pillars with separate calculation cards. The ERP strictly prohibits displaying a single netted figure.
- **Header**:
  - Breadcrumb: `Employees / EMP-014`
  - Name & Badge: `Muthu Kumar` (24px bold Plus Jakarta Sans) • `EMP-014` (Monospace tag)
  - Role: `[Master Carpenter]` (Warm Gold pill badge) • Wage Rate: `₹950 / day`
  - Status: `● Active` (Emerald pill)
  - Contact Snippet: `📞 +91 98401 54321` (with Call and WhatsApp shortcuts)
  - Action Controls:
    - Primary CTA: `[Record Wage Payment]` (Deep Maroon `#4A0E0E` button, 1px border `#380A0A`).
    - Secondary CTAs: `[Issue Cash Advance]`, `[Mark Attendance]`, `[Edit Profile]`.
- **Top Summary Matrix (Quick Operational Metrics)**:
  - 4-card horizontal pulse:
    1. **Attendance**: `26.0 Days` (`24 Full + 4 Half Days • 100% on-time record this month`)
    2. **Wages**: `₹24,700 Earned` (`₹6,700 Pending Settlement`)
    3. **Payments**: `₹18,000 Disbursed` (3 Payment vouchers)
    4. **Advances**: `₹3,000 Outstanding` (Issued ₹5,000 • Recovered ₹2,000)
- **Financial Summary (Strictly Separated Dual-Pillar Layout)**:
  - High-contrast visual grid with a permanent architectural dividing line:
  - **Pillar 1: Wage Account (Earned Labor Position)**:
    - Card 1.1: **Wages Earned**: `₹24,700` (Cumulative total from daily attendance and overtime)
    - Card 1.2: **Wages Paid**: `₹18,000` (Verified wage disbursements paid to worker in Emerald Forest `#1E6B37`)
    - Card 1.3: **Wage Payable**: `₹6,700` (Current pending wage owed to worker, highlighted in Warm Amber `#B86E00`)
  - **Pillar 2: Advance Account (Company Loan / Advance Position)**:
    - Card 2.1: **Advances Given**: `₹5,000` (Cumulative cash advances issued)
    - Card 2.2: **Advances Recovered**: `₹2,000` (Recoveries deducted from previous wage payouts)
    - Card 2.3: **Advance Outstanding**: `₹3,000` (Pending recovery due from worker, highlighted in Brick Crimson `#9E2A2B` on `#FCEEEE`)
- **Master Navigation Tabs (6 Dedicated Workspaces)**:
  1. `Overview` (Master Profile, Active Sites, Bank Details, Recent Slips)
  2. `Attendance` (Daily site muster log, calendar view, project site allocation)
  3. `Wages` (Detailed wage accrual ledger by day and project)
  4. `Advances` (Cash advance issuance and recovery deduction history)
  5. `Payments` (Wage disbursement vouchers and payment advice slips)
  6. `Documents` (Aadhaar KYC, trade certificates, bank passbook scans)

---

### Tab Breakdowns:

#### Tab 1: Overview
- **Left Column: Employee Identity & Bank Details**:
  - Full Name: *Muthu Kumar* | Code: `EMP-014`
  - Trade: *Master Carpenter (False Ceiling & Modular Woodwork)*
  - Employment Type: *Daily Wage Worker* (`₹950.00 / day`)
  - Phone: `+91 98401 54321` | Emergency Contact: `+91 94431 00223 (Brother)`
  - Current Assigned Site: *Velmurugan Villa Interiors* (`PRJ-2026-0012`)
  - Bank Account & UPI Details:
    - Bank: *State Bank of India, Madurai Main Branch*
    - Account No: `30491029384` | IFSC: `SBIN0000842`
    - UPI ID: `muthu98401@sbi` (with copy shortcut)
- **Right Column: Recent Activity & Quick Slips**:
  - Last 5 Days Attendance snippet with site name and wage earned.
  - Recent payment vouchers list.

#### Tab 2: Attendance
- Filterable monthly calendar and list view:
  - Columns: Date, Project Site, Status (`Present (1.0)`, `Half Day (0.5)`, `Absent (0.0)`), Overtime Hours, Daily Wage Earned (₹), Supervisor Marked By.

#### Tab 3: Wages
- Detailed wage accrual ledger showing how every rupee was earned:
  - Columns: Date, Site / Project, Task / Work Done, Daily Rate, Units Worked, Overtime Amount, Total Earned (₹), Settlement Status (`Settled`, `Payable`).

#### Tab 4: Advances
- Cash advance tracking ledger:
  - Columns: Advance No (`ADV-0056`), Date, Amount Issued (₹), Reason (*Family medical emergency*), Recovered to Date (₹), Pending Balance (₹), Status (`Partially Recovered`, `Active`).

#### Tab 5: Payments (Wage Settlements)
- Record of all wage settlement transactions:
  - Columns: Voucher No (`EPAY-0112`), Payment Date, Gross Wage Settled (`₹6,000`), Advance Recovery Deducted (`-₹1,000`), Net Cash Paid (`₹5,000`), Payment Mode (`Bank Transfer / UPI`), Advice Slip PDF download.

#### Tab 6: Documents
- Digital document repository:
  - Aadhaar Card Scanned Copy (Front & Back)
  - Worker Photograph
  - Bank Passbook front page copy
  - Trade certification / skill badge

---

#### Page 5.3: Attendance & Fast Field Muster (`/attendance`)
- **Purpose**: Rapid daily attendance recording and automated daily wage accrual designed specifically for one-handed mobile field operation by site engineers and supervisors. Eliminates repetitive manual typing: standard attendance for 20 workers takes under 20 seconds.
- **Top Controls (Fixed Sticky Header)**:
  - **Today Quick Button**: `[Today]` badge button that instantly snaps back to the current date.
  - **Date Stepper Selector**:
    - Central date display: `01 Oct 2026, Thu` with `< Yesterday` and `Tomorrow >` 44px tap targets.
    - Tapping the date opens a quick native calendar sheet.
  - **Project Selector**:
    - Searchable dropdown: `[ All Projects (Master Muster) ▼ ]` or isolate by specific site (`[ Velmurugan Villa Interiors (12 Workers) ▼ ]`).
    - Selecting a site automatically filters the worker list to staff assigned to that project.
  - **Quick Bulk Shortcut**: `[⚡ Mark All Present]` button (1-tap marks all active workers as Present, allowing supervisor to only change the 1 or 2 workers who took leave).
- **Live Muster Count Strip (Real-Time Counter)**:
  - Compact horizontal pulse bar:
    - `Present`: **15** (Emerald Forest `#1E6B37` on `#EAF5EE`)
    - `Half Day`: **2** (Warm Gold `#C99A2E` on `#FEF5E7`)
    - `Absent`: **1** (Brick Crimson `#9E2A2B` on `#FCEEEE`)
    - `Estimated Daily Wages Incurred`: **₹16,400.00** (Auto-computed from worker base rates)
- **Employee List & Segmented Touch Controls**:
  - Rendered as large, touch-first cards optimized for thumb sweeps:
  - **Worker Card Structure**:
    1. **Top Row**:
       - Worker Name: 16px bold Plus Jakarta Sans (*Muthu Kumar*).
       - Trade Role: Pill badge `[Master Carpenter]` (Soft gold tint).
       - Assigned Site: Snippet *Velmurugan Villa* • Wage Rate: `₹950/day`.
    2. **Attendance Segmented Control (3-Button Thumb Bar — 48px Height)**:
       - Full-width 3-way segmented button group designed for instant single-tap selection:
         - **`[ ✓ Present ]`**: When active: Solid Emerald Forest (`bg-[#1E6B37] text-white font-semibold`). Accrues 1.0 day wage (`₹950`).
         - **`[ ½ Half Day ]`**: When active: Solid Warm Gold (`bg-[#C99A2E] text-white font-semibold`). Accrues 0.5 day wage (`₹475`).
         - **`[ ✕ Absent ]`**: When active: Solid Brick Crimson (`bg-[#9E2A2B] text-white font-semibold`). Accrues 0.0 day wage (`₹0`).
       - When inactive: Clean white button with neutral 1px architectural border (`#E2DDD5`) and charcoal text.
    3. **Optional Overtime & Site Assignment Drawer (Zero Typing)**:
       - Expandable micro-strip: Tapping `[+ OT]` reveals 1-tap increment chips: `[+1 hr]` `[+2 hrs]` `[+3 hrs]` without opening the software keyboard.
- **Fixed Sticky Bottom Action Bar (Mobile & Desktop)**:
  - Docked persistently to the screen bottom above device home bar (`env(safe-area-inset-bottom)`):
  - **Left**: Live muster counter readout: `17 / 18 Present • ₹16,400 Wage`.
  - **Right**: High-priority primary CTA button:
    - `[Save Attendance]` (Deep Maroon `#4A0E0E` button, 1px border `#380A0A`, 52px mobile touch height, prominent checkmark icon).
  - Tapping `[Save Attendance]` triggers instant local save, plays subtle haptic feedback, displays green confirmation banner (*"Attendance for 01 Oct 2026 saved successfully"*), and syncs wage accruals.
- **One-Handed Usability Principles**:
  - The entire interaction is executable with a single thumb.
  - Zero mandatory text typing.
  - Generous 48px - 52px touch clearance prevents mis-taps on dusty job sites.
  - Offline mode: If internet drops on site, the sheet saves locally in browser IndexedDB/LocalStorage and syncs automatically when connection resumes.

#### Page 5.4: Wages Ledger (`/wages`)
- **Purpose**: Company-wide labor wage accrual and settlement register. Tracks gross wages earned through verified daily site attendance, disbursements paid, and outstanding wage payables owed to workers across active construction projects.
- **Rule 18 Strict Non-Netting Isolation**: Tracks **earned labor liabilities only**. Cash advances issued to workers are strictly excluded from this ledger and managed independently in `/advances`. Advance deductions occur strictly during wage settlement vouchers in `/employee-payments`.
- **Header**:
  - Title: `Wages`
  - Subtitle: *"Labor wage accruals from site attendance, disbursements paid, and pending wage liabilities."*
  - Isolation Badge: `Earned Labor Liabilities Only • Cash Advances Managed Separately` (Slate neutral badge)
  - Primary CTA: `[Record Wage Payment]` (Deep Maroon `#4A0E0E` button, 1px border `#380A0A`, routes to settlement modal).
- **Toolbar & Filter Controls**:
  - **Employee Filter**: Searchable dropdown (`All Workers (24 Active)` or filter by specific worker).
  - **Project Filter**: Dropdown to isolate labor costs for a specific site (`All Projects` • *Velmurugan Villa* • *Kavitha Residence*).
  - **Period Selector**: Segmented presets: `This Month (Oct 2026)` • `Last Month (Sep 2026)` • `This Week` • `Custom Date Range 📅`.
  - **Payable Status Filter**: `All Workers` • `With Wage Payable (16)` • `Fully Settled (8)`.
- **Top Financial Summary Cards (Labor Health Strip)**:
  - 3 high-contrast KPI cards:
    1. **Total Wages Earned**: `₹3,42,500` (Cumulative earned labor across all projects for the selected period).
    2. **Total Wages Paid**: `₹2,68,000` (Verified wage disbursements paid to workers, Emerald Forest `#1E6B37`).
    3. **Total Wage Payable**: `₹74,500` (Company earned wage liability owed to workers, highlighted in Warm Amber `#B86E00` on `#FEF5E7`).
- **Desktop Table Specification**:
  - High-density architectural ledger table with tabular numerals:
  1. **Employee**:
     - Name: 14px bold Plus Jakarta Sans (*Muthu Kumar*).
     - Code & Trade: Monospace `EMP-014` • Pill badge `[Master Carpenter]`.
  2. **Project**:
     - Allocated Site: Clickable project link (*Velmurugan Villa Interiors* • `PRJ-2026-0012`).
  3. **Period**:
     - Billing Period: `01 Sep 2026 – 30 Sep 2026` (`26.0 Man-Days worked`).
  4. **Wages Earned**:
     - Total labor wage accrued: `₹24,700` (Tabular Charcoal bold).
  5. **Wages Paid**:
     - Verified disbursements disbursed: `₹18,000` (Emerald Forest `#1E6B37`).
  6. **Outstanding (Wage Payable)**:
     - Unpaid earned wage liability: `₹6,700`.
     - Visual cue: Highlighted in bold Warm Amber (`#B86E00` on soft `#FEF5E7` pill badge) when > ₹0; clean neutral stone (`₹0`) when fully settled.
     - Advance Context Tooltip: *"Worker has ₹3,000 outstanding advance in /advances eligible for recovery deduction at settlement."*
  7. **Actions**:
     - `[Settle Wages]` (Deep Maroon `#4A0E0E` secondary button).
     - `[...]` menu (`View Attendance Log`, `View Wage Accrual History`, `Print Wage Statement`).
- **Interactive Row Behavior**:
  - Clicking any row navigates directly to the employee's dedicated wage tab: `/employees/:id?tab=wages`.
- **Mobile Responsive Layout (Wage Cards)**:
  - On mobile viewports (`<1024px`), table rows transform into high-contrast labor cards:
  - **Card Structure**:
    - **Header Row**: Worker Name (16px bold) + Trade Pill (top right).
    - **Project & Period**:
      - Project: *Velmurugan Villa Interiors*.
      - Period: *Sep 2026 (26.0 Days)*.
    - **Financial Matrix (3-Column Clean Tile)**:
      - `Wages Earned`: `₹24,700` (Charcoal)
      - `Wages Paid`: `₹18,000` (Emerald Forest)
      - `Wage Payable`: `₹6,700` (Bold Warm Amber with soft alert background)
    - **Action Button**: Full-width 48px touch button: `[Settle Wages]` with direct navigation to payment modal.
- **Empty State**:
  - Hardhat icon with title: *"No wage accruals found for this period"*.
  - Description: *"Log daily site attendance to automatically compute earned wages for your workforce."*
  - CTA button: `[+ Open Today's Attendance]`.

---

#### Page 5.5: Employee Advances (`/advances`)
- **Purpose**: Centralized ledger for tracking company cash loans and emergency advances issued to site workers, monitoring recovery deductions executed during wage payouts, and auditing outstanding advance balances.
- **Rule 18 Strict Non-Netting Isolation**: Advances represent company loan assets owed back by workers. They are **never combined, subtracted, or netted against Wage Payable** on this screen or in financial reports. Wages and advances remain strictly independent ledgers until active wage settlement vouchers in `/employee-payments`.
- **Header**:
  - Title: `Employee Advances`
  - Subtitle: *"Cash advance issuances, recovery tracking through wage payouts, and pending loan balances."*
  - Isolation Badge: `Cash Advances Only • Never Netted with Wage Payable` (Slate neutral badge)
  - Primary CTA: `[Record Advance]` (Deep Maroon `#4A0E0E` button, 1px border `#380A0A`, opens issuance modal).
- **Toolbar & Filter Controls**:
  - **Search Input**: Full-width / 320px responsive input; searches across Employee Name, Code (`EMP-...`), Advance Voucher (`ADV-...`), and Loan Reason.
  - **Status Filter Pills**: `All Advances (22)` • `Outstanding / Active (14)` • `Partially Recovered (5)` • `Fully Recovered (3)`.
  - **Trade Role Filter**: Dropdown (`All Trades` • *Carpenters*, *Masons*, *Helpers*).
  - **Date Filter Presets**: `This Month` • `Last Month` • `All Time` • `Custom Range 📅`.
- **Top Financial Summary Cards (3 High-Contrast KPI Cards — Rule 18 Compliant)**:
  1. **Total Advances Issued**:
     - Headline: `₹48,000.00` (Cumulative cash advances issued across workforce)
     - Caption: `22 Advance vouchers issued across 18 workers`
  2. **Total Recovered**:
     - Headline: `₹29,000.00` (Emerald Forest `#1E6B37`)
     - Caption: `60.4% recovered through payroll settlement deductions`
  3. **Outstanding Advances**:
     - Headline: `₹19,000.00` (Bold Brick Crimson `#9E2A2B` on `#FCEEEE`)
     - Caption: `Pending company asset owed back by workers (DUE)`
- **Desktop Table Specification**:
  - High-density architectural table with recovery progress visualizers:
  1. **Advance No**:
     - Monospace code: `ADV-2026-0056` (Clickable to view full advance voucher).
  2. **Employee**:
     - Name: 14px bold Plus Jakarta Sans (*Muthu Kumar*).
     - Code & Trade: Monospace `EMP-014` • Pill badge `[Master Carpenter]`.
  3. **Advance Date**:
     - Loan Issuance Date: Tabular numeral `15 Sep 2026`.
  4. **Amount**:
     - Principal Amount Issued in Indian currency: `₹5,000.00` (Tabular Charcoal bold).
  5. **Recovered**:
     - Deductions Recovered to Date: `₹2,000.00` (Emerald Forest `#1E6B37`).
     - Recovery Progress Visual: Compact 6px bar (`40% recovered`).
  6. **Outstanding**:
     - Remaining Loan Balance Due: `₹3,000.00`.
     - Visual cue: Highlighted in bold Brick Crimson (`#9E2A2B` on soft `#FCEEEE` badge) when > ₹0; clean neutral stone (`₹0`) when `Fully Recovered`.
  7. **Status**:
     - Semantic status badge with 6px dot:
       - `● Active`: Pending recovery, no deductions made yet (Warm Gold `#C99A2E` on `#FEF5E7`).
       - `● Partially Recovered`: Partial deductions made (Amber Ochre `#B86E00` on `#FEF5E7`).
       - `● Fully Recovered`: Completely recovered (Emerald Forest `#1E6B37` on `#EAF5EE`).
       - `● Cancelled`: Reversal entry.
  8. **Actions**:
     - `[...]` menu (`View Advance Slip`, `View Deduction History`, `Print Voucher`).
- **Interactive Row Behavior**:
  - Clicking any row navigates directly to the employee's advance ledger: `/employees/:id?tab=advances`.
- **Mobile Responsive Layout (Advance Cards)**:
  - On mobile viewports (`<1024px`), table rows transform into high-contrast advance cards:
  - **Card Structure**:
    - **Header Row**: Employee Name (16px bold) + Status Badge (top right).
    - **Code & Reason Strip**:
      - Code `EMP-014` • `ADV-2026-0056` • Date: *15 Sep 2026*.
      - Note: *"Family medical emergency"*.
    - **Recovery Progress Bar**:
      - Horizontal visual bar (Emerald fill on Stone track) displaying `40% Recovered`.
    - **Financial Matrix (3-Column Clean Tile)**:
      - `Issued`: `₹5,000` (Charcoal)
      - `Recovered`: `₹2,000` (Emerald)
      - `Outstanding`: `₹3,000` (Bold Brick Crimson with soft alert background)
    - **Card Affordance**: Minimum 48px touch clearance across entire card surface with subtle right chevron (`>`), tap opens `/employees/:id?tab=advances`.
- **Modal: "Record Employee Advance"**:
  - Slide-in modal (500px desktop, full-screen mobile):
    1. **Select Employee**: Searchable worker dropdown. Instantly displays worker's current debt: *"Currently has ₹3,000 in outstanding advances"*.
    2. **Advance Date**: Defaults to today (`DD/MM/YYYY`).
    3. **Advance Amount (₹)**: Numeric input with `inputMode="decimal"`.
    4. **Purpose / Reason**: Dropdown with options (*Medical Emergency*, *Festival Advance*, *Home Construction*, *Tool Purchase*, *Other*) + custom note.
    5. **Disbursement Mode**: Segmented toggle (`Cash` | `UPI` | `Bank Transfer`).
    6. **Cashier / Approved By**: Defaults to current logged-in manager.
    7. **Signed Receipt / Signature Proof**: Camera upload for paper voucher signed with worker's signature or thumb impression.
    8. **Buttons**: `[Cancel]` and `[Disburse Advance]` (Deep Maroon `#4A0E0E` primary button). Locking voucher upon confirmation.

#### Page 5.6: Employee Payments & Wage Settlement (`/employee-payments`)
- **Purpose**: Dedicated payroll and wage disbursement ledger for settling earned worker wages and executing advance recovery deductions under strict Rule 18 non-netting architecture.
- **Rule 18 Non-Netting Settlement Principle**: When a worker is paid, the system clearly and transparently distinguishes between **Gross Wages Settled** (clearing earned labor liability) and **Advances Recovered** (deducting cash loan principal). Both allocations are recorded in separate database tables (`employee_payment_wage_allocations` and `employee_payment_advance_allocations`), ensuring total transparency for both worker and business owner.
- **Header**:
  - Title: `Employee Payments`
  - Subtitle: *"Labor wage settlements, advance recovery deductions, and worker payout vouchers."*
  - Isolation Badge: `Payroll & Labor Disbursements Only` (Slate neutral badge)
  - Primary CTA: `[Record Employee Payment]` (Deep Maroon `#4A0E0E` button, 1px border `#380A0A`, opens settlement workflow).
- **Toolbar & Filter Controls**:
  - **Search Input**: Full-width / 320px responsive input; searches across Worker Name, Code (`EMP-...`), Voucher Code (`EPAY-...`), and Bank UTR/Reference.
  - **Date Filter Pills**: `All` • `Today` • `This Week` • `This Month` • `Custom Range 📅`.
  - **Payment Mode Filter**: `All Modes` • `Bank Transfer / NEFT` • `UPI` • `Cash`.
  - **Employee Filter**: Searchable dropdown (`All Workers` or filter by individual employee).
- **Desktop Table Specification (Explicit Allocation Distinction)**:
  - Tabular layout with crisp 1px borders and transparent wage vs advance breakdowns:
  1. **Payment No**:
     - Monospace code: `EPAY-2026-0112` (Clickable to view full payslip voucher).
  2. **Employee**:
     - Name: 14px bold Plus Jakarta Sans (*Muthu Kumar*).
     - Code & Trade: Monospace `EMP-014` • Pill badge `[Master Carpenter]`.
  3. **Date**:
     - Payout Date: Tabular numeral `28 Sep 2026`.
  4. **Amount (Net Paid)**:
     - Actual Net Cash / Bank Outflow: `₹5,000.00` (Bold 14px Charcoal with outbound indicator `↘`).
  5. **Allocation Breakdown (Clearly Distinguishes Wage vs Advance)**:
     - Structured dual badge cell:
       - **Wage Settled**: `+₹6,000.00` (Soft green badge `bg-emerald-50 text-emerald-800 border border-emerald-200` — gross earned labor cleared).
       - **Advance Recovered**: `-₹1,000.00` (Soft amber badge `bg-amber-50 text-amber-800 border border-amber-200` — cash advance deducted).
       - Context Subtext: `(₹6,000 Wages - ₹1,000 Advance = ₹5,000 Net)`.
  6. **Reference**:
     - Payment Mode + Transaction UTR:
       - `Bank Transfer`: `SBI A/c ...9384 • UTR 202609281142`
       - `UPI`: `muthu98401@sbi (Txn: 98210492)`
       - `Cash`: `Petty Cash Voucher #089 (Signed Slip)`
  7. **Status**:
     - Semantic badge with 6px dot: `● Confirmed / Paid` (Emerald Forest `#1E6B37` on `#EAF5EE`) or `● Void / Reversed` (Slate).
  8. **Actions**:
     - `[Payslip PDF]` (Download official worker payment advice slip).
     - `[...]` menu (`Print Voucher`, `View Audit Trail`).
- **Interactive Row Behavior**:
  - Clicking any row opens the detailed payslip modal showing all dates of attendance settled and specific advance vouchers recovered.
- **Mobile Responsive Layout (Payment Settlement Cards)**:
  - On mobile viewports (`<1024px`), table rows transform into high-contrast payout cards:
  - **Card Structure**:
    - **Header Row**: Payout No (`EPAY-2026-0112`) + Status Badge (top right).
    - **Worker Name & Trade**:
      - Name: 16px bold (*Muthu Kumar* • `EMP-014`).
      - Trade Tag: `[Master Carpenter]`.
    - **Net Cash Disbursed**:
      - Large bold readout: `Net Cash Paid: ₹5,000.00` (Disbursed via UPI).
    - **Visual Allocation Split (Wage vs Advance)**:
      - `Gross Wages Settled`: `+₹6,000.00` (Green)
      - `Advance Recovery Deducted`: `-₹1,000.00` (Amber)
    - **Bank Reference**: `UPI: muthu98401@sbi • 28 Sep 2026`.
    - **Action**: Full-width 48px touch button: `[Download Worker Payslip PDF]`.
- **Modal Workflow: "Record Employee Payment" (Rule 18 Strict Separation)**:
  - Slide-in modal (650px desktop, full-screen mobile):
    1. **Select Employee**: Searchable worker dropdown. Instantly loads two independent financial position cards:
       - **Wage Position**: Total Wages Earned (`₹12,500`) - Previous Paid (`₹8,000`) = **Outstanding Wage Payable: ₹4,500**.
       - **Advance Position**: Total Advances Given (`₹3,000`) - Previous Recoveries (`₹1,000`) = **Outstanding Advance: ₹2,000**.
    2. **Settlement Allocations (Explicit Inputs)**:
       - `Gross Wages to Settle (₹)`: Defaults to `₹4,500` (Editable).
       - `Advance Recovery to Deduct (₹)`: Defaults to `₹1,000` (Editable, capped at total outstanding advance).
       - **Auto-Calculated Net Cash to Disburse**:
         - Headline: **`₹3,500.00`** (*Net cash paid to worker*).
         - Formula banner: `₹4,500 Gross Wages - ₹1,000 Advance Recovery = ₹3,500 Net Disbursement`.
    3. **Payment Details**:
       - Payment Date (defaults to today).
       - Payment Mode (Segmented toggle: `Bank Transfer / NEFT` | `UPI` | `Cash`).
       - Disbursed From Bank Account (Dropdown of company accounts).
       - Reference / UTR / Voucher No (Required text).
       - Notes & Worker Receipt / Signature Upload.
    4. **Buttons**: `[Cancel]` and `[Confirm & Issue Payment]` (Deep Maroon `#4A0E0E` primary button). Locking voucher upon confirmation.

### MODULE 6: FINANCE & EXPENSES

#### Page 6.1: Customer Payments (`/customer-payments`)
- **Purpose**: Dedicated commercial revenue register for recording client milestone receipts, tracking bank clearing, and monitoring company cash inflows.
- **Rule 18 & Isolation Guardrails**: Strictly restricted to customer revenue receipts. Supplier payments (`/supplier-payments`), employee wage payouts (`/employee-payments`), and general expenses (`/expenses`) are strictly barred from this interface to preserve audit purity and prevent cash flow netting confusion.
- **Header**:
  - Title: `Customer Payments`
  - Subtitle: *"Client milestone receipts, bank clearing status, and receivable collections."*
  - Isolation Badge: `Customer Revenue Inflows Only` (Slate neutral badge)
  - Primary CTA: `[Record Customer Payment]` (Deep Maroon `#4A0E0E` button, 1px border `#380A0A`).
- **Toolbar & Filter Controls**:
  - **Search Input**: Full-width / 320px responsive input; searches across Customer Name, Code (`RCPT-...`), Project Name, and Bank UTR/Cheque numbers.
  - **Customer Filter**: Searchable dropdown (`All Customers` or filter by individual client).
  - **Project Filter**: Dropdown to isolate receipts for a specific job site (`All Projects` • *Velmurugan Villa* • *Kavitha Residence*).
  - **Date Segmented Filter**: `All` • `Today` • `This Week` • `This Month` • `Custom Range 📅`.
  - **Receipt Status Filter**: `All Receipts (45)` • `Confirmed (41)` • `In Clearing (3)` • `Cancelled (1)`.
- **Top Financial Summary Cards (3 High-Contrast KPI Cards — Revenue Pulse)**:
  1. **Received Today**:
     - Headline: `↗ +₹2,50,000.00` (Emerald Forest `#1E6B37`)
     - Caption: `2 Milestone payments collected today`
  2. **Received This Month**:
     - Headline: `↗ +₹18,50,000.00` (Emerald Forest `#1E6B37`)
     - Caption: `14 Milestone payments collected in Oct 2026`
  3. **Total Outstanding Receivables**:
     - Headline: `₹14,20,000.00` (Bold Brick Crimson `#9E2A2B` on `#FCEEEE`)
     - Caption: `Total pending customer dues across active projects (DUE)`
- **Desktop Table Specification (Clear Positive Inflow Styling)**:
  - Tabular layout with crisp 1px borders and distinct inbound revenue semantics:
  1. **Date**:
     - Receipt Date: Tabular numeral `01 Oct 2026` + Code `RCPT-2026-0045`.
  2. **Customer**:
     - Name: 14px bold Plus Jakarta Sans (*K. Velmurugan*).
     - Phone snippet: `+91 98401 23456` (Clickable to customer profile).
  3. **Project**:
     - Allocated Project: Clickable project link (*Velmurugan Villa Interiors* • `PRJ-2026-0012`).
  4. **Amount (Positive Inflow Styled)**:
     - Prominent inbound indicator: `↗ +₹2,00,000.00` (Bold 14px Emerald Forest `#1E6B37` with inbound arrow icon, explicitly declaring cash inflow into the company).
  5. **Reference**:
     - Payment Mode badge + Reference Identifier:
       - `NEFT`: `UTR 202610018921 (HDFC)`
       - `Cheque`: `Cheque #304910 (SBI) - Clearing Due: 03 Oct`
       - `UPI`: `velmurugan@okhdfc (Txn: 894012)`
       - `Cash`: `Official Cash Voucher #045`
  6. **Status**:
     - Semantic badge with 6px dot:
       - `● Confirmed`: Verified credited to bank account (Emerald Forest `#1E6B37` on `#EAF5EE`).
       - `● Cheque in Clearing`: Deposited, awaiting bank clearance (Warm Gold `#C99A2E` on `#FEF5E7`).
       - `● Cancelled / Dishonored`: Bounced cheque or reversal entry (Brick Crimson `#9E2A2B` on `#FCEEEE`).
  7. **Actions**:
     - `[Official Receipt PDF]` (Download formatted branded receipt).
     - `[Send via WhatsApp]` (1-tap dispatch of payment receipt to client).
     - `[...]` menu (`Print Voucher`, `View Linked Milestone`).
- **Interactive Row Behavior**:
  - Clicking any row opens the detailed customer receipt view with project milestone allocations and bank deposit slips.
- **Mobile Responsive Layout (Revenue Receipt Cards)**:
  - On mobile viewports (`<1024px`), table rows transform into high-contrast revenue receipt cards:
  - **Card Structure**:
    - **Header Row**: Receipt No (`RCPT-2026-0045`) + Status Badge (`● Confirmed`).
    - **Customer & Project Meta**:
      - Customer: 16px bold (*K. Velmurugan*).
      - Project: *Velmurugan Villa Interiors*.
    - **Inflow Amount Block**:
      - Large bold inbound figure: `↗ +₹2,00,000.00` (Emerald Forest).
      - Mode & Reference: `NEFT • HDFC Bank • UTR: 202610018921`.
    - **Action Strip**:
      - `[Download Receipt PDF]` (44px touch button).
      - `[Send WhatsApp]` (44px green button to text receipt to client).
- **Modal: "Record Customer Payment"**:
  - Slide-in modal (600px desktop, full-screen mobile):
    1. **Select Customer**: Searchable customer dropdown.
    2. **Select Project**: Dropdown filtered to active projects for this client. Immediately displays contract standing:
       - *"Contract Value: ₹18,50,000 • Already Received: ₹10,00,000 • Current Balance Due: ₹8,50,000"*.
    3. **Payment Details**:
       - Amount Received (₹ numeric input with `inputMode="decimal"`).
       - Payment Date (defaults to today).
       - Payment Mode (Segmented toggle: `NEFT / RTGS` | `UPI` | `Cheque` | `Cash`).
       - Deposited Into Bank Account (Dropdown of company accounts).
       - Reference / UTR / Cheque Number (Required text).
       - Project Milestone Tag (Dropdown: *Mobilization Advance*, *Plinth Completion*, *False Ceiling*, *Final Handover*).
    4. **Attach Slip / Cheque Scan**: Camera hook to capture cheque leaf or bank deposit counterfoil.
    5. **Buttons**: `[Cancel]` and `[Confirm Receipt]` (Deep Maroon `#4A0E0E` primary button). Locking voucher upon confirmation.

---

#### Page 6.2: Operational & Site Expenses (`/expenses`)
- **Purpose**: Petty cash and direct operational expenditure tracking for non-PO project costs (site fuel, generator diesel, tempo freight/transport, worker refreshments, equipment and scaffolding rentals, municipal approval inspection fees). 
- **Rule 18 Recorded Cost Integration**: Any expense assigned to a project is automatically accrued into that project's **Recorded Project Cost** (alongside material purchases and wages), without speculative profit netting. Unassigned expenses flow into general company administrative overhead.
- **Header**:
  - Title: `Expenses`
  - Subtitle: *"Operational site expenses, petty cash disbursements, equipment rentals, and project transportation."*
  - Scope Badge: `Direct Operating Outflows` (Neutral stone badge)
  - Primary CTA: `[+ Add Expense]` (Deep Maroon `#4A0E0E` button, 1px border `#380A0A`).
- **Toolbar & Filter Controls**:
  - **Search Input**: Full-width / 320px responsive input; searches across Description, Category, Vendor/Payee, and Reference.
  - **Date Segmented Filter**: `All` • `Today` • `This Week` • `This Month` • `Custom Range 📅`.
  - **Project Filter Dropdown**: `[ All Projects & Overhead ▼ ]` (Filter by *Velmurugan Villa*, *Kavitha Residence*, or *General Office Overhead*).
  - **Category Filter Pills**: `All (56)` • `Site Fuel & Diesel (14)` • `Transport & Freight (12)` • `Food & Tea (16)` • `Equipment Hire (8)` • `Admin & Municipal (6)`.
- **Top Financial Summary Cards (3 High-Contrast KPI Cards — Expense Pulse)**:
  1. **Today's Expenses**:
     - Headline: `↘ ₹4,250.00` (Charcoal bold with outbound indicator)
     - Caption: `4 Petty cash vouchers logged today`
  2. **This Month (Oct 2026)**:
     - Headline: `↘ ₹74,500.00` (Charcoal bold)
     - Caption: `Total operational and site spending this month`
  3. **Project-Linked Expenses**:
     - Headline: `₹62,000.00` (83.2% of monthly expenses)
     - Caption: `Directly allocated to Recorded Project Costs across active sites`
- **Desktop Table Specification**:
  - High-density tabular layout with architectural category tags:
  1. **Date**:
     - Expense Date: Tabular numeral `01 Oct 2026` + Code `EXP-2026-0219`.
  2. **Category**:
     - Trade Category Badge:
       - `[Site Fuel & Diesel]`: Soft amber tint (`#FEF5E7` with `#B86E00` text).
       - `[Transport & Freight]`: Soft blue tint (`#EFF6FF` with `#1D4ED8` text).
       - `[Food & Tea]`: Soft gold tint (`#F9F3E5` with `#C99A2E` text).
       - `[Equipment Hire]`: Soft teal tint (`#E0F2F1` with `#00695C` text).
       - `[Admin & Office]`: Slate grey tint.
  3. **Project**:
     - Allocated Project: Clickable project link (*Velmurugan Villa Interiors* • `PRJ-2026-0012`) or *General Company Overhead*.
  4. **Description**:
     - Clear narrative of expenditure: *"Diesel (35 Liters) for site generator during concrete slab casting"* + 📎 paperclip icon indicating fuel bill photo.
  5. **Amount**:
     - Outbound cash figure: `↘ ₹2,400.00` (Bold 14px Charcoal with outbound indicator).
  6. **Reference**:
     - Payment Mode & Payee/Voucher:
       - `UPI`: `fuel@iocl (Txn: 984021)`
       - `Cash`: `Petty Cash Voucher #112 (Paid by M. Suresh)`
       - `Bank`: `HDFC Debit Card ...4819`
  7. **Actions**:
     - `[View Receipt]` (Opens attached bill photo in zoom modal).
     - `[...]` menu (`Edit Expense`, `Reallocate Project`, `Print Voucher`).
- **Interactive Row Behavior**:
  - Entire table row is clickable and opens the expense audit modal with attached receipt scans and payment approvals.
- **Mobile Responsive Layout (Expense Cards)**:
  - On mobile viewports (`<1024px`), table rows transform into compact expense cards:
  - **Card Structure**:
    - **Header Row**: Date (`01 Oct 2026`) + Category Badge (top right).
    - **Amount Block**:
      - Large bold outbound figure: `↘ ₹2,400.00`.
    - **Project & Description**:
      - Project: *Velmurugan Villa Interiors*.
      - Description: *"Diesel (35 Liters) for site generator during concrete slab casting"*.
    - **Reference & Receipt Strip**:
      - Reference: `UPI: fuel@iocl` • Paid by: *M. Suresh (Site Engg)*.
      - Receipt Preview: Thumbnail button with camera icon `[📷 View Bill Scan]`.
    - **Card Affordance**: Minimum 48px touch clearance across entire card surface.
- **Drawer: "+ Add Site / Operational Expense"**:
  - Slide-in panel (500px desktop, full-screen mobile):
    1. **Expense Category * **: Dropdown with construction presets (*Site Fuel*, *Transport / Auto Freight*, *Worker Tea & Food*, *Scaffolding / Mixer Hire*, *Tools & Safety*, *Admin*).
    2. **Project Allocation * **: Dropdown of active projects or `General Company Overhead` (ensures accurate project cost attribution).
    3. **Expense Date**: Defaults to today (`DD/MM/YYYY`).
    4. **Amount (₹) * **: Numeric input with `inputMode="decimal"`.
    5. **Description / Purpose * **: Text field describing spending and vendor name.
    6. **Payment Mode**: Segmented toggle (`Cash from Petty Cash` | `UPI` | `Bank Debit Card`).
    7. **Disbursed By**: Supervisor or Engineer who incurred the expense.
    8. **Upload Bill / Fuel Slip Photo**: Instant camera hook to snap receipt on site.
    9. **Buttons**: `[Cancel]` and `[Record Expense]` (Deep Maroon `#4A0E0E` primary button).

---

#### Page 6.3: Financial Summary & Treasury Command Center (`/financial-summary`)
- **Purpose**: Company-wide executive financial cockpit for the Managing Director and business partners. Provides an unvarnished, accurate operational pulse organized strictly into **four distinct financial views**.
- **Rule 18 Strict Architectural Mandates**:
  - **ZERO PROFIT RULE**: The ERP strictly **DOES NOT DISPLAY A "PROFIT" OR "NET MARGIN" METRIC**. Speculative profit calculations are dangerous in ongoing construction due to unbilled work, retention money, fluctuating material rates, and pending site expenses.
  - **NON-NETTING SEPARATION**: Receivables, liabilities, worker advances, and project costs are never netted against each other.
- **Header**:
  - Title: `Financial Summary`
  - Subtitle: *"Company treasury pulse, customer collections, vendor liabilities, and project cost tracking."*
  - Scope Pill: `Rule 18 Strict Non-Netting Standards` (Neutral stone badge)
  - Action Controls:
    - `[Export Financial Report PDF]` (Outline button)
    - `[Print Treasury Sheet]` (Ghost icon button)
- **Master Filter Toolbar (Sticky Below Header)**:
  - **Date / Period Selector**: Segmented presets: `This Month (Oct 2026)` • `Last Month (Sep 2026)` • `This Financial Year (FY 2026-27)` • `All Time` • `Custom Range 📅`.
  - **Project Filter Dropdown**: `[ All Projects (Master Portfolio) ▼ ]` (Allows viewing company-wide treasury or isolating metrics for a specific site like *Velmurugan Villa Interiors*).
- **Navigation Architecture**:
  - Provides a toggle between **Tabbed View** (single-category focus) and **All-in-One Executive Dashboard** (vertical 4-section layout with fast jump anchors):
    - `[Tab 1: Customer Finance]`
    - `[Tab 2: Supplier Finance]`
    - `[Tab 3: Employee Finance]`
    - `[Tab 4: Project Finance]`
    - `[View All 4 Sections]`

---

### SECTION 1: Customer Finance (Commercial Receivables)
- **Purpose**: Track total contracted revenue commitments, realized cash collections, and pending customer dues.
- **Top Summary Cards (3 High-Contrast KPI Cards)**:
  1. **Contract Value**:
     - Headline: `₹65,00,000.00` (Total agreed commercial value across contracted projects)
     - Caption: `8 Active signed contracts • 3 in planning`
  2. **Received**:
     - Headline: `↗ +₹42,00,000.00` (Total verified customer receipts collected, Emerald Forest `#1E6B37`)
     - Caption: `64.6% of total contract value realized`
  3. **Outstanding**:
     - Headline: `₹23,00,000.00` (Pending customer dues, bold Brick Crimson `#9E2A2B` on `#FCEEEE`)
     - Caption: `Unpaid customer receivables across active milestones (DUE)`
- **Detailed Customer Breakdown Table**:
  - Columns: Customer Name, Project, Contract Value (₹), Received (₹ in Emerald), Outstanding Due (₹ in Brick Crimson), Last Payment Date, Next Milestone Due.

---

### SECTION 2: Supplier Finance (Procurement Liabilities)
- **Purpose**: Track material procurement spending, payment disbursements, and outstanding vendor liabilities.
- **Top Summary Cards (3 High-Contrast KPI Cards)**:
  1. **Purchases**:
     - Headline: `₹28,50,000.00` (Cumulative material purchase bills from vendors)
     - Caption: `78 Purchase orders across 18 approved suppliers`
  2. **Payments**:
     - Headline: `↘ ₹21,00,000.00` (Verified payments disbursed to vendors, Emerald Forest `#1E6B37`)
     - Caption: `73.7% of total procurement liabilities cleared`
  3. **Outstanding**:
     - Headline: `₹7,50,000.00` (Pending vendor liability, bold Brick Crimson `#9E2A2B` on `#FCEEEE`)
     - Caption: `Current vendor debt owed to hardware/cement suppliers (DUE)`
- **Detailed Supplier Breakdown Table**:
  - Columns: Supplier Name, Trade Category, Total Purchases Billed (₹), Total Paid (₹), Outstanding Balance Due (₹), Unallocated Advance Credits Held.

---

### SECTION 3: Employee Finance (Workforce Wages & Advances)
- **Purpose**: Track earned labor liabilities alongside company cash advance loan assets with **strict physical separation**.
- **Dual-Pillar Financial Summary Grid**:
  - **Sub-Section 3A: Wage Account (Earned Labor Liabilities)**:
    - Card 3A.1: **Wages Earned**: `₹8,20,000.00` (Total labor wage accrued from verified daily site attendance).
    - Card 3A.2: **Wages Paid**: `₹7,10,000.00` (Disbursed wage payments in Emerald Forest `#1E6B37`).
    - Card 3A.3: **Wage Payable**: `₹1,10,000.00` (Earned labor liability owed to workers, Warm Amber `#B86E00` on `#FEF5E7`).
  - **Sub-Section 3B: Advance Account (Worker Cash Loans & Recoveries)**:
    - Card 3B.1: **Advances Given**: `₹1,45,000.00` (Cumulative cash loans issued to workers).
    - Card 3B.2: **Advances Recovered**: `₹60,000.00` (Recoveries deducted from wage settlement payouts).
    - Card 3B.3: **Advance Outstanding**: `₹85,000.00` (Pending company asset owed back by workers, Brick Crimson `#9E2A2B` on `#FCEEEE`).
- **Strict Visual Divider**: An architectural vertical dividing line and contrasting card backgrounds ensure the user never nets `Wage Payable (₹1,10,000)` against `Advance Outstanding (₹85,000)`.

---

### SECTION 4: Project Finance (Site Execution Health — NO PROFIT)
- **Purpose**: Compare contracted commercial revenue against actual recorded physical expenditures without speculative profit calculation.
- **Top Summary Cards (4 High-Contrast KPI Cards — Rule 18 Compliant)**:
  1. **Contract Value**:
     - Headline: `₹65,00,000.00` (Signed contract values across all projects)
     - Caption: `Total commercial milestone baseline`
  2. **Customer Received**:
     - Headline: `↗ +₹42,00,000.00` (Realized customer cash inflow in Emerald Forest)
     - Caption: `64.6% of contract collected`
  3. **Customer Outstanding**:
     - Headline: `₹23,00,000.00` (Unpaid customer dues, bold Brick Crimson `#9E2A2B` on `#FCEEEE`)
     - Caption: `Pending milestone collections`
  4. **Recorded Project Cost**:
     - Headline: `₹39,10,000.00` (Total cumulative actual expenditure on job sites)
     - Cost Breakdown Strip: `Materials: ₹28.5L • Wages: ₹8.2L • Direct Site Expenses: ₹2.4L`
- **Portfolio Project Cost Matrix Table**:
  - Columns: Project Name & Code, Customer, Progress %, Contract Value (₹), Received (₹), Customer Due (₹), Recorded Project Cost (₹).
  - Explicit Footer Note: *"Recorded Project Cost represents actual logged expenditure (Purchases + Earned Wages + Direct Site Expenses). In accordance with Rule 18 standards, project profit is not computed or displayed."*

---

- **Mobile Responsive Layout**:
  - Top horizontal tab bar for 1-tap switching between the 4 financial views.
  - Cards stack into clean 2-column or 1-column high-contrast matrices.
  - Sticky date/project filter bar anchored beneath the navigation header.

---

### MODULE 7: REPORTS & ANALYTICS

#### Page 7.1: Reports Directory Landing Page (`/reports`)
- **Purpose**: Clean, professional landing hub providing instant access to official company business statements, site audits, procurement summaries, and workforce ledgers.
- **Design Philosophy**: Intentionally simple, elegant, and uncluttered. Avoids chart noise and vanity gauges; acts as a focused, dignified gateway to structured operational reports.
- **Header**:
  - Title: `Reports`
  - Subtitle: *"Official executive briefings, project cost audits, procurement statements, and workforce analytics."*
  - Scope Pill: `Audit-Ready Financial & Operational Records` (Slate neutral badge)
- **Report Catalog Grid (2-Column Desktop Grid / 1-Column Mobile)**:
  - 5 structured report cards with architectural dignity:
  
  1. **Weekly Reports Card**:
     - **Icon**: `lucide: CalendarCheck2` (Warm Gold icon `#C99A2E` inside a 44x44px soft cream rounded square `#F9F3E5`).
     - **Title**: `Weekly Reports` (18px bold Plus Jakarta Sans).
     - **Description**: *"Automated weekly executive briefing compiling milestone achievements, weekly customer cash collections, vendor disbursements, worker man-days, and critical attention items."*
     - **Last Generated**: `Generated yesterday, 6:00 PM • Week 40` (12px text-secondary with clock icon).
     - **Action**: `[Open Report →]` (Deep Maroon `#4A0E0E` medium button with forward arrow). Links to `/reports/weekly`.

  2. **Project Reports Card**:
     - **Icon**: `lucide: Building2` (Deep Maroon icon `#4A0E0E` inside soft cream container).
     - **Title**: `Project Reports` (18px bold Plus Jakarta Sans).
     - **Description**: *"Site-by-site execution audit detailing contracted commercial milestones against Recorded Project Costs (Materials + Wages + Direct Site Expenses) without speculative profit netting."*
     - **Last Generated**: `Generated today, 10:15 AM` (12px text-secondary).
     - **Action**: `[Open Report →]`. Links to `/reports/projects`.

  3. **Purchase Reports Card**:
     - **Icon**: `lucide: ShoppingCart` (Warm Gold icon `#C99A2E`).
     - **Title**: `Purchase Reports` (18px bold Plus Jakarta Sans).
     - **Description**: *"Material procurement analysis categorized by trade (Civil, False Ceiling, Woodwork, Electrical), supplier bill settlement aging, and vendor concentration shares."*
     - **Last Generated**: `Generated 28 Sep 2026, 7:30 PM` (12px text-secondary).
     - **Action**: `[Open Report →]`. Links to `/reports/purchases`.

  4. **Workforce Reports Card**:
     - **Icon**: `lucide: Users` (Deep Maroon icon `#4A0E0E`).
     - **Title**: `Workforce Reports` (18px bold Plus Jakarta Sans).
     - **Description**: *"Labor muster audit, trade-wise attendance percentages, overtime hours logged by site, wage accruals, and cumulative cash advance recovery balances."*
     - **Last Generated**: `Generated today, 8:00 AM` (12px text-secondary).
     - **Action**: `[Open Report →]`. Links to `/reports/workforce`.

  5. **Payment Reports Card**:
     - **Icon**: `lucide: ReceiptIndianRupee` (Emerald Forest icon `#1E6B37`).
     - **Title**: `Payment Reports` (18px bold Plus Jakarta Sans).
     - **Description**: *"Comprehensive cash flow and treasury statement isolating customer revenue receipts, supplier bill disbursements, and employee wage settlements under strict Rule 18 standards."*
     - **Last Generated**: `Generated today, 11:30 AM` (12px text-secondary).
     - **Action**: `[Open Report →]`. Links to `/reports/payments`.

- **Card Styling & Interactions**:
  - Container: Background `#FFFFFF`, 1px solid architectural border `#E2DDD5`, 8px rounded corners (`rounded-lg`), 24px internal padding.
  - Hover Effect: Subtle 2px Warm Gold top border transition (`border-t-2 border-t-[#C99A2E]`) and subtle card elevation (`shadow-sm`).
  - Entire card surface is clickable with minimum 48px touch targets for mobile accessibility.
- **Mobile Responsive Layout**:
  - Single column stream of cards.
  - Clean vertical breathing room with generous touch targets.
  - Instant navigation to sub-reports.

---

#### Page 7.2: Weekly Executive Business Report (`/reports/weekly`)
- **Purpose**: Authoritative weekly management briefing designed for executive review by the Managing Director, business partners, and financial auditors. Compiles seven comprehensive operational facets into an audit-ready, print-friendly statement.
- **Header & Action Toolbar**:
  - **Week Identifier**: `Week 40: 25 Sep 2026 – 01 Oct 2026` (24px bold Plus Jakarta Sans) with `< Previous Week` and `Next Week >` navigation buttons.
  - **Audit Timestamp**: `Generated on Thursday, 01 Oct 2026 at 6:00 PM` (12px text-secondary with clock icon).
  - **Management Action Toolbar (Top Right)**:
    - `[Regenerate]` (Neutral button with refresh icon; re-aggregates live ledger data).
    - `[Print]` (Secondary button with printer icon; triggers high-resolution print stylesheet).
    - `[Export CSV]` (Neutral outline button with table icon).
    - `[Export XLSX]` (Deep Maroon `#4A0E0E` button with spreadsheet icon).
- **Print & Presentation Standards**:
  - Engineered with dedicated `@media print` rules: hides sidebar/navigation, optimizes page breaks between sections, converts to pure white background, and enforces high-contrast charcoal typography for executive binder presentations.

---

### The 7 Executive Report Sections:

#### SECTION 1: Business Summary (Executive Briefing)
- **Executive Commentary**:
  - *"Operational execution remained strong across Week 40 with 68% progress achieved at Velmurugan Villa. Cash collections totaled ₹5,50,000 against ₹1,85,000 in material purchases and ₹1,14,000 in workforce wage disbursements. No safety incidents were reported across active sites."*
- **Weekly Financial & Operational Pulse Cards (5 Key Metrics — Rule 18 Compliant)**:
  1. `Customer Collections Realized`: `↗ +₹5,50,000.00` (Emerald Forest)
  2. `Material Purchases Billed`: `₹1,85,000.00` (7 Purchase orders)
  3. `Supplier Disbursements Issued`: `↘ ₹1,75,000.00` (4 Vendor payments)
  4. `Workforce Wages Disbursed`: `↘ ₹1,14,000.00` (Net cash paid after ₹12,000 advance recoveries)
  5. `Recorded Site Costs Incurred`: `₹3,24,000.00` (Purchases + Earned Wages + Site Expenses)

#### SECTION 2: Projects (Site Execution Health)
- **Active Projects Weekly Progress Table**:
  - Columns: Project Name & Code, Customer, Overall Progress %, Progress Delta (+% This Week), Milestones Completed This Week, Target Handover Date, Status.
  - Highlights:
    - *Velmurugan Villa Interiors*: `68%` (+12% this week) • False ceiling perimeter channels completed.
    - *Kavitha Residence Elevation*: `75%` (+8% this week) • Exterior louvers and primer complete.

#### SECTION 3: Workforce (Labor Muster & Wage Accruals)
- **Workforce Performance Matrix**:
  - Total Labor Deployed: `108 Total Man-Days` across 6 working days (Daily average: 18 workers).
  - Trade Breakdown Table:
    - *Master Carpenters*: 30 Man-Days • ₹28,500 Wages Earned
    - *Civil Masons*: 24 Man-Days • ₹20,400 Wages Earned
    - *Electricians*: 12 Man-Days • ₹10,800 Wages Earned
    - *Painters*: 18 Man-Days • ₹14,400 Wages Earned
    - *Helpers*: 24 Man-Days • ₹13,200 Wages Earned
  - Cash Advance Movements: `Issued This Week: ₹8,000` • `Recovered via Wage Deductions: ₹12,000` • `Net Advance Reduction: ₹4,000`.

#### SECTION 4: Purchases (Material Procurement)
- **Procurement Statement**:
  - Total Billed This Week: `₹1,85,000.00`.
  - Trade Category Breakdown:
    - *Plywood & Laminates*: `₹85,000` (Sri Balaji Hardware)
    - *Gypsum & False Ceiling*: `₹42,600` (Saint-Gobain distributor)
    - *Electrical & Lighting*: `₹35,000` (Surya Electricals)
    - *Hardware & Fixings*: `₹22,400` (Sri Balaji Hardware)
  - Pending Material Deliveries: 0 pending; 100% material delivery receipt verified on site.

#### SECTION 5: Payments (Three-Way Treasury Audit — Rule 18 Isolated)
- **Isolated Cash Flow Ledger Table**:
  - Category A: Customer Milestone Receipts (`+₹5,50,000.00` Inflow)
  - Category B: Supplier Vendor Disbursements (`-₹1,75,000.00` Outflow)
  - Category C: Employee Wage Disbursements (`-₹1,14,000.00` Outflow)
  - Category D: Direct Operational Site Expenses (`-₹12,400.00` Outflow)
  - *Strict Rule 18 Note: Each category is reported independently without netting or artificial profit deduction.*

#### SECTION 6: Tasks & Field Operations
- **Weekly Operational Log**:
  - Site Visits Conducted: `6 Site Visits Completed` (Velmurugan Villa, Kavitha Residence, 2 new client initial surveys).
  - Customer Follow-ups Closed: `14 Leads Contacted` • 2 Estimates Accepted.
  - Daily Site Reports Compliance: `100% Submission Rate` (12 of 12 supervisor site reports submitted on time with photos).

#### SECTION 7: Alerts & Management Action Items
- **High-Priority Escalation Box**:
  - ⚠️ **Customer Due Alert**: *Balaji Commercial Elevation* has milestone payment of `₹8,00,000` pending since 25 Sep. Managing Director follow-up recommended.
  - ⚠️ **Worker Advance Recovery**: 2 helpers have pending advance balances exceeding 50% of monthly earnings. Advised cap on additional advances.
  - ℹ️ **Upcoming Milestone**: Velmurugan Villa False Ceiling inspection scheduled for Monday morning with client.

---

#### Page 7.3: Project Audit & Cost Report (`/reports/projects`)
- **Purpose**: Exhaustive single-project commercial and operational audit report. Consolidates physical milestone progress, field works completed, labor man-days, material purchases, direct site expenses, and client collections into an authoritative, clean review document.
- **Rule 18 Architectural Mandate (NO PROFIT RULE)**:
  - Strictly presents **Recorded Project Cost** (sum of materials + labor wages + site expenses) alongside **Contract Value** and **Customer Collections**.
  - **Does not compute, speculate, or display a "profit" or "margin" metric.**
- **Header & Master Filter Controls**:
  - **Page Title**: `Project Reports`
  - **Subtitle**: *"Site execution audit, physical work progress, project cost attribution, and client collections."*
  - **Filter Controls (Sticky Bar)**:
    - **Project Selector * **: Searchable dropdown (`[ Velmurugan Villa Interiors (PRJ-2026-0012) ▼ ]`).
    - **Date Range Selector**: Presets: `Full Project Lifecycle (15 Jul 2026 – Present)` • `This Month (Oct 2026)` • `Last 30 Days` • `Custom Range 📅`.
  - **Audit Actions (Top Right)**:
    - `[Print Report]` (Dedicated print styling)
    - `[Export PDF]` (Official branded client/partner PDF)
    - `[Export XLSX]` (Detailed itemized spreadsheet)

---

### Clean Report Presentation Architecture:

#### 1. Project Identification & Physical Progress Banner
- **Header Card**:
  - Project Title: `Velmurugan Villa Interiors` (24px bold Plus Jakarta Sans) • `PRJ-2026-0012`
  - Customer: `K. Velmurugan` (`+91 98401 23456`) • Site: *Plot 42, Bypass Road, Madurai*
  - Site Engineer: `M. Suresh` • Schedule: *15 Jul 2026 → 30 Nov 2026 (78 of 138 Days Elapsed)*
- **Progress Visualizer**:
  - Large 12px Warm Gold progress bar: **`68% Overall Physical Progress`**.
  - Phase Milestone Strip:
    - `[✓] Phase 1: Planning & 3D Approval (100%)`
    - `[✓] Phase 2: Masonry & Electrical Piping (100%)`
    - `[▶] Phase 3: False Ceiling & Lighting (75% In Progress)`
    - `[ ] Phase 4: Modular Woodwork & Finishing (0%)`
    - `[ ] Phase 5: Deep Cleaning & Handover (0%)`

#### 2. Work Completed (Field Execution Summary)
- Structured chronological narrative extracted from verified daily site reports:
  - *"During the audited period, false ceiling perimeter channels were 100% anchored in living and dining halls. Profile lighting conduits grooved. Master bedroom wardrobe carcasses assembled in 18mm marine plywood with Merino laminate pressing underway. Wall primer applied to all masonry surfaces."*
  - Includes thumbnail gallery of 4 verified on-site progress photos.

#### 3. Financial Matrix: Commercial Standing vs Recorded Project Cost
High-contrast 4-card financial ribbon (Rule 18 Compliant):

```
┌───────────────────┬───────────────────┬───────────────────┬─────────────────────────────────────────┐
│ CONTRACT VALUE    │ CUSTOMER RECEIVED │ OUTSTANDING DUE   │ RECORDED PROJECT COST                   │
│ ₹18,50,000.00     │ ↗ +₹12,00,000.00  │ ₹6,50,000.00      │ ₹8,24,500.00                            │
│ Agreed Estimate   │ 64.8% Collected   │ Milestone 3 Due   │ Mat: ₹5.1L • Wage: ₹2.4L • Exp: ₹74.5K  │
└───────────────────┴───────────────────┴───────────────────┴─────────────────────────────────────────┘
```

- **Recorded Cost Breakdown Strip**:
  - `Materials Procured`: **₹5,10,000.00** (61.9% of project cost)
  - `Workforce Wages Incurred`: **₹2,40,000.00** (29.1% of project cost)
  - `Direct Site Expenses`: **₹74,500.00** (9.0% of project cost)
- *Mandatory Compliance Note: "Recorded Project Cost represents actual logged expenditure (Material Purchases + Earned Wages + Direct Site Expenses). In strict adherence to Rule 18 standards, project profit is not computed or displayed."*

#### 4. Workforce Audit (Labor Deployed on Site)
- Cumulative Site Labor: `248 Total Man-Days` deployed across project lifecycle.
- Trade Breakdown Table:
  - *Master Carpenters*: 92 Man-Days • `₹87,400.00`
  - *Civil Masons*: 64 Man-Days • `₹54,400.00`
  - *Electricians*: 28 Man-Days • `₹25,200.00`
  - *Painters*: 20 Man-Days • `₹16,000.00`
  - *General Helpers*: 44 Man-Days • `₹24,200.00`
  - Overtime Hours Logged: 38 OT Hours (`₹32,800.00`).

#### 5. Material Purchases Allocated to this Project
- Filterable itemized procurement table:
  - Columns: Purchase No, Date, Supplier Name, Materials Description, Total Amount (₹), Delivery Verification Status.
  - Subtotal: **₹5,10,000.00** across 18 verified purchase vouchers.

#### 6. Direct Site Expenses Allocated
- Filterable operational site spending table:
  - Columns: Expense No, Date, Category (*Fuel*, *Transport*, *Equipment Rental*, *Food*), Description, Amount (₹), Paid By.
  - Subtotal: **₹74,500.00** across 24 petty vouchers.

#### 7. Customer Milestone Receipts Collected
- Revenue ledger table:
  - Columns: Receipt No, Date, Milestone Stage, Amount Received (₹ in Emerald), Payment Mode, Bank Reference / UTR.
  - Total Collected: **₹12,00,000.00** across 4 milestone payments.
  - Pending Balance: **₹6,50,000.00**.

---

#### Page 7.4: Purchase & Procurement Reports (`/reports/purchases`)
- **Purpose**: Executive material procurement audit analyzing total purchasing volume, supplier vendor liabilities, and project-by-project material cost allocations under strict Rule 18 non-netting standards.
- **Header & Master Filter Controls**:
  - **Page Title**: `Purchase Reports`
  - **Subtitle**: *"Material procurement statements, supplier liability balances, and project-wise cost allocations."*
  - **Filter Controls (Sticky Bar)**:
    - **Date Range Selector**: Presets: `This Month (Oct 2026)` • `Last Month (Sep 2026)` • `Financial Year 2026-27` • `All Time` • `Custom Range 📅`.
    - **Supplier Filter Dropdown**: `[ All Suppliers (18) ▼ ]` (Searchable vendor filter: *Sri Balaji Hardware*, *Surya Electricals*, etc.).
    - **Project Filter Dropdown**: `[ All Projects (8 Active) ▼ ]` (Isolate materials delivered to *Velmurugan Villa*, *Kavitha Residence*, etc.).
  - **Export & Print Action Toolbar (Top Right)**:
    - `[Print]` (Secondary button with printer icon; activates print-friendly table layout).
    - `[Export PDF]` (Official branded management PDF).
    - `[Export CSV]` (Raw itemized procurement records).
    - `[Export XLSX]` (Multi-tab Excel workbook with supplier and project sheets).

---

### Key Report Sections:

#### 1. Procurement Financial Summary Cards (Health Strip)
4 high-contrast KPI cards:
1. **Total Purchases Billed**:
   - Headline: `₹28,50,000.00` (Cumulative material purchase bills from vendors)
   - Caption: `78 Purchase orders across 18 approved suppliers`
2. **Total Payments Disbursed**:
   - Headline: `↘ ₹21,00,000.00` (Emerald Forest `#1E6B37`)
   - Caption: `73.7% of total procurement liabilities cleared`
3. **Total Outstanding Supplier Due**:
   - Headline: `₹7,50,000.00` (Bold Brick Crimson `#9E2A2B` on `#FCEEEE`)
   - Caption: `Current vendor debt owed across active suppliers (DUE)`
4. **Active Vendors with Balances**:
   - Headline: `12 Vendors with Dues` (Out of 18 total vendors)
   - Caption: `Top 3 suppliers hold 68% of outstanding balances`

---

#### 2. Supplier-Wise Breakdown Table
Analyzes vendor commercial standing, volume shares, and outstanding credit:

| Supplier Name | Trade Category | Purchases Billed | Payments Disbursed | Outstanding Balance | Volume Share | Actions |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Sri Balaji Hardware** | Plywood & Hardware | `₹11,50,000` | `₹8,50,000` (Paid) | **₹3,00,000** (DUE) | `40.4%` [████░░░░░░] | `[View Ledger]` |
| **UltraTech Cement Depot** | Civil Materials | `₹8,50,000` | `₹8,50,000` (Paid) | **₹0** (Settled) | `29.8%` [███░░░░░░░] | `[View Ledger]` |
| **Surya Electricals** | Electrical & Lighting | `₹5,20,000` | `₹3,20,000` (Paid) | **₹2,00,000** (DUE) | `18.2%` [██░░░░░░░░] | `[View Ledger]` |
| **Sri Meenakshi Paints** | Paints & Finishes | `₹3,30,000` | `₹80,000` (Paid) | **₹2,50,000** (DUE) | `11.6%` [█░░░░░░░░░] | `[View Ledger]` |

- **Credit Risk Highlighting**: Outstanding balances > ₹0 are rendered in bold Brick Crimson (`#9E2A2B`). Fully settled vendors display a clean green badge.

---

#### 3. Project-Wise Material Purchases Table
Demonstrates exactly where procured materials were delivered and consumed, feeding into Recorded Project Cost:

| Project Name & Code | Customer | Materials Allocated | Share of Total | Primary Material Types | Total Recorded Cost |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Velmurugan Villa**<br><span style="font-family:monospace;font-size:11px">PRJ-2026-0012</span> | K. Velmurugan | **₹5,10,000.00** | `17.9%` | Gypsum, LED Profile, Marine Plywood | `₹8,24,500.00` |
| **Kavitha Residence**<br><span style="font-family:monospace;font-size:11px">PRJ-2026-0015</span> | Kavitha Sundar | **₹4,20,000.00** | `14.7%` | Cement, Exterior Louvers, Primer | `₹6,80,000.00` |
| **Balaji Commercial**<br><span style="font-family:monospace;font-size:11px">PRJ-2026-0010</span> | R. Balaji | **₹7,80,000.00** | `27.4%` | Steel, ReadyMix Concrete, Glass | `₹12,40,000.00` |
| **General Company Stock** | Internal | **₹2,40,000.00** | `8.4%` | Consumables, Fasteners, Tools | `Overhead` |

- **Rule 18 Audit Footnote**: *"Materials Allocated represents confirmed purchase vouchers assigned to each project site. In strict accordance with Rule 18 standards, material procurement is accounted as project cost and is never netted against customer receipts or speculative margins."*

---

- **Mobile Responsive Layout**:
  - Horizontal swipeable tabs to toggle between `Supplier Breakdown` and `Project Allocation`.
  - Cards format each supplier and project row with clear financial badges and 48px touch targets.

#### Page 7.5: Workforce Reports (`/reports/workforce`)
  - **Purpose**: Authoritative human resources, site labor muster, and workforce financial audit report. Consolidates worker daily attendance records, man-day productivity metrics, earned wage liabilities, wage disbursements, and employee cash advance loan balances across all projects and trades.
  - **Rule 18 Architectural Mandate (Strict Non-Netting of Wages & Advances)**:
    - **Wage Account (Liability)**: Wages Earned, Wages Paid, and Wage Payable represent labor debts owed by Shivarivel to workers.
    - **Advance Account (Asset)**: Advances Given, Advance Recoveries, and Advance Outstanding represent company cash loans owed by workers back to Shivarivel.
    - **Zero Netting Guarantee**: The system strictly isolates these two financial accounts into separate cards, columns, and ledgers. It never displays a consolidated or netted "net balance" figure.
  
  - **Header & Master Filter Controls (Sticky Bar)**:
    - **Page Title**: `Workforce Reports` (24px bold Plus Jakarta Sans)
    - **Breadcrumbs**: `Reports / Workforce Reports` (12px text-secondary)
    - **Audit Subtitle**: *"Daily site muster audit, trade attendance distribution, earned wage liabilities, and employee advance recovery tracking."*
    - **Management Action Toolbar (Top Right)**:
      - `[Print Muster]`: Triggers a clean, black-and-white, ink-friendly tabular print stylesheet formatted for physical clipboard audits.
      - `[Export PDF]`: Downloads an official letterhead executive statement with corporate branding and audit signature blocks.
      - `[Export CSV]`: Raw line-item export for payroll processing and external accounting.
      - `[Export XLSX]`: Formatted multi-tab spreadsheet with pre-built formulas for trade sums and attendance counts.
      - `[Refresh Audit]`: Clears cache and re-queries verified attendance logs and wage vouchers.
    - **Master Filter Bar (Anchored beneath header)**:
      - **Filter 1: Employee Filter**:
        - Searchable combobox: `All Employees (38 Active)` or select specific worker (e.g., `EMP-001: Murugan S. (Master Mason)`).
        - Includes trade tag filter pills: `All Trades`, `Masonry`, `Carpentry`, `False Ceiling`, `Painting`, `Electrical`, `Plumbing`, `Helpers`.
      - **Filter 2: Project Filter**:
        - Select dropdown: `All Projects (Active & Completed)` or specific site (e.g., `PRJ-2026-0001: Dr. Arun Kumar Residence`, `PRJ-2026-0002: Green Villa Phase 2`, `General Workshop`).
      - **Filter 3: Date Range Picker**:
        - Quick Presets: `Today`, `This Week (Week 40)`, `This Month (Oct 2026)`, `Last Month (Sep 2026)`, `Quarter to Date`, `Custom Range`.
        - Dual Date Pickers: `From: 01/10/2026` to `To: 07/10/2026`.
      - `[Apply Filters]` Button (Deep Maroon `#4A0E0E`) & `[Reset Filters]` Ghost Button.

  - **Top Executive Summary KPI Grid (7 High-Impact Cards across 2 Tiers)**:
    
    *Tier 1: Attendance & Man-Day Muster Metrics (Physical Site Operations)*:
    1. **Total Attendance (Effective Man-Days)**:
       - Headline: `342.5 Man-Days` (Large 24px bold Charcoal `#242424`)
       - Caption: `Total verified labor shifts deployed across sites`
       - Micro-bar: `92.4% overall muster compliance against site schedule`
    2. **Workers Present**:
       - Headline: `320 Full Days` (Large 24px bold Emerald Forest `#1E6B37`)
       - Icon: `lucide: UserCheck` (Inside emerald tint square `#EAF5EE`)
       - Caption: `Full 8-hour site shifts completed`
    3. **Half Days Logged**:
       - Headline: `45 Half Days` (Large 24px bold Amber Ochre `#B86E00`)
       - Icon: `lucide: Clock4` (Inside amber tint square `#FEF5E7`)
       - Caption: `22.5 effective man-days equivalent (0.5 credit)`
    4. **Absences / Unpaid Leaves**:
       - Headline: `28 Absent Days` (Large 24px bold Brick Crimson `#9E2A2B`)
       - Icon: `lucide: UserX` (Inside brick red tint square `#FCEEEE`)
       - Caption: `Unplanned absenteeism: 7.6% of scheduled shifts`

    *Tier 2: Dual Financial Pillars (Rule 18 Strict Separation)*:
    - **Pillar A: Wage Liabilities Account (Owed by Shivarivel to Workers)**:
      5. **Wages Earned**:
         - Headline: `₹4,28,500.00` (Total gross labor liability accrued from verified attendance)
         - Sub-label: `Accrued Labor Cost`
         - Cost Allocation: `Charged directly to Recorded Project Costs`
      6. **Wages Paid**:
         - Headline: `₹3,45,000.00` (Total wages disbursed via bank transfer/cash vouchers)
         - Sub-label: `Settled Wage Outflow` (Emerald Forest text `#1E6B37`)
      7. **Wage Payable**:
         - Headline: `₹83,500.00` (Pending earned wage liability owed to workers)
         - Status: High-prominence Amber badge (`bg-[#FEF5E7] text-[#B86E00] border border-[#B86E00]/30`)
         - Sub-label: `Current Labor Due` (Pending weekly/monthly payout)

    - **Pillar B: Cash Advance Loan Account (Owed by Workers to Shivarivel)**:
      8. **Advances Given**:
         - Headline: `₹1,15,000.00` (Cumulative cash loans issued to workers)
         - Sub-label: `Company Cash Advanced`
      9. **Advance Recovery**:
         - Headline: `₹62,000.00` (Deductions recovered during wage payout settlements)
         - Sub-label: `Recovered Cash Credits` (Emerald Forest text `#1E6B37`)
      10. **Advance Outstanding**:
          - Headline: `₹53,000.00` (Pending loan asset owed back by workers to company)
          - Status: High-prominence Brick Crimson badge (`bg-[#FCEEEE] text-[#9E2A2B] border border-[#9E2A2B]/30`)
          - Sub-label: `Company Asset Recoverable`

    - **Non-Netting Visual Isolation Bar**:
      - A full-width architectural divider separating the Wage Account from the Advance Account with warning callout:
      > `[!] Rule 18 Audit Standard: Wage Payable (₹83,500.00 owed to workers) and Advance Outstanding (₹53,000.00 owed by workers) are legally independent accounts. Never net advances against unpaid wages without an explicit settlement voucher.`

  - **Tabbed Report Views**:
    - **Tab 1: Worker-by-Worker Muster & Wage Ledger (Default View)**
    - **Tab 2: Daily Attendance Muster Matrix (Calendar Grid View)**
    - **Tab 3: Project-Wise Labor Allocation & Cost Summary**
    - **Tab 4: Advance Recovery & Loan Aging Ledger**

  - **View 1: Worker-by-Worker Muster & Wage Ledger (Detailed Table)**:
    - Architectural table layout with horizontal scrolling support:
      - `Worker Name & ID`: Avatar with initials, Full Name (e.g., `Murugan S.`), Badge with System ID (`EMP-001`), Primary Trade (`Master Mason`).
      - `Assigned Project`: Current primary job site (`PRJ-2026-0001: Dr. Arun Kumar Residence`).
      - `Attendance Breakdown`:
        - Present: `24 P` (Emerald text)
        - Half Days: `2 HD` (Amber text)
        - Absences: `2 A` (Red text)
        - Effective Man-Days: `25.0 Days` (Bold Charcoal)
      - `Daily Wage Rate`: `₹950.00 / day` (Tabular monospace numeral).
      - `Wages Earned`: `₹23,750.00` (Calculated as `Effective Man-Days × Wage Rate`).
      - `Wages Paid`: `₹19,000.00` (Verified wage settlement payments).
      - `Wage Payable`: `₹4,750.00` (Amber pill if > 0, Gray checkmark if ₹0.00).
      - `Advances Issued`: `₹8,000.00` (Total cash advance vouchers issued).
      - `Advance Recovered`: `₹5,000.00` (Deductions logged in payment vouchers).
      - `Advance Outstanding`: `₹3,000.00` (Crimson pill if > 0, Gray checkmark if ₹0.00).
      - `Actions`: `[View Profile]` (Navigates to `/employees/:id`), `[Muster Log]` (Opens daily shift modal).
    - Table Summary Footer Row:
      - Displays column totals: `Total Workers: 38`, `Total Man-Days: 342.5`, `Wages Earned: ₹4,28,500.00`, `Wages Paid: ₹3,45,000.00`, `Wage Payable: ₹83,500.00`, `Advances Given: ₹1,15,000.00`, `Advances Recovered: ₹62,000.00`, `Advance Outstanding: ₹53,000.00`.

  - **View 2: Daily Attendance Muster Matrix (Calendar Grid View)**:
    - Provides site supervisors and payroll clerks with a high-density 31-day visual punch card:
      - Rows: Worker Name & Trade.
      - Columns: Days of the selected date range (`01 Oct`, `02 Oct`, `03 Oct` ... `31 Oct`).
      - Cells:
        - `P` in Green square (`bg-[#EAF5EE] text-[#1E6B37]`): Full-day present.
        - `H` in Yellow square (`bg-[#FEF5E7] text-[#B86E00]`): Half-day shift (4 hours).
        - `A` in Red square (`bg-[#FCEEEE] text-[#9E2A2B]`): Unexcused absence.
        - `L` in Blue square (`bg-[#EBF2F7] text-[#2E6B9E]`): Approved leave.
        - `OFF` in Slate square (`bg-[#F1F3F5] text-[#6B6B6B]`): Weekly off / Sunday.
      - Sticky Left Columns: Worker Name, Trade, Total Present, Total Half Days, Total Absences.
      - Interactive Cell Hover: Tooltip displays logged site location, check-in time (`8:32 AM`), supervisor who verified the muster, and site note.

  - **View 3: Project-Wise Labor Allocation & Cost Summary**:
    - Summarizes how workforce costs are allocated across active construction and interior sites:
      - Columns:
        1. `Project Code & Name`: e.g., `PRJ-2026-0001: Dr. Arun Kumar Residence`
        2. `Active Workers Deployed`: `14 Workers`
        3. `Total Man-Days Logged`: `184.0 Man-Days`
        4. `Wages Earned (Labor Cost)`: `₹2,18,400.00` (Direct project labor cost)
        5. `Wages Settled`: `₹1,80,000.00`
        6. `Unsettled Labor Liability`: `₹38,400.00`
        7. `% of Recorded Project Cost`: `26.5%` of total recorded physical site expenditure
    - Explicit Accounting Note: *"Labor costs allocated here directly feed into the Recorded Project Cost calculation without netting against customer milestone billings."*

  - **View 4: Advance Recovery & Loan Aging Ledger**:
    - Dedicated audit view focusing exclusively on outstanding employee cash advances:
      - Columns: Employee Name, Initial Advance Date, Total Advance Sanctioned, Amount Recovered to Date, Outstanding Balance, Last Deduction Date, Months Active, Recovery Status (`Active Deduction`, `Slow Recovery`, `Overdue`).
      - Filters: `Show Only Outstanding Advances`, `Sort by Highest Outstanding`.

  - **Mobile Responsive Layout (360px Optimized)**:
    - Sticky filter drawer accessible via a compact top filter pill: `Filter: All Workers • 01-07 Oct [Edit]`.
    - Horizontal swipeable tabs: `Muster & Wages`, `Calendar Matrix`, `Project Allocation`, `Advances`.
    - Summary KPI cards collapse into a clean 2x2 grid for Attendance and two dedicated full-width cards for Wage Liability vs Advance Asset.
    - Employee ledger renders as high-density structured cards:
      - Top row: Worker Name, Trade Tag, Daily Rate (`₹950/day`).
      - Middle row: Attendance Pill (`24P • 2HD • 2A = 25.0d`).
      - Bottom dual-strip:
        - Left strip (Beige/Amber): `Wage Payable: ₹4,750.00`
        - Right strip (Pink/Crimson): `Adv. Due: ₹3,000.00`
      - Expandable tap reveals full breakdown and transaction drilldown.

#### Page 7.6: Payment Reports (`/reports/payments`)
  - **Purpose**: Authoritative enterprise treasury, cash flow, and payment audit statement. Systematically segregates all incoming customer milestone collections, outgoing supplier procurement payments, and employee wage/advance disbursements under strict Rule 18 non-netting standards.
  - **Rule 18 Treasury Mandate (Strict Ledger Segregation)**:
    - **Customer Receipts (Inflows)**: Tracked as milestone liquidations against contracted customer values.
    - **Supplier Payments (Outflows)**: Tracked as vendor bill liquidations against confirmed purchase orders.
    - **Employee Disbursements (Outflows)**: Clearly segregated between wage liability settlements and cash advance loan recoveries.
    - **Zero Inflow/Outflow Blending**: The system deliberately provides dedicated, isolated tabs for Customer, Supplier, and Employee payments rather than blending them into a misleading single ledger or computing speculative "net profit".

  - **Header & Master Export Toolbar**:
    - **Page Title**: `Payment Reports` (24px bold Plus Jakarta Sans)
    - **Breadcrumbs**: `Reports / Payment Reports` (12px text-secondary)
    - **Audit Subtitle**: *"Official audit-grade payment statement segregating customer inflows, material supplier disbursements, and workforce labor payouts."*
    - **Management Action Toolbar (Top Right)**:
      - `[Print Statement]`: Clean black-and-white, ink-optimized layout for treasury filing and bank reconciliation.
      - `[Export PDF]`: Formal corporate letterhead audit report with company branding, page numbers, and authorized signature blocks.
      - `[Export CSV]`: Raw line-item transaction export formatted for Tally, Zoho Books, or external accounting software.
      - `[Export XLSX]`: Formatted multi-tab spreadsheet with pre-built formulas for entity sums and payment mode subtotals.
      - `[Refresh Ledger]`: Live refresh querying verified database payment vouchers.

  - **Master Filter Controls (Sticky Bar)**:
    - **Date Range Picker**:
      - Quick Presets: `Today`, `This Week`, `This Month (Oct 2026)`, `Last Month (Sep 2026)`, `Quarter to Date`, `Financial Year (FY 2026-27)`, `Custom Range`.
      - Dual Pickers: `From: 01/10/2026` to `To: 07/10/2026`.
    - **Project Filter**:
      - Select dropdown: `All Projects (Active & Completed)` or specific site (`PRJ-2026-0001: Dr. Arun Kumar Residence`, `PRJ-2026-0002: Green Villa Phase 2`, `General Company Overhead`).
    - **Payment Mode Filter**:
      - Multi-select dropdown: `All Modes`, `NEFT / RTGS`, `UPI / GPay`, `Cheque / DD`, `Cash`.
    - **Status Filter**:
      - Dropdown: `All Statuses`, `Confirmed / Cleared`, `Pending Clearance`, `Voided / Reversed`.
    - `[Apply Filters]` Button (Deep Maroon `#4A0E0E`) & `[Reset Filters]` Ghost Button.

  - **Primary Tab Navigation (3 Distinct Financial Ledgers)**:
    - Clean architectural tab switcher with badge counters:
      - `[Tab 1: Customer Payments (18 Receipts)]` (Active Gold underline `#C99A2E`)
      - `[Tab 2: Supplier Payments (34 Disbursements)]`
      - `[Tab 3: Employee Payments (42 Settlements)]`

  ---

  ### TAB 1: CUSTOMER PAYMENTS (REVENUE INFLOWS)
  - **Summary Cards (4 KPI Cards)**:
    1. **Total Inflow Collected**:
       - Headline: `+₹14,50,000.00` (Large 24px bold Emerald Forest `#1E6B37` on `#FFFFFF`)
       - Icon: `lucide: ArrowDownLeft` (Inside emerald tint square `#EAF5EE`)
       - Caption: `Realized milestone collections for the selected period`
    2. **Receipts Logged**:
       - Headline: `18 Receipts` (24px bold Charcoal `#242424`)
       - Caption: `100% verified against bank credits`
    3. **Average Collection Size**:
       - Headline: `₹80,555.00` (24px bold Charcoal `#242424`)
       - Caption: `Per customer payment transaction`
    4. **Pending Bank Clearance**:
       - Headline: `₹2,00,000.00` (24px bold Amber Ochre `#B86E00` on `#FEF5E7`)
       - Icon: `lucide: Clock` (Inside amber tint square)
       - Caption: `2 Cheque receipts deposited; awaiting clearing`

  - **Customer Payment Ledger Table**:
    - **Columns (Strictly Standardized)**:
      1. **Date**: `05 Oct 2026` (Tabular date with subtle time caption `2:45 PM`).
      2. **Entity (Customer)**:
         - Primary: `Dr. Arun Kumar` (Bold Charcoal).
         - Secondary: `+91 98401 23456` • `Individual Resident`.
      3. **Project**:
         - Badge: `PRJ-2026-0001` (Gold tint `#F9F3E5` text `#8C6514`).
         - Site Title: `Dr. Arun Kumar Residence (Thiruvanmiyur)`.
      4. **Amount**:
         - Value: `+₹3,50,000.00` (Bold Emerald Forest `#1E6B37`, tabular monospace numeral).
         - Milestone Caption: `Milestone 3: First Floor Slab Completion`.
      5. **Reference**:
         - System ID: `RCPT-0045` (Monospace font).
         - External Ref: `NEFT / HDFC-N392019482` (or `CHQ #409211`).
      6. **Status**:
         - Badge: `Confirmed / Cleared` (Emerald Forest pill: `bg-[#EAF5EE] text-[#1E6B37] border border-[#1E6B37]/30`).
         - (Or `Pending Clearance` in Amber Ochre pill).
      7. **Actions**: `[View Receipt PDF]` `[Audit Trail]`.
    - **Table Footer Summary**:
      - Displays total receipts count (`18 Receipts`) and cumulative cash collected (`₹14,50,000.00`).

  ---

  ### TAB 2: SUPPLIER PAYMENTS (PROCUREMENT OUTFLOWS)
  - **Summary Cards (4 KPI Cards)**:
    1. **Total Supplier Disbursements**:
       - Headline: `-₹9,80,000.00` (Large 24px bold Charcoal `#242424` on `#FFFFFF`)
       - Icon: `lucide: ArrowUpRight` (Inside soft stone square `#EFECE6`)
       - Caption: `Material procurement bill liquidations`
    2. **Disbursement Vouchers**:
       - Headline: `34 Vouchers` (24px bold Charcoal)
       - Caption: `Covering 48 verified purchase invoices`
    3. **Advance Credits Utilized**:
       - Headline: `₹65,000.00` (24px bold Charcoal)
       - Caption: `Pre-existing supplier deposits liquidated`
    4. **Pending Bank Clearance**:
       - Headline: `₹1,20,000.00` (24px bold Amber Ochre `#B86E00` on `#FEF5E7`)
       - Caption: `1 RTGS voucher initiated; awaiting bank debited status`

  - **Supplier Payment Ledger Table**:
    - **Columns (Strictly Standardized)**:
      1. **Date**: `04 Oct 2026` (Subtle time caption `11:15 AM`).
      2. **Entity (Supplier)**:
         - Primary: `Sri Lakshmi Steel Traders` (Bold Charcoal).
         - Secondary: `GSTIN: 33AAAAA0000A1Z5` • *Civil Materials*.
      3. **Project**:
         - Badge: `PRJ-2026-0001` (Gold tint).
         - Site Title: `Dr. Arun Kumar Residence` (or `General Stock`).
      4. **Amount**:
         - Value: `₹2,45,000.00` (Bold Charcoal `#242424`, tabular monospace numeral).
         - Allocation Caption: `Settles PO-2026-0042 (TMT Steel Bars)`.
      5. **Reference**:
         - System ID: `SPAY-0089` (Monospace font).
         - External Ref: `RTGS / ICIC-R930192841` (Mode: `Bank Transfer`).
      6. **Status**:
         - Badge: `Confirmed / Settled` (Emerald Forest pill).
      7. **Actions**: `[View Voucher]` `[Purchase PO Link]`.
    - **Table Footer Summary**:
      - Displays total vouchers count (`34 Vouchers`) and cumulative vendor payouts (`₹9,80,000.00`).

  ---

  ### TAB 3: EMPLOYEE PAYMENTS (WORKFORCE SETTLEMENTS & ADVANCES)
  - **Rule 18 Architectural Mandate**: Clearly distinguishes between liquid wage payments disbursed to workers versus advance loan recoveries deducted from wage settlements.
  - **Summary Cards (4 KPI Cards)**:
    1. **Total Employee Disbursements**:
       - Headline: `-₹3,45,000.00` (Large 24px bold Charcoal `#242424`)
       - Icon: `lucide: Wallet` (Inside soft stone square `#EFECE6`)
       - Caption: `Total net cash & bank disbursements to workers`
    2. **Wage Liability Liquidated**:
       - Headline: `₹2,83,000.00` (24px bold Charcoal)
       - Caption: `Direct wage payouts settled to worker bank accounts / cash`
    3. **Advance Deductions Recovered**:
       - Headline: `₹62,000.00` (24px bold Emerald Forest `#1E6B37` on `#EAF5EE`)
       - Caption: `Loan recoveries deducted at payout (reclaimed company asset)`
    4. **Direct Cash Advances Sanctioned**:
       - Headline: `₹1,15,000.00` (24px bold Deep Maroon `#4A0E0E` on `#F9F3E5`)
       - Caption: `Emergency worker loan advances issued during period`

  - **Employee Payment Ledger Table**:
    - **Columns (Strictly Standardized)**:
      1. **Date**: `02 Oct 2026` (Subtle time caption `6:30 PM`).
      2. **Entity (Employee)**:
         - Primary: `Murugan S.` (Bold Charcoal).
         - Secondary: `EMP-001` • *Master Mason*.
      3. **Project**:
         - Badge: `PRJ-2026-0001` (Gold tint).
         - Site Title: `Dr. Arun Kumar Residence`.
      4. **Amount**:
         - Net Disbursed: `₹19,000.00` (Bold Charcoal `#242424`, monospace).
         - Allocation Split: `Wage: ₹21,000.00 | Adv. Ded: -₹2,000.00`.
      5. **Reference**:
         - System ID: `EPAY-0042` (Monospace font).
         - External Ref: `UPI / PhonePe / 9840123456@ybl`.
      6. **Status**:
         - Badge: `Settled / Paid` (Emerald Forest pill).
      7. **Actions**: `[View Pay Slip]` `[Worker Ledger Link]`.
    - **Table Footer Summary**:
      - Displays total settlement vouchers (`42 Disbursements`), total wage liability cleared (`₹2,83,000.00`), and loan advances recovered (`₹62,000.00`).

  ---

  - **Mobile Responsive Layout (360px Optimized)**:
    - Sticky top 3-segment pill control: `[Customer] [Supplier] [Employee]`.
    - Filter drawer accessible via a compact sticky button: `Filters (Oct 2026 • All Projects) [v]`.
    - Summary KPI cards format as a clean 2x2 grid.
    - Ledger rows render as responsive cards:
      - Top row: Transaction Date, Reference Badge (`RCPT-0045`), Status Pill (`Cleared`).
      - Middle row: Entity Name (Bold 15px), Project Code Badge.
      - Bottom row: Formatted Amount (`+₹3,50,000.00` in Green or `-₹2,45,000.00` in Charcoal), Payment Method Tag (`UPI`, `NEFT`).
      - Tap expands full allocation breakdown, bank UTR, and export PDF receipt action.

---

### MODULE 8: SETTINGS & ADMINISTRATION

#### Page 8.1: Company Profile (`/settings/company`)
- **Purpose**: Authoritative corporate master configuration. Establishes legal branding, communication coordinates, and tax details that dynamically populate invoice headers, customer estimate sheets, project contracts, and formal audit reports.
- **Header & Layout Architecture**:
  - **Header**: `Company Profile` (24px bold Plus Jakarta Sans)
  - **Subtitle**: *"Manage company brand assets, contact channels, statutory tax credentials, and preview document print letterheads."*
  - **Save Action**: Primary Sticky Bottom/Top Button `[Save Changes]` (Deep Maroon `#4A0E0E` with feedback spinner).
- **2-Column Responsive Layout (Desktop 7:5 Grid / Mobile Stacked)**:
  - **Left Column: Company Information Form**:
    1. **Company Logo Uploader**:
       - Drag & drop avatar container (120x120px) with fallback monogram badge `SC` (Deep Maroon & Warm Gold).
       - Actions: `[Upload New Logo]` (PNG/JPG/SVG, max 5 MB, transparent background recommended), `[Remove]`.
    2. **Company Name**:
       - Input field: `SHIVARIVEL CONSTRUCTION & INTERIORS` (Mandatory, bold 16px).
    3. **Address & Headquarters**:
       - Multi-line textarea: Street address, Floor/Suite, Landmark, City (`Chennai / Kanchipuram`), State (`Tamil Nadu`), PIN Code (`600041`).
    4. **Contact Channels**:
       - **Phone**: Primary Phone (`+91 98400 12345`) and Alternate Site Helpline (`+91 94440 67890`).
       - **Email**: Official Corporate Email (`contact@shivarivel.com` / `billing@shivarivel.com`).
       - **Website**: Web Address (`https://shivarivel.com` - optional with valid URL check).
    5. **Business & Statutory Details**:
       - **Business Structure**: Partnership / Private Limited / Proprietorship selector.
       - **GSTIN**: 15-character alphanumeric tax identifier (`33AAAAA0000A1Z5`) with auto-validation format regex.
       - **PAN**: 10-character Permanent Account Number (`ABCDE1234F`).
       - **Bank Account Details**: Bank Name (`HDFC Bank Ltd`), Branch (`Thiruvanmiyur`), Account Number, IFSC Code (`HDFC0001234`), UPI ID (`shivarivel@hdfcbank`).
       - **Company Tagline**: *"Excellence in Planning, Elevation & Construction"*.
  - **Right Column: Live Letterhead & Report Preview Pane**:
    - **Header**: `Live Document Preview (PDF / Print Header)`
    - **Interactive Preview Card (Sheet Paper Simulation `#FFFFFF` with architectural border `#E2DDD5`)**:
      - Shows exactly how estimates, invoices, and weekly management reports will render:
      ```
      +-------------------------------------------------------------------------+
      | [LOGO]  SHIVARIVEL CONSTRUCTION & INTERIORS                             |
      |         Building Planning • 3D Elevation • Civil Contracting • Interiors|
      |         No. 42, Architectural Avenue, Thiruvanmiyur, Chennai - 600041   |
      |         Phone: +91 98400 12345 | Email: contact@shivarivel.com          |
      |         GSTIN: 33AAAAA0000A1Z5 | PAN: ABCDE1234F                        |
      +-------------------------------------------------------------------------+
      ```
      - Instant live updating: Any character typed into the form dynamically re-renders in the preview canvas.

---

#### Page 8.2: Users & Permissions (`/settings/users`)
- **Purpose**: Manage staff logins, team assignments, and operational security levels. Enforces understandable access boundaries without exposing technical Row-Level Security (RLS) jargon to normal business users.
- **Header & Action Bar**:
  - **Title**: `Users & Roles` (24px bold Plus Jakarta Sans)
  - **Subtitle**: *"Manage team access, invite staff members, and assign role-based operational permissions."*
  - **Primary CTA**: `[+ Invite User]` (Deep Maroon `#4A0E0E` button with mail icon).
- **Summary Cards (4 KPI Cards)**:
  - `Total Users`: `6 Active Accounts`
  - `Field Supervisors`: `3 Mobile Users`
  - `Project Managers`: `1 Active`
  - `Pending Invitations`: `1 Sent`
- **Users Table**:
  - **Columns**:
    1. **User**: Name avatar, Full Name (e.g., `Er. Sundaramoorthy`), Phone number.
    2. **Email**: `sundar@shivarivel.com` (with verified checkmark badge).
    3. **Role**: Visual role pill with distinct color-coding.
    4. **Status**: `Active` (Emerald pill) / `Invited (Pending)` (Amber pill) / `Deactivated` (Slate pill).
    5. **Last Activity**: `Active 12 mins ago` (or `Last login: Yesterday, 7:15 PM`).
    6. **Actions**: `[Edit Role]`, `[Deactivate / Suspend]`, `[Resend Invite]`.

- **Understandable Roles Matrix (Zero Technical Jargon)**:
  Every role is explained in clean business terms:
  1. **Owner**: Full access across all 8 modules, unrestricted financial visibility, ability to delete records, company settings, and user management.
  2. **Admin**: Operational management, customer onboarding, purchase approvals, and reporting; cannot edit company tax or bank master profile.
  3. **Project Manager / Supervisor**: Full access to assigned projects, site progress logs, BOQ estimates, material purchase entry, and worker attendance muster; financial summaries restricted to project-level recorded costs.
  4. **Site Supervisor**: Field-first mobile access restricted to *My Day*, daily attendance muster marking, daily site reports, site photos, and petty field expenses.
  5. **Accountant**: Dedicated access to customer receipts, supplier bills, payment vouchers, employee wages, and advance recovery ledgers; restricted from modifying technical project specifications or deleting audits.
  6. **Viewer**: Read-only oversight for external project advisors, architects, or client audit representatives.

- **Invite / Edit User Modal**:
  - Fields: Full Name, Email Address, Mobile Phone (for WhatsApp/SMS login link), Role Selector (with plain-English permission bullet list for the selected role), Assigned Projects (All Projects or specific site assignments).
  - Primary Action: `[Send Invitation Link]`.

---

#### Page 8.3: Service Types Configuration (`/settings/services`)
- **Purpose**: Manage the commercial catalog of architectural and construction services offered by Shivarivel. Dynamically populates customer enquiry intake, service tagging, estimate line items, and marketing analytics.
- **Architectural Principle**: Single lightweight master data entity (`service_types`). Does **not** create separate redundant database tables or fractured modules for each service.
- **Header**:
  - **Title**: `Service Types` (24px bold Plus Jakarta Sans)
  - **Subtitle**: *"Manage commercial service offerings, default descriptions, and active status for estimates and enquiries."*
  - **Primary CTA**: `[+ Add Service Type]` (Deep Maroon `#4A0E0E` button).

- **Standard Service Offerings (Out of the Box)**:
  1. `Building Plan` (2D architectural floor plans, Vastu compliance layouts, structural drawings)
  2. `3D Plan` (Isometric 3D floor plan renderings with furniture layouts)
  3. `Approval Plan` (Corporation/CMDA/DTCP municipal submission drawings)
  4. `Estimate & Valuation` (Detailed itemized BOQs, bank loan valuations, rate analysis)
  5. `Building Contractor` (Turnkey civil contracting, foundation, structural RCC, and brickwork)
  6. `3D Elevation` (Photorealistic exterior elevations, facade lighting, texturing)
  7. `False Ceiling` (Gypsum, POP, wooden baffle ceiling grids with profile cutouts)
  8. `Interior Works` (Modular kitchens, wardrobes, TV units, wall paneling, acoustic finishes)
  9. `Exterior Works` (Compound wall design, landscaping, weather-proof cladding, exterior textures)
  10. `Profile Lighting` (Concealed linear LED profiles, magnetic tracks, cove lighting design)
  11. `Site Surveying` (Topographical digital surveying, total station measurements, boundary demarcation)

- **Service Types Table**:
  - **Columns**:
    1. **Service**: Service Title with Category Icon (e.g., `Building Plan` with blueprint icon).
    2. **Description**: Concise scope description (e.g., *"Comprehensive architectural floor plans conforming to CMDA / municipal building bylaws"*).
    3. **Status**: `Active` (Emerald Forest badge) / `Inactive` (Muted Slate badge).
    4. **Created**: `15 Aug 2026` (Formatted date).
    5. **Actions**: `[Edit]` (modal), `[Deactivate / Activate]` (toggle).

- **Add / Edit Service Type Modal**:
  - Fields:
    - Service Name (Input, e.g., `Profile Lighting`)
    - Description (Textarea, default scope of work template)
    - Active Toggle (`Active for new enquiries and estimates`)
  - Actions: `[Cancel]` and `[Save Service]`.

---

## 8. UX FLOWS & INTERACTION DESIGN EXAMPLES

### 8.1 "The 7:30 AM Morning Routine" (Mobile Flow for the Owner)
1. **PWA Launch**: Owner opens app on mobile phone; instantly enters `My Day` (tab 1).
2. **Review Attention Items**: Sees 2 overdue customer follow-ups and 1 site visit scheduled at 10:00 AM.
3. **One-Tap Action**: Taps the WhatsApp icon on the first follow-up; app launches WhatsApp with a pre-filled personalized message (*"Hello Priya garu, regarding your interior elevation plan..."*).
4. **Mark Attendance**: Taps central `+` FAB -> Selects `Mark Attendance` -> Reviews worker list, toggles 1 absent helper, taps `Confirm`. Takes 25 seconds.
5. **Project Pulse Check**: Taps `Projects` (tab 2) -> Glances at completion percentages.

### 8.2 "Receiving a Customer Cheque on Site" (Mobile Flow)
1. Taps `+` FAB -> `Record Customer Payment`.
2. Selects Customer: `K. Velmurugan` -> Associated project automatically selects.
3. System shows: `Outstanding Due: ₹4,50,000` -> Enters `₹2,00,000`.
4. Snaps photo of cheque using mobile camera.
5. Taps `Save Receipt`. Toast appears: `Payment RCPT-0045 recorded successfully`. Customer outstanding due immediately drops to `₹2,50,000`.

### 8.3 "Supervisor Evening Daily Site Log" (Tablet / Mobile Flow)
1. Supervisor arrives home / site office at 6:00 PM.
2. Selects Project -> Taps `+ Add Daily Report`.
3. Auto-fills date and weather. Enters work done: *"Living room ceiling grid completed. Primer coat applied on master bedroom walls."*
4. Selects 4 progress photos from phone gallery.
5. Submits report -> Report is instantly visible on Owner's dashboard.

---

## 9. ERROR, LOADING, AND EMPTY STATE STANDARDS

### 9.1 Loading States (Zero Blank Screens)
- **Table Skeleton**: 6 rows of pulsing muted bars matching the exact column widths.
- **Card Skeleton**: Top badge shimmer, large number shimmer, bottom label shimmer.
- **Button Mutation State**: Clicking `[Save Purchase]` replaces the text with a 16px spinning ring (`lucide: Loader2`), disables pointer events, and prevents double-submission.

### 9.2 Unified Empty-State Design System
- **Design Philosophy**:
  - **Dignified & Professional**: Never use giant, childish cartoon illustrations, oversized empty boxes, or playful animations.
  - **Subtle Architectural & Business Icons**: 48x48px monochromatic or duo-tone line icons in Deep Maroon (`#4A0E0E`) or Warm Gold (`#C99A2E`) encased in a soft stone circular background (`#EFECE6` or `#F9F3E5`).
  - **Strict 4-Part Structure for Every Empty State**:
    1. **Icon**: Dignified architectural/business icon.
    2. **Title**: Direct, reassuring heading (18px bold Plus Jakarta Sans).
    3. **One Sentence Description**: Clear, positive sentence explaining why this list is empty and what to do next.
    4. **Primary Action Button**: High-visibility button triggering the creation flow.

- **Standardized Empty-State Catalog Across the ERP**:

  1. **No customers yet**:
     - **Icon**: `lucide: Users` inside soft stone badge (`#EFECE6`).
     - **Title**: `No customers yet`
     - **One Sentence**: *"Add your first client to start logging enquiries, site consultations, and estimates."*
     - **Primary Action**: `[+ Add First Customer]` (Deep Maroon button).

  2. **No projects yet**:
     - **Icon**: `lucide: Building2` inside warm gold tint badge (`#F9F3E5`).
     - **Title**: `No projects yet`
     - **One Sentence**: *"Convert an accepted estimate or create a new construction project to begin tracking site progress."*
     - **Primary Action**: `[+ Create New Project]`.

  3. **No payments recorded**:
     - **Icon**: `lucide: ReceiptIndianRupee` inside emerald tint badge (`#EAF5EE`).
     - **Title**: `No payments recorded`
     - **One Sentence**: *"Record customer milestone receipts or vendor disbursement vouchers to activate this ledger."*
     - **Primary Action**: `[+ Record First Payment]`.

  4. **No reports available**:
     - **Icon**: `lucide: FileBarChart` inside soft stone badge (`#EFECE6`).
     - **Title**: `No reports available`
     - **One Sentence**: *"Generate your first weekly management summary or project cost audit to view business analytics."*
     - **Primary Action**: `[Generate New Report]`.

  5. **No tasks today**:
     - **Icon**: `lucide: CheckCircle2` inside warm gold tint badge (`#F9F3E5`).
     - **Title**: `No tasks today`
     - **One Sentence**: *"You have cleared all pending site inspections and follow-ups scheduled for today."*
     - **Primary Action**: `[+ Schedule Site Task]`.

  6. **No documents uploaded**:
     - **Icon**: `lucide: FolderUp` inside soft stone badge (`#EFECE6`).
     - **Title**: `No documents uploaded`
     - **One Sentence**: *"Upload architectural plans, 3D renderings, statutory approvals, or site photos to this repository."*
     - **Primary Action**: `[+ Upload First Document]`.

---

### 9.3 Unified Error-State System
- **Design Philosophy**:
  - **Zero Technical Exposure**: Raw database/Supabase exceptions (e.g., `PGRST116`, `JWT expired`, `violates foreign key constraint`, `42501 permission denied`) are **never** shown to users.
  - **Human-Centric & Actionable**: Every error state clearly explains:
    1. **What happened**: In plain construction/business English.
    2. **What the user can do**: Clear instructions on next steps.
    3. **Primary Action**: `[Retry]` (or specific contextual recovery button).

- **Standardized Error Types & Specifications**:

  1. **Network Error (Connection Lost)**:
     - **Icon**: `lucide: WifiOff` (Brick Crimson `#9E2A2B` on `#FCEEEE`).
     - **Title**: `Connection Interrupted`
     - **What Happened**: *"Unable to reach the server. Your internet connection may be unstable or offline."*
     - **What User Can Do**: *"Check your Wi-Fi or mobile data connection. Any unsaved form drafts have been preserved locally."*
     - **Primary Action**: `[Retry Connection]` (Deep Maroon button).
     - **Secondary Action**: `[Work Offline]`.

  2. **Permission Denied (Role Boundary)**:
     - **Icon**: `lucide: ShieldAlert` (Amber Ochre `#B86E00` on `#FEF5E7`).
     - **Title**: `Access Restricted`
     - **What Happened**: *"You do not have administrative permission to view or modify this financial record."*
     - **What User Can Do**: *"If you need access to full company accounts or settings, please contact the Owner or System Administrator."*
     - **Primary Action**: `[Return to Dashboard]` (or `[Switch User]`).

  3. **Validation Error (Form Integrity)**:
     - **Icon**: `lucide: AlertCircle` (Brick Crimson `#9E2A2B`).
     - **Title**: `Please Check Form Details`
     - **What Happened**: *"Some required information is missing or entered in an incorrect format."*
     - **What User Can Do**: *"Review the highlighted fields marked in red (e.g., invalid GSTIN format or missing project milestone) and submit again."*
     - **Primary Action**: `[Review Fields]` (Auto-focuses first invalid input).
     - **Rule**: User inputs are **never wiped or cleared** on validation failure.

  4. **Server Error (Backend Exception)**:
     - **Icon**: `lucide: ServerCrash` (Brick Crimson `#9E2A2B` on `#FCEEEE`).
     - **Title**: `Service Temporarily Unavailable`
     - **What Happened**: *"We encountered an unexpected error while processing this transaction. Our technical team has been notified."*
     - **What User Can Do**: *"Wait a moment and try again. Your existing data remains completely secure."*
     - **Primary Action**: `[Retry Action]` (with auto-cooldown timer).
     - **Secondary Action**: `[Contact Support]`.

  5. **Not Found (Missing Resource / 404)**:
     - **Icon**: `lucide: FileQuestion` (Muted Charcoal `#6B6B6B` on `#EFECE6`).
     - **Title**: `Record Not Found`
     - **What Happened**: *"The requested project, estimate, or document voucher does not exist or may have been archived."*
     - **What User Can Do**: *"Double-check the reference ID or return to the main listing directory."*
     - **Primary Action**: `[Back to Listing]`.

  6. **Session Expired (Auth Timeout)**:
     - **Icon**: `lucide: Lock` (Warm Gold `#C99A2E` on `#F9F3E5`).
     - **Title**: `Session Expired for Security`
     - **What Happened**: *"Your active session has timed out after an extended period of inactivity."*
     - **What User Can Do**: *"Log in again to verify your credentials. Any pending form inputs have been saved to your browser session."*
     - **Primary Action**: `[Log In to Resume]` (Opens modal login without page redirect/data loss).


---

## 9.4 Modular Design Extensions
The exhaustive modular design specifications are documented in:
- [Module 05: Project Management Design Specification](file:///c:/Users/prasa/OneDrive/Desktop/projectP/docs/module_05_project_management_design.md) (Covers Projects List, New Project, Project Detail Command Center, Overview, Work Progress, Non-Netting Project Finance, Purchases, Workforce, Field Daily Reports, 11-Category Document Vault, Mobile Experience, State Matrices, and Accessibility).
- [Module 06: Procurement & Supplier Management Design Specification](file:///c:/Users/prasa/OneDrive/Desktop/projectP/docs/module_06_procurement_design.md) (Covers Suppliers Directory, New Supplier, Supplier Detail Ledger, Materials Reference Catalog, Material Purchases, New Purchase, Purchase Detail, Multi-Purchase Supplier Payments Allocation Matrix, Project Cost Integration, Mobile Experience, and Accessibility).
- [Module 07: Workforce & Labor Management Design Specification](file:///c:/Users/prasa/OneDrive/Desktop/projectP/docs/module_07_workforce_design.md) (Covers Employees Directory, New Employee, Employee Command Center, 60-Second Rapid Field Attendance Muster, Wage Earnings Ledger, Cash Advances, Wage Settlements with Advance Deductions, Strict Rule 18 Non-Netting, Dashboard Integration, Mobile Experience, and Accessibility).
- [Module 08: Finance & Treasury Design Specification](file:///c:/Users/prasa/OneDrive/Desktop/projectP/docs/module_08_finance_design.md) (Covers 4-Pillar Financial Cockpit, Customer Finance & Payments, Supplier Finance & Allocations, Employee Finance, Direct Site Expenses, Recorded Project Cost Purity, Zero-Profit Mandate, Mobile Financial Ergonomics, and Accessibility).
- [Module 09: Reports & Business Audit Design Specification](file:///c:/Users/prasa/OneDrive/Desktop/projectP/docs/module_09_reports_design.md) (Covers Reports Directory, Weekly Management Reports, Project Reports, Procurement & Material Reports, Workforce & Muster Reports, Payment Journals, Strict Rule 18 Non-Netting, Printable A4 Letterhead Layouts, CSV Export UX, and Accessibility).
- [Module 10: Settings & Administration Design Specification](file:///c:/Users/prasa/OneDrive/Desktop/projectP/docs/module_10_settings_design.md) (Covers Company Profile & Logo Branding, Users & Roles Governance, Supervisor Project Scoping & Operational Permissions, 10 Commercial Service Types, Unsaved Changes Shield, Security Safeguards, and Accessibility).
- [Module 11: Global UX & Final Design Audit Specification](file:///c:/Users/prasa/OneDrive/Desktop/projectP/docs/module_11_global_ux_final_audit.md) (Covers Master Design System Harmonization, 8-Domain IA Tree, Button & Form Standards, Table/Card System, Financial Non-Netting Purity, 13-Action Quick Add, 10 End-to-End User Journey Tests, and Readiness Checklist).
- [Competitive Benchmark & Final Design Freeze](file:///c:/Users/prasa/OneDrive/Desktop/projectP/docs/shivarivel_competitive_benchmark_and_design_freeze.md) (Covers Comparative Analysis of Houzz Pro, Procore, Buildertrend, Fieldwire, Autodesk Build, and Raken; Architectural Studio Synthesis; 4-Pillar Financial Rigor; Field-First Mobile Ergonomics; and Complete 28-Part Design Freeze).

---

## 10. CONCLUSION & IMPLEMENTATION READINESS

This comprehensive specification defines every screen, visual token, layout mode, and interactive workflow required for the **Shivarivel Construction & Interiors** ERP. 

It satisfies:
- **Brand Consistency**: Deep Maroon (`#4A0E0E`), Warm Construction Gold (`#C99A2E`), and Warm Cream (`#F7F5F0`).
- **Responsive Symmetry**: Unified 3-zone desktop shell alongside an optimized mobile shell with bottom navigation and central FAB.
- **Audit & Financial Purity**: Respects all 20 existing Supabase migrations, non-netting wage/advance rules, recorded project cost definitions, and multi-tenant company isolation.
- **Zero Implementation Code**: Exclusively provides UX/UI blueprints, information architecture, and component requirements ready for frontend development.

