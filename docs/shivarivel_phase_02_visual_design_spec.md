# SHIVARIVEL ERP — PHASE 02.1
## DETAILED VISUAL DESIGN SYSTEM & SCREEN-BY-SCREEN UX SPECIFICATION
### FINAL DESIGN FREEZE EDITION

**Product:** Shivarivel Construction & Interiors Simple ERP  
**Document Version:** 2.1 (Design Correction & Final Design Freeze)  
**Status:** FROZEN & APPROVED FOR IMPLEMENTATION (Phase 03 Ready)  
**Audience:** Frontend Engineers, Product Designers, QA Engineers  
**Core Design Philosophy:** *"Simple for the User, Logical Underneath"*

---

## 1. DESIGN PRINCIPLES & GOVERNING PHILOSOPHY

### 1.1 The Single-User Reality (The Construction Owner)
Shivarivel ERP is engineered for exactly one human user: the business owner (and designated office assistant). There are **no roles, no permission matrices, no supervisor logins, no worker logins, and no hierarchical approval queues**. 

The owner uses this system in two physical contexts:
1. **At the desk / laptop:** Fast evening data entry, review of supplier outstandings, verifying weekly wage totals.
2. **On-site via mobile phone:** In bright daylight, high dust, standing on unfinished concrete, one-thumb operation, logging materials received or checking pending payments.

### 1.2 "Simple for the User, Logical Underneath"
- **Zero ERP Jargon:** We never expose "General Ledger", "Chart of Accounts", "Muster Roll", "Cost Center", "Depreciation", "Purchase Order Lifecycle", or "Multi-currency Exchange".
- **True Free-Text Inputs (No Masters, No Autocomplete Pickers):** When entering materials or suppliers, the user types the Supplier / Company and Product / Material freely into plain text inputs. There is **NO supplier dropdown, NO material dropdown, NO autocomplete supplier list, NO autocomplete material list, NO recently used supplier picker, and NO recently used material picker**. The user never maintains master data. The backend may internally resolve or insert supplier/material records for relational data integrity, but from the user's perspective, they are simply typing words into normal text fields.
- **Immediate Accounting (No Reconciliation Hurdles):** An amount entered into a wage record is an amount already paid from cash on site. An amount entered as procurement paid is actual cash/UPI disbursed. Pending balance is an instantaneous math calculation: `Total Value - Amount Paid`.
- **Single Source of Truth for Workflows:** 
  - **Wages** are recorded and edited exclusively in **Wages**. Projects *read* wage totals, but never host a duplicate entry form.
  - **Procurement** entries can be linked to a project or marked as general site overhead.

### 1.3 Design Tone & Aesthetic Identity
- **Purpose-Built Construction Precision:** Tactile, sturdy, and architectural. Not a generic SaaS dashboard or colourful toy.
- **Warm Architectural Palette:** Rooted in regional construction heritage—Chettinad Terracotta Maroon, Teak Brass, and Sandstone Limestone canvas.
- **High Visual Contrast:** Sharp 14.5:1 text-to-canvas contrast to guarantee legibility under bright Indian sunlight on mobile displays.
- **Information Density:** Clean white cards floating on warm sandstone limestone canvas with crisp 1px structural borders (`#E2DDD5`) and 12px radii. Zero gratuitous shadows, zero nested card mazes, and zero decorative charts.

---

## 2. DESIGN TOKENS & VISUAL FOUNDATIONS

### 2.1 Color System Architecture

| Token Name | Hex Code | Purpose & Semantic Role | Contrast Ratio against #FFFFFF / #F7F5F0 |
| :--- | :--- | :--- | :--- |
| `color-primary` | `#4A0E0E` | **Chettinad Maroon**: Top navigation brand bar, primary action buttons, active sidebar indicators, table headers. | 11.2:1 (on #FFFFFF), 10.4:1 (on #F7F5F0) |
| `color-primary-hover` | `#380A0A` | Hover state for primary buttons and active list items. | 13.8:1 |
| `color-primary-light` | `#F7EFEF` | Subtle tint for active table rows, selected segmented items, and focus rings. | N/A (Background tint) |
| `color-accent` | `#C99A2E` | **Teak Brass**: Attention accents, active date highlights, secondary CTA accents. | 3.2:1 (Requires dark text `#242424` when used as surface) |
| `color-accent-hover` | `#B38722` | Hover state for brass accents and interactive badges. | 3.8:1 |
| `color-accent-light` | `#FDF9EE` | Background tint for pending balance notices. | N/A (Background tint) |
| `color-canvas` | `#F7F5F0` | **Sandstone Limestone Canvas**: Full-page background. Soft, glare-reducing, natural stone feel. | N/A (Root page canvas) |
| `color-surface` | `#FFFFFF` | **Pure White Surface**: Cards, modal dialogs, drawers, data tables. | N/A (Elevated surface) |
| `color-surface-subtle`| `#F3EFEA` | Secondary surfaces, table alternating rows, disabled inputs. | N/A (Muted container) |
| `color-border` | `#E2DDD5` | **Hairline Structural Border**: Standard 1px divider between sections, cards, and input borders. | 1.8:1 against canvas (WCAG Non-text UI) |
| `color-border-focus` | `#4A0E0E` | High-contrast 2px focus ring for active inputs, accessible keyboard navigation. | 10.4:1 |
| `color-text-main` | `#242424` | **Deep Charcoal**: Body copy, primary labels, table text, currency integers. Never pure `#000000`. | 14.5:1 (Exceeds WCAG AAA) |
| `color-text-muted` | `#6B6B6B` | **Mid Charcoal**: Helper labels, subtitles, timestamps, placeholder text, secondary metadata. | 4.8:1 (Exceeds WCAG AA) |
| `color-text-inverse` | `#FFFFFF` | Text on Primary Maroon or Dark Slate buttons. | 11.2:1 |
| `color-success-text` | `#166534` | **Restrained Green Text**: Full Day indicator, Nil pending balance. | 6.5:1 |
| `color-success-bg` | `#F0FDF4` | Very subtle soft green background tint for Full Day selection. | N/A |
| `color-warning-text` | `#854D0E` | **Restrained Amber Text**: Half Day indicator, pending balance indicator. | 5.4:1 |
| `color-warning-bg` | `#FEFCE8` | Very subtle soft amber background tint for Half Day selection. | N/A |
| `color-danger-text` | `#991B1B` | **Restrained Red Text**: Absent indicator, destructive confirmations. | 7.1:1 |
| `color-danger-bg` | `#FEF2F2` | Very subtle soft red background tint for Absent selection. | N/A |

> **Design Note on Restrained Semantics:** Colors are supporting visual cues only. The interface must **NEVER look like a bright traffic-light dashboard**. Clear selection state, prominent text labels ("Full Day", "Half Day", "Absent"), high contrast, and crisp 1px borders communicate state first; color provides gentle reinforcement.

---

### 2.2 Typography Specification

We employ a dual-typeface typographic engine optimized for enterprise clarity and tabular financial calculations:
- **Display & Headings:** `Plus Jakarta Sans` (Geometric, warm, authoritative, humanist architectural feel).
- **Body & Data:** `Inter` (Micro-legible at small sizes, neutral, clear disambiguation between `0`, `O`, `1`, `l`).
- **Tabular Figures:** All monetary values, quantities, dates, and phone numbers must strictly enforce `font-feature-settings: "tnum" 1` to guarantee vertical column alignment across rows.

| Style Role | Font Family | Weight | Size | Line Height | Letter Spacing | CSS Equivalent |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Page Title (H1)** | Plus Jakarta Sans | 700 (Bold) | 24px (1.5rem) | 32px (2.0rem) | -0.02em | `font-display font-bold text-2xl tracking-tight text-[#242424]` |
| **Section Heading (H2)**| Plus Jakarta Sans | 600 (Semibold)| 18px (1.125rem)| 24px (1.5rem) | -0.01em | `font-display font-semibold text-lg text-[#242424]` |
| **Subsection (H3)** | Plus Jakarta Sans | 600 (Semibold)| 15px (0.9375rem)| 20px (1.25rem)| 0em | `font-display font-semibold text-[15px] text-[#242424]` |
| **Body (Default)** | Inter | 400 (Regular) | 14px (0.875rem)| 20px (1.25rem)| 0em | `font-sans text-sm text-[#242424]` |
| **Body Medium** | Inter | 500 (Medium) | 14px (0.875rem)| 20px (1.25rem)| 0em | `font-sans font-medium text-sm text-[#242424]` |
| **Secondary / Subtext**| Inter | 400 (Regular) | 13px (0.8125rem)| 18px (1.125rem)| +0.01em | `font-sans text-[13px] text-[#6B6B6B]` |
| **Field Labels** | Inter | 600 (Semibold)| 13px (0.8125rem)| 16px (1.0rem) | +0.01em | `font-sans font-semibold text-[13px] text-[#242424]` |
| **Table Data** | Inter | 400 / 500 | 13px (0.8125rem)| 18px (1.125rem)| 0em | `font-sans text-[13px] text-[#242424]` |
| **Operational Big Numbers** | Plus Jakarta Sans | 700 (Bold) | 26px (1.625rem) | 32px (2.0rem) | -0.02em | `font-display font-bold text-[26px] tabular-nums text-[#242424]` |
| **Table Currency** | Inter | 600 (Semibold)| 14px (0.875rem)| 20px (1.25rem)| 0em | `font-sans font-semibold text-sm tabular-nums text-[#242424]` |

---

### 2.3 Spacing Scale & Layout Grid

Built on a strict **4px / 8px incremental scale**:

| Step | Pixel Size | Rem Equivalent | Primary UI Application |
| :--- | :--- | :--- | :--- |
| `space-1` | 4px | 0.25rem | Badge micro padding, icon-to-text gap |
| `space-2` | 8px | 0.5rem | Gap between input and label, button icon gap, segmented control inner padding |
| `space-3` | 12px | 0.75rem | Internal card padding (compact), input horizontal padding, table cell vertical padding |
| `space-4` | 16px | 1.0rem | Standard card internal padding, form field vertical stack gap, modal inner padding |
| `space-5` | 20px | 1.25rem | Section gap within drawers, toolbar button spacing |
| `space-6` | 24px | 1.5rem | Standard page header bottom margin, card-to-card grid gap, modal header padding |
| `space-8` | 32px | 2.0rem | Major page section dividers, top-level layout gap on desktop |
| `space-12`| 48px | 3.0rem | Empty state padding, large screen container margins |

---

### 2.4 Radii & Elevation (Elevation Without Fluff)

- **Border Radii:**
  - `radius-sm` (4px / 0.25rem): Attendance segment pills, small tags.
  - `radius-md` (8px / 0.5rem): Form inputs, select dropdowns, action buttons.
  - `radius-lg` (12px / 0.75rem): Standard cards, modal dialogs, drawers.
- **Elevation Hierarchy:**
  - **Flat Surface (`elevation-0`):** `box-shadow: none; border: 1px solid #E2DDD5`. Used for standard cards, data table wrappers, and form containers. The `#F7F5F0` limestone canvas creates natural physical separation without shadow clutter.
  - **Dropdown & Popover (`elevation-1`):** `box-shadow: 0 4px 14px -2px rgba(36, 36, 36, 0.08)`.
  - **Modal / Bottom Sheet (`elevation-2`):** `box-shadow: 0 16px 36px -4px rgba(36, 36, 36, 0.16)`.

---

## 3. CORE COMPONENT SYSTEM (DETAILED ANATOMY & STATES)

### 3.1 Button Hierarchy

#### 1. Primary Button (`PrimaryButton`)
- **Purpose:** Primary intent per view (e.g., `+ Add Wage Entry`, `+ Create Project`, `Save Purchase`).
- **Anatomy:** Left Icon (18px Lucide) + Label (14px Inter Medium) + Height 42px (Desktop) / 48px (Mobile Touch Target).
- **Styles:** Background `#4A0E0E`, Text `#FFFFFF`, Border None, Radius 8px, Padding: `0 18px`.
- **States:**
  - *Default:* Solid `#4A0E0E`.
  - *Hover:* Background `#380A0A`, transform `translateY(-1px)`.
  - *Active:* Background `#2A0707`, transform `translateY(0)`.
  - *Focus-Visible:* 2px ring `#4A0E0E` with 2px offset `#FFFFFF`.
  - *Disabled:* Background `#E2DDD5`, Text `#99958F`, Cursor `not-allowed`.

#### 2. Secondary Button (`SecondaryButton`)
- **Purpose:** Secondary actions, modal cancel, view toggles.
- **Styles:** Background `#FFFFFF`, Text `#242424`, Border `1px solid #E2DDD5`, Radius 8px, Padding: `0 16px`, Height 42px.
- **States:** Hover background `#F7F5F0`, border `#C99A2E`; Active background `#EDEAE4`.

#### 3. Destructive Action Button (`DestructiveButton`)
- **Purpose:** Deleting an erroneous record (e.g., accidental duplicate wage or purchase).
- **Styles:** Background `#FFFFFF`, Text `#991B1B`, Border `1px solid #FEE2E2`. Hover: Background `#FEF2F2`, Border `#F87171`.

---

### 3.2 Form Controls & Input System

#### 1. Standard Free-Text Input (`TextInput`)
- **Height:** 42px on desktop; 48px on mobile for comfortable touch targets.
- **Padding:** 0 14px.
- **Typography:** 14px Inter Regular, Text `#242424`, Placeholder `#99958F`.
- **Border:** 1px solid `#E2DDD5`, Radius 8px, Background `#FFFFFF`.
- **Focus State:** Border 1px solid `#4A0E0E`, Box Shadow `0 0 0 3px rgba(74, 14, 14, 0.12)`.
- **Usage Rule:** Used for Supplier / Company and Product / Material. **Pure, unadorned free text**. No autocomplete popovers, no master pickers, no category selectors.

#### 2. Phone Input (`PhoneInput`)
- Standard text input optimized for phone numbers (`type="tel"`).
- Normal text formatting. Does NOT trigger a communication suite or call logger.

#### 3. Currency Input (`CurrencyInput`)
- **Prefix:** Fixed left container with non-editable `₹` currency symbol (`#6B6B6B`, font-bold, background `#F7F5F0`, 1px border right).
- **Text:** 15px font-semibold, `tabular-nums`.
- **Behavior:** Accepts numeric input and formats with standard Indian grouping commas upon blur.

#### 4. Attendance 3-State Segmented Control (`AttendanceControl`)
The critical touch control for recording daily labor attendance:
- **Container:** Height 40px (Desktop) / 46px (Mobile), Background `#F3EFEA`, 1px border `#E2DDD5`, radius 8px, padding 3px, display flex.
- **Design Philosophy:** Restrained, non-garish semantic cues. Text label is primary.
- **3 Segments:**
  1. **Full Day:** 
     - Active: Background `#FFFFFF`, Text `#166534`, Border `1px solid #86EFAC`, Font 13px font-semibold.
     - Inactive: Text `#6B6B6B`, Background transparent.
  2. **Half Day:** 
     - Active: Background `#FFFFFF`, Text `#854D0E`, Border `1px solid #FDE047`, Font 13px font-semibold.
     - Inactive: Text `#6B6B6B`, Background transparent.
  3. **Absent:** 
     - Active: Background `#FFFFFF`, Text `#991B1B`, Border `1px solid #FCA5A5`, Font 13px font-semibold.
     - Inactive: Text `#6B6B6B`, Background transparent.
- **Interaction:** One tap to toggle. Immediate, tactile feedback.

---

### 3.3 Summary Values (Restrained Operational Totals)

> **STRICT RULE ON SUMMARY CARDS:** Summary values are allowed **ONLY where they directly support an explicitly required workflow**:
> 1. **General Procurement:** Total Purchased, Total Paid, Outstanding.
> 2. **Project Procurement:** Total Procurement, Total Paid, Balance.
> 3. **Daily Wages:** Today's Wages Paid.
> 4. **Weekly Wages:** Weekly Total.
>
> Summary values / KPI banners are **STRICTLY PROHIBITED** from:
> - Customers
> - Laborers
> - Navigation shell
> - Generic home dashboard
> - Unnecessary project analytics or charts

#### Operational Summary Block Structure
- **Container:** Pure white `#FFFFFF`, 1px border `#E2DDD5`, radius 12px, padding `14px 18px`.
- **Typography:**
  - Label: 12px font-medium text `#6B6B6B` (e.g., "Today's Wages Paid", "Total Purchased", "Balance to Pay").
  - Value: 24px / 26px font-bold `Plus Jakarta Sans`, tabular figures `#242424`.
- **No decorative charts, no progress meters, no percentage dials.**

---

## 4. APPLICATION SHELL ARCHITECTURE

### 4.1 Desktop Shell Layout (>= 1024px)
The desktop shell maintains a clean, fixed-navigation left rail and an unobstructed, glare-free main stage:
- **Left Sidebar Rail:**
  - **Width:** 240px fixed.
  - **Background:** Pure White `#FFFFFF`, border-right `1px solid #E2DDD5`.
  - **Brand Header (Top 72px):**
    - Shivarivel Monogram / Seal (Maroon square with brass accent `S`).
    - Title: "SHIVARIVEL" (15px font-bold tracking-tight `#4A0E0E`).
    - Subtitle: "CONSTRUCTION & INTERIORS" (10px font-semibold tracking-wider `#C99A2E`).
  - **Navigation Menu (Strictly The Core Four):**
    1. **Customers** (Lucide icon: `Users`) -> `/customers`
    2. **Projects** (Lucide icon: `Building2`) -> `/projects`
    3. **Wages** (Lucide icon: `Banknote`) -> `/wages`
    4. **Procurement** (Lucide icon: `Truck`) -> `/procurement`
  - **Active State Indicator:**
    - Background `#F7EFEF` (Subtle maroon tint).
    - Left indicator bar: 4px solid `#4A0E0E`.
    - Text: 14px font-semibold `#4A0E0E`.
    - Icon: Tinted `#4A0E0E`.
  - **Hover State:** Background `#F7F5F0`, text `#242424`.
  - **Sidebar Footer:**
    - Current Session: "Owner" with quick sign-out.
- **Main Stage Content Area:**
  - Background: `#F7F5F0` (Sandstone Limestone Canvas).
  - Margin Left: 240px.
  - Padding: `28px 36px` (Max container width 1280px).

```
+---------------------------------------------------------------------------------------+
|  SIDEBAR (240px)   |  TOP BAR / PAGE HEADER (Limestone Canvas #F7F5F0)                 |
|  [Logo] SHIVARIVEL |  [Page Title: Wages]               [ < Prev Date | Date | Next > ] |
|  Construction      |-------------------------------------------------------------------|
|                    |  [Daily] [Weekly]                                 [+ Add Entry]   |
|  - Customers       |-------------------------------------------------------------------|
|  - Projects        |  Today's Wages Paid: Rs 4,800                                     |
|  * Wages (Active)  |-------------------------------------------------------------------|
|  - Procurement     |  [ DAILY MUSTER SHEET TABLE                                     ] |
|                    |  | Laborer | Project | Attendance | Amount Paid | Action |        |
|                    |  |---------+---------+------------+-------------+--------|        |
|  [Owner]           |  | Murugan | Arun Res| [Full|Half]| Rs  900     | [Edit] |        |
+---------------------------------------------------------------------------------------+
```

---

### 4.2 Mobile Shell Architecture (< 768px)
Designed specifically for one-handed operation on active construction job sites:
- **Top Mobile Header (54px fixed):**
  - Background `#FFFFFF`, border-bottom `1px solid #E2DDD5`.
  - Left: Back button (if inside a detail view) OR Compact Brand Logo ("SHIVARIVEL").
  - Center: Current Module Title (16px font-bold `#242424`).
- **Bottom Navigation Bar (64px fixed + safe area padding):**
  - Background `#FFFFFF`, border-top `1px solid #E2DDD5`, shadow `0 -2px 8px rgba(0,0,0,0.04)`.
  - Height 64px, thumb-reachable.
  - 4 Touch Targets (Min height 48px each):
    1. **Customers** (Icon 20px + Label 10px)
    2. **Projects** (Icon 20px + Label 10px)
    3. **Wages** (Icon 20px + Label 10px)
    4. **Procurement** (Icon 20px + Label 10px)
  - Active Tab: Text and icon tinted `#4A0E0E` with subtle brass `#C99A2E` 2px top indicator.
- **Page Container:**
  - Padding: `16px 16px 84px 16px` (ample bottom clearance over the bottom bar).

---

## 5. CUSTOMERS — SCREEN SPECIFICATION

### 5.1 Customer List View (`/customers`)
The primary customer experience is simple and direct: **View customers, Add customer, Open customer, Edit customer**.

- **Header:**
  - Page Title: `Customers` (H1, 24px font-bold).
  - Subtitle: "Client contacts and associated sites."
  - Primary Action Button: `[ + Add Customer ]` (`PrimaryButton`).
- **Search (Lightweight & Secondary):**
  - A small, unobtrusive search input placed above or beside the list: `[ Search by name or phone... ]`.
  - Visually secondary (neutral border `#E2DDD5`, 38px height).
  - **No advanced filters, no complex search controls, no tag queries.**
- **Customer List / Table (Desktop & Mobile):**
  - Columns / Card Data:
    1. **Customer Name:** 14px font-semibold `#242424`.
    2. **Phone Number:** 13px `tabular-nums` `#242424`. Rendered as a natural, clickable link (`<a href="tel:...">`). **No dedicated "Call Customer" buttons, no call logs, no WhatsApp suites.**
    3. **Location:** 13px text `#6B6B6B` (e.g., "Saibaba Colony, Coimbatore").
    4. **Associated Projects (Subtle):** e.g., "2 projects" in quiet 12px secondary text `#6B6B6B`. **Not a KPI card, not a dashboard badge, not a visual focus.** Customer identity is primary.
    5. **Actions:** `[ Edit ]` button or direct row tap to view details.

### 5.2 Add / Edit Customer Modal
- **Format:** Centered 460px Modal (Desktop) / Bottom Sheet (Mobile).
- **Form Fields (Strictly 3 Fields Only):**
  1. `Customer Name *`: Text input, autofocus, placeholder: "e.g. Arun Kumar".
  2. `Phone Number`: Standard phone input, placeholder: "98765 43210".
  3. `Location`: Text input, placeholder: "e.g. Saibaba Colony, Coimbatore".
- **Actions:** `[ Cancel ]` and `[ Save Customer ]`.

### 5.3 Customer Detail View (`/customers/:id`)
- **Header:** Customer Name (H1), Phone (natural link), Location. `[ Edit ]` button.
- **Associated Projects Section:**
  - Section Heading: `Associated Projects` (H2).
  - List of projects belonging to this customer (Project Name, Location).
  - Tapping a project navigates directly to `/projects/:id`.
  - If no projects exist: *"No projects for this customer yet."* with button `[ + Create Project for Customer ]`.

---

## 6. PROJECTS — SCREEN SPECIFICATION

### 6.1 Project List View (`/projects`)
Projects are presented as calm, operational cards. **No progress bars, no KPI meters, no charts, and no percentages.**

- **Header:**
  - Page Title: `Projects` (H1).
  - Primary Action Button: `[ + Create Project ]` (`PrimaryButton`).
- **Project Card Structure (Desktop Grid & Mobile Stack):**
  - White surface `#FFFFFF`, 1px border `#E2DDD5`, radius 12px, padding `18px 20px`.
  - **Project Name:** 18px font-bold `Plus Jakarta Sans` `#242424` (e.g., "Arun Kumar Residence").
  - **Client Name:** 13px text `#6B6B6B` (e.g., "Client: Arun Kumar").
  - Divider: 1px hairline `#E2DDD5`.
  - **Operational Procurement Overview (Simple Numbers):**
    ```
    Procurement
    Total Purchased: ₹1,45,000  •  Paid: ₹1,10,000  •  Balance: ₹35,000
    ```
  - Card Action: `[ Open Project -> ]`.

### 6.2 Create Project Modal
- **Rule:** Strictly **Two Fields Only**.
- **Fields:**
  1. `Project Name *`: Text input, autofocus, placeholder: "e.g. Arun Kumar Residence".
  2. `Client *`: Searchable Select dropdown of existing customers + inline option `[ + Add New Client ]` if client is not in list.
- **Explicitly Forbidden Fields:** No project codes, no contract values, no start dates, no end dates, no supervisor, no manager, no status, no milestones, no progress bars, no budget, no estimate, no priority, no description.
- **Actions:** `[ Cancel ]` and `[ Create Project ]`.

### 6.3 Project Detail View (`/projects/:id`)
A focused operational project overview consisting of three clean sections:

```
+---------------------------------------------------------------------------------------+
|  <- Back to Projects                                                  [ Edit Project ] |
|  ARUN KUMAR RESIDENCE                                                                 |
|  Client: Arun Kumar | Location: Saibaba Colony, Coimbatore                            |
+---------------------------------------------------------------------------------------+
|  PROJECT PROCUREMENT                                                 [+ Add Purchase] |
|  Total Procurement: Rs 1,45,000  |  Paid: Rs 1,10,000  |  Balance to Pay: Rs 35,000    |
|                                                                                       |
|  Date       | Material / Item       | Supplier      | Total    | Paid     | Balance   |
|  02/10/2026 | Cement 50 Bags        | Murugan Blue  | Rs 19,000| Rs 19,000| Rs 0      |
|  03/10/2026 | Steel 2 Tons          | Premier Steel | Rs 98,000| Rs 50,000| Rs 48,000 |
+---------------------------------------------------------------------------------------+
|  PROJECT WAGES SUMMARY (Read-Only)                                                    |
|  Total Wages Disbursed on Site: Rs 84,500                                             |
|  [ View in Wages -> ] (Opens Wages filtered by this project)                          |
+---------------------------------------------------------------------------------------+
```

1. **Header Block:** Project Name, Client Name, and Edit action.
2. **Project Procurement Section:** 3 operational summary numbers + purchase ledger + `[ + Add Purchase ]`.
3. **Project Wages Section (Strictly Read-Only):**
   - Shows cumulative wages disbursed on this site.
   - **NO wage-entry form inside Projects.**
   - Includes a direct link to the Wages module: `[ View in Wages -> ]`.

---

## 7. WAGES — PRIMARY DESIGN FOCUS & DAILY WORKFLOW

### 7.1 Single Source of Truth Rule
There is **ONE AND ONLY ONE place for creating and editing wage entries**: **Wages → Daily**. Projects only display read-only project-related wage totals. Users never have two different ways to create the same wage record.

---

### 7.2 Date Navigation System (`DateNavigator`)
The date navigator sits prominently at the top of the Wages module:

```
[ < Yesterday ]    [ Calendar Icon ]  Monday, 05 October 2026  (Today)    [ Tomorrow > ]
```

- **Anatomy:**
  - `< Yesterday` Button: Navigates back by 1 day.
  - **Date Selector (Center):** 
    - Text: `Day, DD MMMM YYYY` (e.g., "Monday, 05 October 2026").
    - Highlighted in Teak Brass `#C99A2E` when viewing today's date.
    - Click Behavior: Native datepicker popover to jump to any past date.
  - `Tomorrow >` Button: Navigates forward by 1 day.
- **Mental Model:** "This is the wage sheet for this date."

---

### 7.3 Daily Wages Screen Structure

```
+-------------------------------------------------------------------------------------------------+
|  WAGES                                                                [ Laborers Directory ]    |
|  [ DAILY (Active) ]   [ WEEKLY ]                                                                |
+-------------------------------------------------------------------------------------------------+
|  [ < Yesterday ]         [Calendar] Monday, 05 October 2026 (Today)             [ Tomorrow > ] |
+-------------------------------------------------------------------------------------------------+
|  Today's Wages Paid: Rs 3,450                                                                   |
+-------------------------------------------------------------------------------------------------+
|  DAILY MUSTER SHEET                                                       [ + Add Laborer Row ] |
|                                                                                                 |
|  Laborer Name    | Project / Site          | Attendance Status    | Amount Paid (Rs) | Actions  |
|  ----------------+-------------------------+----------------------+------------------+----------|
|  Murugan (L-101) | Arun Kumar Residence v  | [ Full* | Half | Abs]| [ 900          ] | [Remove] |
|  Ravi K. (L-102) | Arun Kumar Residence v  | [ Full | Half* | Abs]| [ 450          ] | [Remove] |
|  Suresh (L-104)  | Kumar Villa v           | [ Full* | Half | Abs]| [ 850          ] | [Remove] |
|  Velu (L-105)    | Kumar Villa v           | [ Full* | Half | Abs]| [ 850          ] | [Remove] |
|  Mani (L-108)    | -- None --              | [ Full | Half | Abs*]| [ 0            ] | [Remove] |
+-------------------------------------------------------------------------------------------------+
|  [ Saved ]                                                      [ + Add Another Laborer ]       |
+-------------------------------------------------------------------------------------------------+
```

#### Fields & Interaction per Row:
1. **Laborer Name:** Displayed with internal Labor ID (`L-101`). If adding a row, select from registered laborers.
2. **Project / Site:** Dropdown listing active projects.
3. **Attendance Status (Restrained 3-Segment Pill):**
   - `Full Day`: Selected state with subtle green text (`#166534`) and crisp 1px border.
   - `Half Day`: Selected state with subtle amber text (`#854D0E`) and crisp 1px border.
   - `Absent`: Selected state with subtle red text (`#991B1B`). Amount paid automatically zeroes.
4. **Amount Paid (₹):** Numeric input. **Amount entered = already paid**. No payroll calculation, no default wage lookup, no hourly formulas.
5. **Actions:** Remove button (with undo toast).

---

### 7.4 Multi-Laborer Entry UX (Option B: Daily Muster Rows)
- **Why Chosen:** The owner logs 5 to 20 laborers at the end of the day. A modal-per-laborer requires 40+ clicks and constant context switches. Daily muster rows allow the owner to scan all workers on one screen, select sites, tap attendance, and type cash amounts in under 45 seconds.
- **Mobile Stacked Cards (< 768px):** On mobile, each laborer row becomes a comfortable touch card with 46px attendance buttons, large numeric amount input, and sticky bottom total (`Today's Wages Paid: ₹3,450`).
- **Inline Editing:** To correct yesterday's wage, the owner taps `< Yesterday`, changes the amount or attendance directly on the row, and it saves instantly. No administrative edit screen required.

---

## 8. WEEKLY WAGES — SCREEN SPECIFICATION

### 8.1 Location & Navigation
Weekly Wages is **not** a primary navigation item. It lives inside **Wages** via the top view switcher: `[ Daily ] [ Weekly ]`.

### 8.2 Structure & Information
- **Week Selector:** `[ < Prev Week ]` **05 Oct – 11 Oct 2026 (Week 41)** `[ Next Week > ]`.
- **Operational Summary:** `Weekly Total: ₹32,800`.
- **Laborer Weekly Ledger:**
  - Laborer Name & ID
  - Full Days count
  - Half Days count
  - Absent Days count
  - Projects worked on
  - Total wages paid to this laborer
  - Day-by-day cash breakdown (Mon through Sun)
- **Design Tone:** Clear, operational, scannable at a glance. **Not an accounting report.**

---

## 9. LABORER MANAGEMENT

### 9.1 Context & Placement
Laborers are registered once with minimal effort. There is **NO separate primary navigation module called "Employees" or "Staff"**.
- **Access Point:** Clean button in the Wages header: `[ Laborers Directory ]`.
- **Format:** Slide-out drawer (Desktop, 440px) / Full-screen view (Mobile).

### 9.2 Laborer Registration Form
- **Fields (Strictly 2 Fields Only):**
  1. `Laborer Name *`: Text input, placeholder: "e.g. Murugan S.".
  2. `Phone Number`: Phone input, placeholder: "98421 11223".
- **Internal Labor ID:** Automatically assigned by the system (`L-101`, `L-102`). The user never types or manages IDs.
- **Explicitly Forbidden Fields:** No salary, no designation, no department, no trade, no joining date, no address, no working hours, no overtime rates, no leave balance, no payroll settings.

---

## 10. PROCUREMENT SPECIFICATION

Procurement is divided into three clear operational views:
1. **Project Purchases:** Purchases tied to a specific project.
2. **General Purchases:** Purchases for general stock, tool maintenance, or office overhead (`project_id = NULL`).
3. **Supplier Summary:** Derived balance ledger of suppliers.

```
+---------------------------------------------------------------------------------------+
|  PROCUREMENT                                                                          |
|  [ PROJECT PURCHASES (Active) ]   [ GENERAL PURCHASES ]   [ SUPPLIER SUMMARY ]         |
+---------------------------------------------------------------------------------------+
|  Total Purchased: Rs 14,80,000   |   Total Paid: Rs 11,20,000   |   Outstanding: Rs 3,60,000
+---------------------------------------------------------------------------------------+
|  PURCHASES LIST                                                     [ + Add Purchase ]|
|  Date     | Item / Material | Supplier   | Project    | Total    | Paid     | Balance   |
|  ---------+-----------------+------------+------------+----------+----------+-----------|
|  05/10/26 | Cement 100 Bags | Murugan B. | Arun Res.  | Rs 38,000| Rs 38,000| Rs      0 |
|  04/10/26 | Teak Wood Beams | Royal Wood | Arun Res.  | Rs 85,000| Rs 40,000| Rs 45,000 |
+---------------------------------------------------------------------------------------+
```

---

### 10.1 Purchase Form (Strictly True Free-Text)
The purchase entry form enforces **pure free-text entry** for Material and Supplier.

| Field Name | Type | UI Behavior | Placeholder / Example |
| :--- | :--- | :--- | :--- |
| **Project** | Dropdown | Select active project OR select "None (General Purchase)" | Select Project |
| **Product / Material \*** | Standard Text Input | **True free text**. Plain text input. **No dropdown, no autocomplete list, no picker, no master setup.** | e.g. Ultratech Cement 53 Grade |
| **Supplier / Company \*** | Standard Text Input | **True free text**. Plain text input. **No dropdown, no autocomplete list, no picker, no master setup.** | e.g. Murugan Blue Metals |
| **Quantity & Unit** | Dual Input | Number + Unit input or standard unit selector (`Bags`, `Tons`, `Sq.Ft`, `Loads`, `Nos`, `Liters`) | `100` `Bags` |
| **Total Value (₹) \*** | Currency Input | Numeric total bill amount | `₹ 38,000` |
| **Amount Paid (₹) \*** | Currency Input | Cash/UPI paid right now. Defaults to Total Value, editable | `₹ 38,000` |
| **Balance (₹)** | Read-Only Calculated | Automatically computes: `Total Value - Amount Paid`. | `₹ 0` (Auto) |

> **Implementation Note on Free-Text Integrity:** The backend may automatically check if a supplier or material record exists and link or create it behind the scenes for database integrity. However, the user must **never feel they are maintaining master data**.

---

### 10.2 General Procurement View
- Identical purchase structure as Project Purchases, but without a Project selection (`project_id = NULL`).
- Used for site overhead, shared tools, generator fuel, or central stock.
- Top Summary: `Total Purchased`, `Total Paid`, `Outstanding`.

---

### 10.3 Supplier Summary View
The Supplier Summary is a **derived transaction ledger**, NOT a supplier management module.
- **Structure:**
  - `Supplier / Company Name`
  - `Total Purchased (₹)`
  - `Total Paid (₹)`
  - `Outstanding Balance (₹)`
- **Explicitly Forbidden:** No supplier profiles, no supplier registration, no supplier addresses, no supplier contacts, no supplier categories.
- **Interaction:** Tapping a supplier expands their purchase transaction history and provides an inline `[ + Pay Supplier ]` action to record lump-sum payments against outstanding balances.

---

## 11. RESPONSIVE LAYOUT & BREAKPOINT MATRIX

| Breakpoint Range | Device Class | Navigation Strategy | Table Handling | Forms & Dialogs |
| :--- | :--- | :--- | :--- | :--- |
| **Desktop (>= 1024px)** | Laptop, External Monitor | Fixed 240px Left Sidebar Rail | Full multi-column data tables with sortable headers | Centered 500px modal dialogs |
| **Tablet (768px – 1023px)**| iPad, Tablets | Compact 72px Left Rail (Icons only) | Tables with clean horizontal overflow | 540px centered modal or right drawer |
| **Mobile (< 768px)** | Mobile Smartphones | 64px Bottom Navigation Bar (Thumb zone) | Tables collapse into stacked tactile cards | Bottom sheet drawer with swipe-to-close |

---

## 12. ACCESSIBILITY & SITE ERGONOMICS (WCAG 2.1 AA)

1. **Sunlight Legibility:** The `#242424` Charcoal text on `#FFFFFF` and `#F7F5F0` surfaces provides an exceptional **14.5:1 contrast ratio**, exceeding the WCAG AAA requirement (7:1).
2. **Non-Color Status Redundancy:** Color is never the sole communicator of state:
   - Full Day, Half Day, and Absent are clearly written out in bold typography with distinct selection borders.
3. **Minimum Touch Targets:** Every interactive element on mobile (buttons, segmented controls, row clicks) enforces a minimum target box of **44px x 44px** (48px on primary muster controls).
4. **Keyboard Accessibility:** Fast sequential `Tab` key navigation across the daily wage sheet with `Enter` creating the next row.

---

## 13. MOTION & MICRO-INTERACTIONS

Utilitarian and restrained. **Zero decorative page-load theatrics**:
- **Button Press:** Scale down to `0.98` with `100ms ease-out`.
- **Attendance Segment Toggle:** Immediate 120ms transition.
- **Drawer Slide-In:** 200ms ease-out.
- **Toast Notifications:** Slide up from bottom center, auto-dismiss in 3 seconds.

---

## 14. COMPREHENSIVE EMPTY, LOADING & ERROR STATES

### 14.1 Action-Oriented Empty States
- **Daily Wages (No entries for date):**
  - Text: *"No wage entries for this day."*
  - Action: `[ + Add Wage Entry ]`
- **Projects (No projects created):**
  - Text: *"No projects yet."*
  - Action: `[ + Create Project ]`
- **Procurement (No purchases recorded):**
  - Text: *"No purchases recorded."*
  - Action: `[ + Add Purchase ]`
- **Customers (No customers added):**
  - Text: *"No customers yet."*
  - Action: `[ + Add Customer ]`

### 14.2 Human Error Messages (Zero Backend Jargon)

| Scenario | Technical Trigger | User-Facing Human Message |
| :--- | :--- | :--- |
| Network Disconnected | `FETCH_ERROR / Offline` | "You seem to be offline. Reconnecting..." |
| Wage Save Failure | Supabase RLS / 500 error | "Couldn't save this entry. Please try again." |
| Blank Required Field | Form validation | "Please enter the customer name." |
| Duplicate Laborer Entry | Unique constraint violation | "This laborer is already on today's sheet. You can edit their row directly." |
| Invalid Phone Format | Regex validation | "Please enter a valid 10-digit phone number." |

---

## 15. COMPLETE SCREEN & COMPONENT INVENTORY

| Screen / Component Identifier | Route / Trigger | View Type | Core Purpose |
| :--- | :--- | :--- | :--- |
| `SCR-01`: AppShell | Root `/` | Shell Layout | Sidebar (Desktop) + Bottom Nav (Mobile) + Top Bar |
| `SCR-02`: Customers List | `/customers` | Page View | Directory of clients with lightweight search and natural phone links |
| `SCR-03`: Customer Modal | Trigger: `+ Add Customer` | Modal / Drawer | 3 fields only: `Name *`, `Phone`, `Location` |
| `SCR-04`: Customer Detail | `/customers/:id` | Page View | Customer profile + associated project list |
| `SCR-05`: Projects List | `/projects` | Page View | Calm cards of active sites with simple procurement totals |
| `SCR-06`: Project Create Modal | Trigger: `+ Create Project` | Modal / Drawer | 2 fields only: `Project Name *` and `Client *` |
| `SCR-07`: Project Detail | `/projects/:id` | Page View | Project overview + Procurement ledger + read-only Labor summary |
| `SCR-08`: Daily Wages Sheet | `/wages` (Tab: Daily) | Page View | Core daily muster sheet with date navigator & inline entry |
| `SCR-09`: Weekly Wages View | `/wages` (Tab: Weekly) | Page View | 7-day labor summary table with weekly grand total |
| `SCR-10`: Laborers Directory | Trigger: Wages Header | Slide Drawer | Directory of laborers: Name, Phone, Auto Labor ID (`L-101`) |
| `SCR-11`: Project Procurement | `/procurement` (Tab: Project) | Page View | Filterable material purchase ledger tied to sites |
| `SCR-12`: General Procurement | `/procurement` (Tab: General) | Page View | Purchases for general stock and warehouse overhead |
| `SCR-13`: Supplier Summary | `/procurement` (Tab: Supplier)| Page View | Derived balance ledger: Supplier, Total Bought, Paid, Outstanding |
| `SCR-14`: Purchase Form Modal | Trigger: `+ Add Purchase` | Modal / Drawer | 6-field free-text procurement entry dialog |

---

## 16. STEP-BY-STEP USER JOURNEYS

### Journey 1: Register a New Laborer
1. Owner opens **Wages** (`/wages`).
2. Taps `[ Laborers Directory ]`.
3. Taps `[ + Add Laborer ]`.
4. Types Name ("Kannan") and Phone ("98422 33445").
5. System auto-assigns ID: `L-109`.
6. Taps `[ Save Laborer ]`. Kannan is immediately available in the daily wage sheet.
- *Total Steps:* 4 taps, 2 typed fields. *Duration:* 15 seconds.

### Journey 2: Record 5 Laborers for Today's Wages
1. Owner opens **Wages** at 7:00 PM. Date is automatically Today.
2. For worker 1 (Murugan): Selects "Arun Kumar Residence", clicks `Full Day`, enters `900`.
3. For worker 2 (Ravi): Selects "Arun Kumar Residence", clicks `Half Day`, enters `450`.
4. For workers 3, 4, 5: Selects "Kumar Villa", clicks `Full Day`, enters `850` each.
5. Top total updates in real time: `Today's Wages Paid: ₹3,900`.
6. Taps `[ Save Daily Sheet ]`. Instant toast: "Today's wage sheet saved."
- *Total Steps:* 1 page, zero modal popups. *Duration:* 45 seconds.

### Journey 3: Correct Yesterday's Wage Entry
1. Owner opens **Wages**.
2. Taps `[ < Yesterday ]` on the date navigator.
3. Yesterday's muster sheet loads.
4. Finds Suresh, who was mistakenly marked Full Day (₹850).
5. Taps `Half Day`, changes amount to `450`.
6. Inline save indicator confirms: "Saved".
- *Total Steps:* 3 taps. *Duration:* 10 seconds.

### Journey 4: View One Laborer's Weekly Earnings
1. Owner opens **Wages** and clicks `[ Weekly ]` tab.
2. Selects current week.
3. Locates "Murugan". Sees: `6 Full Days | 0 Half Days | Total Paid: ₹5,400`.
- *Total Steps:* 2 taps. *Duration:* 5 seconds.

### Journey 5: Create a Project
1. Owner opens **Projects** (`/projects`).
2. Clicks `[ + Create Project ]`.
3. Modal opens: Types Project Name ("Lakshmi Illam"), selects Client ("Lakshmi Narayanan").
4. Clicks `[ Create Project ]`.
5. Project card appears immediately on the projects grid.
- *Total Steps:* 3 taps, 1 typed string. *Duration:* 15 seconds.

### Journey 6: Add a Project Purchase
1. Owner opens **Projects** -> Clicks "Lakshmi Illam".
2. In Project Procurement section, clicks `[ + Add Purchase ]`.
3. Modal opens:
   - Product: Types "Cement 53 Grade" (plain text).
   - Supplier: Types "Murugan Blue Metals" (plain text).
   - Quantity / Unit: `50` `Bags`.
   - Total Value: `₹19,000`.
   - Amount Paid: `₹10,000`.
   - Balance computes automatically: `₹9,000`.
4. Clicks `[ Save Purchase ]`.
5. Purchase appears on project ledger; Project Balance updates to `₹9,000`.
- *Total Steps:* 1 modal form, 6 fields. *Duration:* 25 seconds.

### Journey 7: Add a General Purchase (Non-Project)
1. Owner opens **Procurement** -> Clicks `[ General Purchases ]` tab.
2. Clicks `[ + Add Purchase ]`.
3. Project is pre-selected as "None (General Purchase)".
4. Enters Product ("Diesel for Central Generator"), Supplier ("HP Bunk"), Total `₹5,000`, Paid `₹5,000`.
5. Clicks `[ Save Purchase ]`.
- *Total Steps:* 1 modal form. *Duration:* 20 seconds.

### Journey 8: Check Supplier Outstanding Balance
1. Owner opens **Procurement** -> Clicks `[ Supplier Summary ]` tab.
2. Top summary shows: `Outstanding: ₹3,60,000`.
3. Finds "Premier Steel Corp": Total Purchased `₹6,20,000`, Paid `₹4,00,000`, Balance to Pay `₹2,20,000`.
- *Total Steps:* 2 taps. *Duration:* 4 seconds.

### Journey 9: Find a Customer's Project
1. Owner opens **Customers** (`/customers`).
2. Types "Arun" in search bar.
3. Arun Kumar appears with his phone number and associated project "Arun Kumar Residence".
4. Taps project name -> Navigates straight to Project Detail.
- *Total Steps:* 1 search query, 1 tap. *Duration:* 5 seconds.

---

## 17. FINAL SELF-CRITIQUE & AUDIT CHECKLIST

| Self-Audit Question | Verification Result | Implementation Assurance |
| :--- | :--- | :--- |
| **Did we accidentally create a supplier master?** | **NO.** | Supplier is a plain free-text field. There is no supplier creation page, no supplier profile, and no supplier directory. |
| **Did we accidentally create a material master?** | **NO.** | Product/Material is a plain free-text field. There is no material catalog, no category manager, and no inventory master. |
| **Did we accidentally create payroll?** | **NO.** | Wage entry records actual cash disbursed on date. No salary structures, deductions, or hourly math. |
| **Did we create duplicate wage-entry workflows?** | **NO.** | Wages is the sole entry point. Projects only display read-only totals. |
| **Did we add unnecessary KPI cards?** | **NO.** | Summary values exist strictly in 4 required places (General Procurement, Project Procurement, Daily Wages, Weekly Wages). Removed from Customers, Laborers, and Nav. |
| **Did we add unnecessary charts?** | **NO.** | Zero progress bars, zero pie charts, zero graphs. Pure numbers. |
| **Did we add unnecessary navigation?** | **NO.** | Primary navigation is strictly: Customers, Projects, Wages, Procurement. |
| **Can a non-ERP user understand this?** | **YES.** | Words are colloquial construction terms: Customer, Project, Wages, Purchases. |
| **Can multiple laborers be recorded quickly?** | **YES.** | Option B Daily Muster Sheet allows recording 5 workers in under 45 seconds on one screen. |
| **Can the user easily understand project procurement?** | **YES.** | Three clear numbers: Total Procurement, Total Paid, Balance to Pay. |
| **Can the user understand outstanding supplier amounts?** | **YES.** | Supplier Summary derives total purchased, paid, and pending balance automatically. |
| **Is mobile usage practical?** | **YES.** | 64px thumb-accessible bottom nav, 44px+ touch targets, and vertical stacked cards. |

---

## 18. DESIGN FREEZE — APPROVED UX RULES

The following 16 governing rules are **FROZEN** and represent the unalterable blueprint for Phase 03 frontend implementation:

1. **Four Primary Navigation Areas Only:** The user-facing application consists strictly of `Customers`, `Projects`, `Wages`, and `Procurement`. No additional top-level routes.
2. **Supplier and Product Are True Free-Text Inputs:** Inputs for Product / Material and Supplier / Company are plain text inputs. No dropdowns, no autocomplete lists, and no recently used pickers.
3. **No Visible Supplier / Material Master Management:** The user never maintains or sees a supplier directory or material catalog.
4. **Wages Is the Only Wage-Entry Workflow:** All wage entries and edits occur exclusively within `Wages → Daily`.
5. **Weekly Wages Remains Inside Wages:** Accessed via the internal view switcher `[ Daily ] [ Weekly ]`, never as a top-level navigation item.
6. **Projects Do Not Contain a Wage-Entry Form:** Projects may display read-only wage totals and links to Wages, but never host duplicate wage creation forms.
7. **Project Creation Is Only Project Name + Client:** Strictly two fields: `Project Name` and `Client Name`. No dates, codes, status, or budgets.
8. **Laborer Creation Is Only Name + Phone:** Strictly two fields: `Laborer Name` and `Phone Number`. Internal Labor ID is automatically assigned.
9. **Procurement Balance Equals Total Value Minus Amount Paid:** Balance is calculated dynamically: `Total Value - Amount Paid`.
10. **General Procurement Uses `project_id = NULL`:** Purchases without a project represent general site and warehouse overhead.
11. **No Payroll / Advances / Employee Payment Workflow:** Amounts recorded are actual daily cash payments already disbursed.
12. **No Unnecessary KPI Dashboards:** Summary values are restricted strictly to General Procurement, Project Procurement, Daily Wages, and Weekly Wages.
13. **No Unnecessary Charts:** No progress bars, KPI gauges, or graphical charts. Information is conveyed through clean, scannable numbers.
14. **No Unnecessary ERP Modules:** No Estimates, Enquiries, Site Visits, Contracts, Inventory, Finance, or Permissions.
15. **Mobile Usability Is a First-Class Requirement:** All workflows, especially daily wage recording and purchase entry, must be 100% operational on mobile devices with touch targets >= 44px.
16. **Existing Backend / Database Remains Unchanged:** All functionality must be implemented using existing PostgreSQL tables (`customers`, `projects`, `employees`, `attendance`, `daily_wages`, `purchases`, `purchase_items`, `v_supplier_balance`) with **ZERO database migrations**.

---
*End of Phase 02.1 Design Freeze Specification — Approved for Phase 03 Implementation.*
