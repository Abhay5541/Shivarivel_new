# MODULE 06 — PROCUREMENT & SUPPLIER MANAGEMENT DESIGN SPECIFICATION
## Shivarivel Construction & Interiors ERP

---

### Executive Summary & Procurement Philosophy
In civil contracting and architectural interior execution across Tamil Nadu, procurement is the financial lifeblood of ongoing projects. A construction contractor does not manage a modern retail e-commerce inventory with barcodes and automated picking robots. Instead, construction procurement is defined by **site deliveries, bulk dispatch challans, vendor credit terms, multi-purchase payments, and GST tax invoices** for bulk commodities:
- **Civil Commodities**: Coromandel / Zuari / UltraTech 53-grade OPC cement, 500D TMT reinforcement steel bars (8mm–25mm), M-Sand, P-Sand, 20mm blue metal coarse aggregates, and country wire-cut red bricks.
- **Finishing & Interiors**: Saint-Gobain gypsum plasterboards, Greenlam / Merino laminates, Gurjan plywood (IS 710 marine grade), Asian Paints Apex Ultima emulsions, architectural aluminum coves, and profile LED strip tracks.

This specification details the complete frontend UX/UI design for **Module 06: Procurement & Supplier Management**, adhering strictly to:
1. **The Master Design Brief & Established Design Tokens**: Deep Maroon (`#4A0E0E`), Warm Construction Gold (`#C99A2E`), Warm Cream (`#F7F5F0`), Charcoal (`#242424`), Pure White (`#FFFFFF`), and 1px Architectural Stone Borders (`#E2DDD5`).
2. **Rule 18 Non-Netting Standards**: Supplier payables and purchases are kept strictly independent of customer receivables and employee wages. **Zero speculative profit or net margins are displayed**.
3. **Multi-Purchase Allocation Architecture**: Faithful alignment with the core backend design where a single supplier payment voucher disburses funds across multiple outstanding purchase invoices via `supplier_payment_allocations`.
4. **Reference Material Catalog (Anti-Slop Inventory Rule)**: Materials function strictly as a reusable master price/unit reference catalog. **No fabricated warehouse stock balances, reorder min-max alerts, or inventory bin locations** are introduced, respecting the MVP database schema.
5. **Installed Design Skill Standards**: Anthropic Frontend Design (visual hierarchy), UI/UX Pro Max (operational workflows & validation UX), Taste (craft, typography & restraint), Vercel Web Design Guidelines (semantic HTML & responsive implementation), and Impeccable (rigorous anti-slop audit).

---

## 1. SUPPLIERS DIRECTORY (`/suppliers`)

### 1.1 Page Header & Master Controls
- **Page Title**: `Suppliers` (`Plus Jakarta Sans`, 28px desktop / 22px mobile, Bold, `#242424`).
- **Supporting Description**: *"Manage material vendors, procurement invoices, and credit settlement ledgers."* (`Inter`, 14px, Regular, `#6B6B6B`).
- **Primary CTA**: `[+ New Supplier]` (Height: 40px desktop / 44px mobile, background Deep Maroon `#4A0E0E`, text `#FFFFFF`, border `1px solid #380A0A`, hover `#380A0A`, icon `lucide: UserPlus`).
- **Quick Add Compatibility**: Available globally via Header `[+ Quick Add]` and mobile floating action button (FAB).

### 1.2 Supplier Search System
- **Search Scope**: Real-time matching across:
  - Supplier Name (e.g., `Sri Lakshmi Steels`)
  - Primary Contact Person (e.g., `Murugan R.`)
  - Phone Numbers (Primary & Alternate, e.g., `+91 98422 XXXXX`)
  - GSTIN (e.g., `33AAAAA0000A1Z5`)
  - Trade Category (e.g., `Steel & Cement`, `Electrical`, `Plywood & Hardware`)
- **Desktop Search UX**:
  - Width: 320px, height: 40px, rounded-md, `1px solid #E2DDD5`, pure white background `#FFFFFF`.
  - Icon: Leading `lucide: Search` (16px, `#8C8880`).
  - Native placeholder: *"Search suppliers by name, phone, GST, trade..."*
  - **Focused State**: Deep Maroon border (`#4A0E0E`) with `outline: 2px solid rgba(74, 14, 14, 0.15)`.
  - **Clear State**: Trailing cross button (`lucide: X`, 16px, `#6B6B6B`) clears input on click or `Esc` keypress.
- **Mobile Search UX**:
  - Sticky search bar anchored below page title with instant touch clearance ($44\times 44\text{px}$).
- **No-Results State**:
  - In-line card message: *"No suppliers match '{search_query}'. [Clear Search]"*.

### 1.3 Supplier Filters
- **Filter Categories**:
  1. **Trade Category**: `All Categories`, `Steel & TMT`, `Cement & Aggregates`, `Bricks & Blocks`, `Electrical & Plumbing`, `Plywood & Timber`, `Paints & Chemicals`, `Hardware & Glass`.
  2. **Payment Balance**: `All Suppliers`, `Has Outstanding Balance (Payable > 0)`, `Fully Settled`.
  3. **Status**: `Active (Default)`, `Inactive`.
- **Desktop Filter Pattern**:
  - Horizontal pill strip with count badges (`bg-stone-100 text-stone-700` inactive; `bg-[#F9F3E5] text-[#4A0E0E] font-semibold border border-[#C99A2E]` active).
- **Mobile Filter Pattern**:
  - Horizontal swipeable pill rail + dedicated `[Filter]` button with badge count opening a slide-up **Filter Bottom Sheet**.

---

### 1.4 Desktop Suppliers Table
Designed for high data scannability with right-aligned tabular currency numbers (`tnum`) and contextual actions.

```
+-----------------------------------+--------------------+------------------------+----------------+----------------+----------+---------+
| Supplier Name & Company           | Phone & Contact    | Category / Trade       | Total Incurred | Outstanding    | Status   | Actions |
+-----------------------------------+--------------------+------------------------+----------------+----------------+----------+---------+
| Sri Lakshmi Steels                | +91 98421 88771    | Steel & TMT Bars       | ₹18,45,000.00  | ₹3,20,000.00   | [Active] |  [...]  |
| GST: 33AABCS1429B1Z8              | Murugan (Manager)  | 14 Purchases           | Paid: ₹15.25 L | Overdue: 12d   |          |         |
+-----------------------------------+--------------------+------------------------+----------------+----------------+----------+---------+
| Zuari Cements Agency              | +91 94432 11990    | Cement & Aggregates    | ₹8,90,000.00   | ₹84,000.00     | [Active] |  [...]  |
| GST: 33AAACZ9821C1Z4              | Anandh S.          | 8 Purchases            | Paid: ₹8.06 L  | Due in 5d      |          |         |
+-----------------------------------+--------------------+------------------------+----------------+----------------+----------+---------+
| Kovai Blue Metal Sand             | +91 98940 33441    | Aggregates & Sand      | ₹4,20,000.00   | ₹0.00          | [Active] |  [...]  |
| Unregistered / Cash Vendor        | Kumaravel P.       | 6 Purchases            | Paid: ₹4.20 L  | Settled        |          |         |
+-----------------------------------+--------------------+------------------------+----------------+----------------+----------+---------+
```

#### Table Columns & Alignment:
1. **Supplier Name & Company**:
   - Primary: Supplier trade/company name (`Plus Jakarta Sans`, 14px, SemiBold, `#242424`). Clickable link to `/suppliers/:id`.
   - Secondary: GST number or tax badge in muted monospace font (`#8C8880`).
2. **Phone & Contact**:
   - Primary: Formatted phone (`+91 98421 XXXXX`) with WhatsApp click-to-chat link.
   - Secondary: Contact person name and role (`Inter`, 12px, Regular, `#6B6B6B`).
3. **Category / Trade**:
   - Primary trade badge (`px-2 py-0.5 rounded bg-stone-100 text-stone-700 text-xs font-medium`).
   - Purchase count caption (e.g., *"14 Purchases"*).
4. **Total Purchases Incurred**: Right-aligned, `Inter`, 14px, SemiBold, `#242424`, Indian formatted (`₹18,45,000.00`), with secondary paid line (`Paid: ₹15,25,000.00`).
5. **Outstanding Balance**: Right-aligned, `Inter`, 14px, Bold, formatted in Brick Crimson (`#9E2A2B`) when $> ₹0.00$, with aging badge (`Overdue: 12d` or `Due in 5d`). If zero, displayed in neutral stone as `₹0.00 (Settled)`.
6. **Status**: Restrained semantic pill badge (`● Active` with emerald dot; `● Inactive` with slate dot).
7. **Actions**: Contextual row menu `[...]`:
   - `View Supplier Ledger` (`/suppliers/:id`)
   - `+ Record Material Purchase` (Opens purchase drawer with supplier pre-selected)
   - `+ Record Supplier Payment` (Opens payment voucher drawer with supplier pre-selected)
   - `Edit Supplier Details`

---

### 1.5 Mobile Supplier Cards (`< 768px`)
On viewports $< 768\text{px}$, tables are completely replaced by touch-friendly supplier cards.

```
+-----------------------------------------------------------+
| Sri Lakshmi Steels                               [Active] |
| Murugan (Manager) • +91 98421 88771                       |
| Trade: Steel & TMT Bars (14 Purchases)                    |
|-----------------------------------------------------------|
| Total Incurred        | Paid Amount      | Outstanding    |
| ₹18,45,000.00         | ₹15,25,000.00    | ₹3,20,000.00   |
| (14 Invoices)         | Verified Vouchers| [Due: 12 Days] |
|-----------------------------------------------------------|
| [View Ledger & History >]             [+ Record Payment]  |
+-----------------------------------------------------------+
```
- **Touch Target**: Entire upper card navigates to `/suppliers/:id`.
- **Direct Pay CTA**: `[+ Record Payment]` triggers the allocation payment drawer immediately.

---

## 2. NEW SUPPLIER EXPERIENCE (`/suppliers/new` or Slide-Over Drawer)

### 2.1 Form Architecture & Supported Fields
Adheres strictly to the existing ERP database schema without inventing unsupported fields:

```
+---------------------------------------------------------------------------------------+
| REGISTER NEW SUPPLIER / VENDOR                                         [Close / Esc]  |
| Register a commercial material supplier, hardware vendor, or service agency           |
|=======================================================================================|
| SECTION A: VENDOR IDENTITY                                                            |
| Supplier Trade / Business Name * : [ Sri Lakshmi Steels                             ] |
| Contact Person Name              : [ Murugan R.                                     ] |
| Trade Category *                 : [ Steel & TMT Bars                             ▼ ] |
|---------------------------------------------------------------------------------------|
| SECTION B: COMMUNICATION & TAX DETAILS                                                |
| Primary Mobile Number *          : [ +91 98421 88771                                ] |
| Alternate Phone / Landline       : [ 0422 2458900                                   ] |
| GST Identification Number (GSTIN): [ 33AABCS1429B1Z8                                ] |
| State / Business City            : [ Coimbatore, Tamil Nadu                         ] |
|---------------------------------------------------------------------------------------|
| SECTION C: VENDOR NOTES & CREDIT TERMS                                                |
| Credit Terms / Bank Details      : [ 30 days credit from invoice date. NEFT to...   ] |
| Initial Vendor Status            : [ Active (Default)                             ▼ ] |
|=======================================================================================|
| [Discard]                                                        [Save & Add Supplier]|
+---------------------------------------------------------------------------------------+
```

### 2.2 Field Distinction & Validation
- **Required**:
  - `Supplier Business Name`: String (min 3 chars).
  - `Trade Category`: Dropdown selection (Civil, Steel, Cement, Electrical, Plumbing, Interior, Hardware, Other).
  - `Primary Mobile Number`: 10-digit Indian mobile validation (`+91` prefix auto-formatted).
- **Optional**:
  - `Contact Person Name`
  - `Alternate Phone`
  - `GSTIN`: 15-character Indian GST validation regex (`^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$`).
  - `Notes / Credit Terms`
- **Validation UX**:
  - If GSTIN is entered with an invalid format, a soft warning appears: *"Invalid GSTIN format for Tamil Nadu (State Code 33)"*.
  - If mobile number has fewer than 10 digits, input receives Brick Crimson outline (`#9E2A2B`) and error text.
- **Save States**:
  - Normal `[Save & Add Supplier]`.
  - Saving: Button shows spinning loader (`lucide: Loader2`), text changes to *"Creating Vendor Account..."*, form fields locked.
  - Mobile: Sticky bottom bar with safe-area padding.

---

## 3. SUPPLIER DETAIL COMMAND CENTER (`/suppliers/:id`)

Supplier Detail acts as the financial command center for vendor relationships, answering:
*"Who is this supplier, what have we purchased across our sites, and what do we currently owe them?"*

```
+-------------------------------------------------------------------------------------------------------+
| [<- Back to Suppliers]       SUP-0012                             [● Active]   [+ Record Payment]     |
| Sri Lakshmi Steels                                                             [+ Add Purchase]       |
| Contact: Murugan (Manager) | Phone: +91 98421 88771 | GSTIN: 33AABCS1429B1Z8 | Category: Steel & TMT  |
|=======================================================================================================|
| FINANCIAL SUMMARY (Rule 18 Non-Netted Supplier Ledger)                                                |
| +-----------------------------------+-----------------------------------+-----------------------------+
| | Total Purchases Incurred          | Total Payments Disbursed          | Outstanding Balance Payable |
| | ₹18,45,000.00                     | ₹15,25,000.00                     | ₹3,20,000.00                |
| | 14 Verified Purchase Invoices     | 6 Verified Bank Allocations       | Current Credit Liability    |
| +-----------------------------------+-----------------------------------+-----------------------------+
|                                                                                                       |
| [ Overview ]        [ Purchases (14) ]        [ Payments (6) ]        [ Notes & Bank Details ]        |
|=======================================================================================================|
|                                                                                                       |
| [Active Tab Content Renders Below with Zero Page Refresh]                                             |
+-------------------------------------------------------------------------------------------------------+
```

### 3.1 Supplier Financial Ledger Header
- **Breadcrumb**: `Suppliers / Sri Lakshmi Steels`.
- **Top Metrics**:
  - `Total Purchases Incurred`: Cumulative sum of all purchase invoice line items (`₹18,45,000.00`).
  - `Total Payments Disbursed`: Cumulative sum of verified allocations to this supplier (`₹15,25,000.00`).
  - `Outstanding Balance Payable`: Explicit difference (`₹3,20,000.00`). Highlighted in Brick Crimson `#9E2A2B` when $> 0$.
- **Audit Tooltip**: *"Supplier balances reflect verified purchase invoices minus disbursed bank allocations. Customer balances are strictly separated."*

### 3.2 Supplier Detail Tabs
1. **Overview**: Executive contact card, active projects supplied, payment aging breakdown (0–30 days, 31–60 days, 60+ days), and bank NEFT details.
2. **Purchases (14)**: Table of every material invoice with date, project name, invoice reference, gross amount, and payment status (`Paid`, `Unpaid`, `Partial`).
3. **Payments (6)**: Chronological list of payment vouchers disbursed to this supplier with payment date, mode (NEFT/Cheque/Cash), total amount, and allocation breakdown across invoices.
4. **Notes & Bank Details**: Account number, IFSC code, branch, credit period, and operational notes.

---

## 4. MATERIALS REFERENCE CATALOG (`/materials`)

### 4.1 Construction Catalog Mandate (No Warehouse Inventory)
In strict accordance with `PRODUCT_SPEC.md` and `DATABASE_RULES.md`:
- **What Materials Are**: Reusable master catalog records providing standardized descriptions, trade categories, and default units for fast line-item entry in Purchases and Estimates.
- **What Materials Are NOT**: **No warehouse stock levels, no bin numbers, no automated reorder thresholds, and no stock ledger valuation (FIFO/LIFO)**. Construction contractors buy materials directly for site delivery, not for central warehouse shelving.

```
+-------------------------------------------------------------------------------------------------------+
| MATERIALS MASTER CATALOG                                                [ + Add New Material ]        |
| Standardized construction materials, trade categories, and measurement units                          |
|=======================================================================================================|
| Search: [ Search materials by name or category...       ]   Filter: [ All Categories ▼ ]              |
|-------------------------------------------------------------------------------------------------------|
| Material Name & Specification         | Category             | Default Unit   | Status    | Actions   |
|---------------------------------------+----------------------+----------------+-----------+-----------|
| TMT Fe 500D Reinforcement Steel 16mm  | Steel & TMT Bars     | Ton (T)        | Active    | [Edit]    |
| TMT Fe 500D Reinforcement Steel 12mm  | Steel & TMT Bars     | Ton (T)        | Active    | [Edit]    |
| Zuari 53 Grade OPC Cement             | Cement & Aggregates  | Bags (50 kg)   | Active    | [Edit]    |
| UltraTech Super Weather Pro PPC       | Cement & Aggregates  | Bags (50 kg)   | Active    | [Edit]    |
| M-Sand (Manufactured Sand - Plastering| Sand & Blue Metal    | Units (100 cft)| Active    | [Edit]    |
| 20mm Blue Metal Coarse Aggregate      | Sand & Blue Metal    | Units (100 cft)| Active    | [Edit]    |
| Wire Cut Country Red Clay Bricks      | Bricks & Blocks      | Nos (Pieces)   | Active    | [Edit]    |
| Saint-Gobain Gypsum Board 12.5mm      | False Ceiling        | Sq.ft          | Active    | [Edit]    |
| Gurjan BWP Marine Plywood 18mm (IS710)| Interior & Woodwork  | Sq.ft          | Active    | [Edit]    |
+-------------------------------------------------------------------------------------------------------+
```

### 4.2 Material Fields (Supported Only)
- `Material Name`: Clean construction trade name (e.g., *"Zuari 53 Grade OPC Cement"*).
- `Category`: Standardized construction trade (`Steel`, `Cement`, `Aggregates & Sand`, `Masonry`, `Plumbing`, `Electrical`, `Paints`, `False Ceiling`, `Woodwork`).
- `Default Unit`: Supported engineering units:
  - `Bags` (Cement)
  - `Ton` / `Kg` (Steel)
  - `Units` / `cu.ft` (Sand, Aggregates)
  - `Nos` (Bricks, Solid Blocks)
  - `Sq.ft` (Tiles, Plywood, Gypsum Boards)
  - `R.ft` / `Meters` (Pipes, Profile Channels, Cables)
  - `Liters` (Paints, Waterproofing chemicals)
- `Status`: `Active` (available in autocomplete dropdowns) | `Inactive`.

### 4.3 Add / Edit Material Modal
- Simple, ultra-fast 3-field popover:
  1. `Material Name *` (Text input)
  2. `Category *` (Dropdown)
  3. `Default Measurement Unit *` (Dropdown)
- Auto-focuses on name input; `Enter` saves record; `Esc` dismisses.

---

## 5. MATERIAL PURCHASES (`/purchases`)

Purchases represent material orders and vendor invoices delivered directly to project sites or company operations.

### 5.1 Purchases Listing Page
- **Page Title**: `Purchases` (`Plus Jakarta Sans`, 28px bold).
- **Supporting Description**: *"Track material procurement invoices, site delivery challans, and payment statuses."*
- **Primary CTA**: `[+ Add Purchase]` (Deep Maroon `#4A0E0E`).
- **Toolbar & Filter Controls**:
  - Full-text search (Invoice #, Supplier, Project, Material snippet).
  - Date Filter (`This Month`, `Last 30 Days`, `Custom Range`).
  - Supplier Filter Dropdown (`All Suppliers`).
  - Project Filter Dropdown (`All Projects`).
  - Payment Status Pills: `All (42)`, `Unpaid (18)`, `Partially Paid (6)`, `Paid (18)`.

### 5.2 Desktop Purchases Table
```
+--------------+------------+-----------------------+-----------------------------+---------------+---------------+----------+---------+
| Purchase Ref | Date       | Supplier              | Project / Site Destination  | Total Amount  | Outstanding   | Status   | Actions |
+--------------+------------+-----------------------+-----------------------------+---------------+---------------+----------+---------+
| PUR-2026-081 | 01/10/2026 | Sri Lakshmi Steels    | PRJ-2026-004: Senthil Nathan| ₹2,45,000.00  | ₹0.00         | [Paid]   |  [...]  |
| Inv: 4182    | Due: 31 Oct| GST: 33AABCS1429B1Z8  | Kovaipudur, Coimbatore      | (TMT Bars 3.5T| Settled       |          |         |
+--------------+------------+-----------------------+-----------------------------+---------------+---------------+----------+---------+
| PUR-2026-074 | 28/09/2026 | Zuari Cements Agency  | PRJ-2026-004: Senthil Nathan| ₹84,000.00    | ₹84,000.00    | [Unpaid] |  [...]  |
| Inv: 9821    | Due: 15 Oct| GST: 33AAACZ9821C1Z4  | Kovaipudur, Coimbatore      | (200 Bags OPC)| Due in 14d    |          |         |
+--------------+------------+-----------------------+-----------------------------+---------------+---------------+----------+---------+
| PUR-2026-069 | 26/09/2026 | Kovai Blue Metal Sand | PRJ-2026-002: Priya Res.    | ₹38,500.00    | ₹18,500.00    | [Partial]|  [...]  |
| Challan: 104 | Due: 10 Oct| Cash Vendor           | RS Puram, Coimbatore        | (M-Sand 2 Unt)| Due in 9d     |          |         |
+--------------+------------+-----------------------+-----------------------------+---------------+---------------+----------+---------+
```

#### Financial Formatting & Semantic Alignment:
- **Total Amount**: Right-aligned, `Inter` (tabular numbers), 14px, Bold `#242424`, Indian formatted (`₹2,45,000.00`).
- **Outstanding**: Right-aligned, Brick Crimson (`#9E2A2B`) when unpaid; neutral stone `#6B6B6B` when settled.
- **Payment Status Badges**:
  - `Paid`: Solid emerald dot + `#EAF5EE` background + `#1E6B37` text.
  - `Unpaid`: Solid crimson dot + `#FCEEEE` background + `#9E2A2B` text.
  - `Partially Paid`: Solid amber dot + `#FEF5E7` background + `#B86E00` text.
- **Project Destination**: Shows project reference (`PRJ-2026-004`) with link to Project Command Center.

---

### 5.3 Mobile Purchase Cards (`< 768px`)
```
+-----------------------------------------------------------+
| PUR-2026-074 • Inv: 9821                       [● Unpaid] |
| Zuari Cements Agency                                      |
| Site: PRJ-2026-004 (Senthil Nathan Residence, Kovaipudur) |
| Date: 28/09/2026 (Due: 15/10/2026)                        |
| Materials: Zuari 53 Grade OPC Cement (200 Bags)           |
|-----------------------------------------------------------|
| Total Amount          | Paid             | Balance Due    |
| ₹84,000.00            | ₹0.00            | ₹84,000.00     |
| Net Inclusive         | Verified Bank    | [Due in 14d]   |
|-----------------------------------------------------------|
| [View Purchase Voucher >]               [+ Record Payment]|
+-----------------------------------------------------------+
```

---

## 6. NEW PURCHASE EXPERIENCE (`/purchases/new` or Drawer)

### 6.1 Multi-Section Architecture
Designed for the fast recording of delivery challans and vendor tax invoices:

```
+---------------------------------------------------------------------------------------+
| RECORD MATERIAL PURCHASE                                               [Close / Esc]  |
| Record vendor invoice or site delivery challan against a construction project         |
|=======================================================================================|
| SECTION A: VENDOR & DESTINATION PROJECT                                               |
| Supplier * : [ Select Supplier (e.g. Sri Lakshmi Steels)             ▼ ] [ + New ]    |
| Project *  : [ PRJ-2026-004: Er. Senthil Nathan Residence            ▼ ]              |
|---------------------------------------------------------------------------------------|
| SECTION B: INVOICE IDENTIFICATION & DATES                                             |
| Supplier Invoice / Challan # * : [ INV-4182                                         ] |
| (Duplicate check indicator: [✓] Unique invoice number for this supplier)              |
| Purchase Date *                : [ 01/10/2026 ]       Credit Due Date: [ 31/10/2026 ] |
|---------------------------------------------------------------------------------------|
| SECTION C: ITEMIZED PURCHASE MATERIALS (Bill of Materials)                            |
| +------------------------------------+-----------+--------+-----------+-------------+ |
| | Material Description               | Qty       | Unit   | Rate (₹)  | Line Amount | |
| +------------------------------------+-----------+--------+-----------+-------------+ |
| | TMT Fe 500D Steel 16mm (Primary)   | 2.000     | Ton    | 68,500.00 | 1,37,000.00 | |
| | TMT Fe 500D Steel 12mm (Secondary) | 1.500     | Ton    | 72,000.00 | 1,08,000.00 | |
| +------------------------------------+-----------+--------+-----------+-------------+ |
| [ + Add Material Row ]                                                                |
|---------------------------------------------------------------------------------------|
| SECTION D: FINANCIAL COMMERCIAL SUMMARY                                               |
| Subtotal:                 ₹2,45,000.00                                                |
| Trade Discount (Flat ₹): [ 0.00        ]                                              |
| Tax / GST Included (₹):  [ 0.00        ] (Tax-inclusive invoice)                      |
| FINAL PURCHASE TOTAL:    ₹2,45,000.00 (Indian Numbering Format)                       |
|---------------------------------------------------------------------------------------|
| SECTION E: SUPPORTING INVOICE / CHALLAN DOCUMENT                                      |
| [ Drag & drop supplier invoice photo or PDF / Tap Camera to snap challan ]            |
| (Uploaded: Invoice_4182_Scan.pdf • 1.4 MB)                                            |
|=======================================================================================|
| [Discard]                                           [Save as Unpaid] [Save & Record Pay]
+---------------------------------------------------------------------------------------+
```

### 6.2 Duplicate Invoice Prevention UX
- **Business Reality**: Suppliers sometimes re-send invoices or site engineers re-enter the same challan.
- **UX Feedback**: When the user enters a Supplier and an Invoice Number, an instant soft check runs:
  - If unique: Soft green badge `[✓ Unique Invoice]`.
  - If duplicate for that supplier: Warning banner in Amber Ochre (`#B86E00`): *"Warning: Invoice 'INV-4182' was already recorded for Sri Lakshmi Steels on 15/09/2026. Please check for duplicate entry."* The user can review the existing record before continuing.

### 6.3 Item Entry: Desktop Multi-Row vs Mobile Cards
- **Desktop Multi-Row Entry**:
  - Tab key moves cleanly from `Material Selector` $\to$ `Qty` $\to$ `Unit` $\to$ `Rate` $\to$ `[Enter adds new row]`.
  - Auto-calculation: `Line Amount = Quantity × Unit Rate`.
- **Mobile Item Entry**:
  - Focuses on 1 material item at a time with large numeric inputs (`inputmode="decimal"`).
  - Clear `[+ Add Another Item]` button with immediate subtotal preview.

### 6.4 Supporting Document Upload
- Allows direct photo capture of physical paper challans from site via mobile camera (`capture="environment"`).
- Automatically compressed client-side to $< 500\text{KB}$ before storage.

---

## 7. PURCHASE DETAIL VIEW (`/purchases/:id`)

Purchase Detail acts as the definitive legal and financial voucher for an acquired material consignment.

```
+-------------------------------------------------------------------------------------------------------+
| [<- Back to Purchases]       PUR-2026-081                         [● Paid]     [Print Voucher]        |
| Material Purchase Invoice: INV-4182                                            [View Project Ledger]  |
| Supplier: Sri Lakshmi Steels | Site: PRJ-2026-004 (Senthil Nathan Residence) | Date: 01/10/2026       |
|=======================================================================================================|
| COMMERCIAL PAYMENT SETTLEMENT                                                                         |
| +-----------------------------------+-----------------------------------+-----------------------------+
| | Gross Purchase Value              | Total Paid / Allocated            | Outstanding Balance Due     |
| | ₹2,45,000.00                      | ₹2,45,000.00                      | ₹0.00                       |
| | Net Tax Invoice                   | Disbursed via PAY-0042 (NEFT)     | Fully Settled               |
| +-----------------------------------+-----------------------------------+-----------------------------+
|                                                                                                       |
| PURCHASED LINE ITEMS                                                                                  |
| +-----------------------------------+-----------+----------+---------------+--------------------------+
| | Material Item Description         | Quantity  | Unit     | Unit Rate (₹) | Total Line Amount (₹)    |
| +-----------------------------------+-----------+----------+---------------+--------------------------+
| | TMT Fe 500D Reinforcement Steel 16| 2.000     | Ton      | ₹68,500.00    | ₹1,37,000.00             |
| | TMT Fe 500D Reinforcement Steel 12| 1.500     | Ton      | ₹72,000.00    | ₹1,08,000.00             |
| +-----------------------------------+-----------+----------+---------------+--------------------------+
|                                                      Subtotal:              ₹2,45,000.00              |
|                                                      Adjustments / Discount: ₹0.00                    |
|                                                      TOTAL INVOICE VALUE:   ₹2,45,000.00              |
|-------------------------------------------------------------------------------------------------------|
| ATTACHED VENDOR INVOICE & CHALLAN SCAN                                                                |
| [ PDF Thumbnail: Invoice_4182_Scan.pdf | 1.4 MB | Uploaded 01/10/2026 ] [Download] [Preview Lightbox] |
+-------------------------------------------------------------------------------------------------------+
```

---

## 8. SUPPLIER PAYMENTS & MULTI-PURCHASE ALLOCATION (`/supplier-payments`)

In strict accordance with `PRODUCT_SPEC.md` Section 16, **a single supplier payment may be made against multiple purchases**. A contractor pays a round sum (e.g., `₹3,00,000.00`) to a vendor, which is allocated across 2 or 3 outstanding invoices.

### 8.1 Supplier Payments Listing
- Reusable across **Procurement** and **Finance** modules (Single Source of Truth).
- Columns:
  1. `Voucher Ref`: Monospace tag (e.g., `SPAY-2026-0042`).
  2. `Payment Date`: Date of bank transaction.
  3. `Supplier`: Vendor name with link to `/suppliers/:id`.
  4. `Payment Method`: `NEFT/RTGS`, `Cheque`, `Cash`, `UPI`.
  5. `Payment Amount`: Right-aligned, bold, `₹3,00,000.00`.
  6. `Allocated Amount`: Total allocated to purchases (`₹3,00,000.00`).
  7. `Unallocated Balance`: Any unallocated funds (`₹0.00`).
  8. `Actions`: `[View Voucher]`, `[Print Receipt]`.

---

### 8.2 Record Supplier Payment Experience (The Multi-Purchase Allocation Matrix)
This interaction is the cornerstone of vendor accounts settlement:

```
+---------------------------------------------------------------------------------------+
| RECORD SUPPLIER PAYMENT VOUCHER                                        [Close / Esc]  |
| Disburse payment to a supplier and allocate across outstanding material invoices       |
|=======================================================================================|
| SECTION A: PAYMENT HEADER & BANK PARTICULARS                                          |
| Supplier *        : [ Sri Lakshmi Steels                                            ▼ ]|
| Total Payment (₹) * : [ ₹3,00,000.00 ]  (Indian Formatted Tabular Numeral)             |
| Payment Date *    : [ 02/10/2026 ]     Payment Mode * : [ NEFT / Bank Transfer      ▼ ]|
| Reference / UTR # : [ AXISN26275819203 (NEFT Bank Reference Number)                 ] |
|---------------------------------------------------------------------------------------|
| SECTION B: MULTI-PURCHASE ALLOCATION MATRIX                                           |
| Allocate the ₹3,00,000.00 payment against outstanding invoices for this supplier:     |
| +----------------+------------+--------------------+---------------+----------------+ |
| | Purchase Ref   | Date       | Project Site       | Outstanding   | Allocate (₹)   | |
| +----------------+------------+--------------------+---------------+----------------+ |
| | [x] PUR-071    | 15/09/2026 | PRJ-001: Arun Res. | ₹1,20,000.00  | [ 1,20,000.00] | |
| | [x] PUR-079    | 24/09/2026 | PRJ-004: Senthil N.| ₹1,80,000.00  | [ 1,80,000.00] | |
| | [ ] PUR-081    | 01/10/2026 | PRJ-004: Senthil N.| ₹2,45,000.00  | [        0.00] | |
| +----------------+------------+--------------------+---------------+----------------+ |
|                                                                                       |
| ALLOCATION RECONCILIATION SUMMARY:                                                    |
| Total Payment:    ₹3,00,000.00                                                        |
| Total Allocated:  ₹3,00,000.00                                                        |
| Remaining Credit: ₹0.00 (Balanced Allocation - Ready to Post)                         |
|---------------------------------------------------------------------------------------|
| SECTION C: PAYMENT PROOF DOCUMENT (Optional)                                          |
| [ Drag & drop bank transfer confirmation screenshot or Cheque leaf photo ]            |
|=======================================================================================|
| [Discard]                                           [Disburse & Record Payment]       |
+---------------------------------------------------------------------------------------+
```

### 8.3 Payment Allocation Validation Rules (UX Layer)
- **Positive Allocation Rule**: Every row allocation must be $> 0$.
- **Cap on Outstanding**: Allocation amount to a purchase row **cannot exceed that purchase's outstanding balance** (e.g., cannot allocate ₹1,50,000 to an invoice with only ₹1,20,000 due). If user enters a larger number, input displays red outline and automatically snaps to max outstanding with a tooltip: *"Allocation capped at total invoice balance"*.
- **Over-Allocation Lock**: Total Allocated **cannot exceed Total Payment Amount**. If sum exceeds total payment, primary CTA is disabled and warning banner appears: *"Over-allocated by ₹25,000.00. Please reduce row allocations or increase payment amount."*
- **Reversal Over Deletion**: Confirmed payment vouchers cannot be hard-deleted from the database; the UI provides a formal `[Record Reversal Voucher]` action to maintain strict audit integrity.

---

## 9. BIDIRECTIONAL PROCUREMENT ↔ PROJECT NAVIGATION

The Procurement module is deeply intertwined with project costing:

```
+-----------------------------------------------------------------------------------+
| PROJECT DETAIL (/projects/PRJ-2026-004)                                           |
| Tab: Purchases                                                                    |
| -> Shows all 12 material purchases linked to this site                            |
| -> Direct link on any row opens: /purchases/PUR-2026-081                           |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| PURCHASE DETAIL (/purchases/PUR-2026-081)                                         |
| -> Breadcrumb includes: [<- Back to Project: Er. Senthil Nathan Residence]        |
| -> Supplier link: [Sri Lakshmi Steels] -> opens /suppliers/SUP-0012               |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| SUPPLIER DETAIL (/suppliers/SUP-0012)                                             |
| -> Tab: Purchases shows all projects supplied by Sri Lakshmi Steels               |
| -> Financial ledger reflects total liabilities across all active company sites     |
+-----------------------------------------------------------------------------------+
```

### Recorded Project Cost Calculation Rule:
When a purchase is created and linked to `PRJ-2026-004`, its total value (`₹2,45,000.00`) is **automatically included in the project's Recorded Project Cost** (`Recorded Project Cost = Purchases + Earned Wages + Direct Site Expenses`). **No speculative profit is calculated**.

---

## 10. GLOBAL QUICK ADD INTEGRATION

Procurement provides two signature high-frequency actions within the Global Quick Add menu:

1. **`Add Purchase` Action**:
   - Opens the New Purchase Drawer.
   - If triggered inside `/projects/:id`, the project is pre-selected and locked.
   - If triggered inside `/suppliers/:id`, the supplier is pre-selected and locked.
2. **`Supplier Payment` Action**:
   - Opens the Record Supplier Payment Drawer.
   - If triggered inside `/suppliers/:id`, the supplier is pre-selected, and their active unpaid invoices are loaded automatically into the allocation matrix.

---

## 11. MOBILE PROCUREMENT EXPERIENCE (`< 768px`, MINIMUM 360px)

```
+---------------------------------------------------+
| [<- Procurement]    PURCHASES          [+ New]    |
| Filter: [ All ] [ Unpaid (18) ] [ Paid (18) ]     |
|---------------------------------------------------|
| PUR-2026-074 • Inv: 9821                [● Unpaid]|
| Zuari Cements Agency                              |
| Site: PRJ-2026-004 (Senthil Nathan Residence)     |
| Date: 28/09/2026                                  |
|---------------------------------------------------|
| Total: ₹84,000.00          | Due: ₹84,000.00      |
| 200 Bags Zuari OPC 53 Gr.  | [Due in 14 Days]     |
|---------------------------------------------------|
| [+ Record Payment Voucher]     [View Details >]   |
|---------------------------------------------------|
| [Sticky Bottom FAB: + Quick Add]                  |
+---------------------------------------------------+
```

### Mobile Procurement Rules:
- **No Endless Tables**: Desktop tables collapse to structured 3-tier cards with direct payment buttons.
- **Sticky Camera Access**: Mobile photo capture for delivery challans features high-contrast touch targets $\ge 48\times 48\text{px}$.
- **Safe Area Padding**: Bottom sheets and drawers observe mobile home-bar safe areas (`pb-safe`).

---

## 12. RESPONSIVE BEHAVIOR MATRIX

| Viewport Width | Screen Category | Suppliers Layout | Purchases Layout | Purchase Entry Form | Payment Allocation Matrix |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **360px – 390px** | Small Mobile (iPhone SE) | 1-column stacked cards with call/pay buttons | 1-column transaction cards with status pill | Single-column focused step flow with large numeric inputs | Vertical card list of unpaid invoices with tap-to-allocate |
| **390px – 430px** | Modern Mobile (iPhone 15, S23) | 1-column cards with trade badge and debt aging | 1-column cards with 2x2 financial sub-grid | Vertical section flow with sticky bottom subtotal bar | Stacked invoice rows with stepper allocation inputs |
| **768px – 1023px** | Tablet & Small Laptops | 2-column supplier card grid or compact table | 6-column table with horizontal scroll guard | 2-column layout (Vendor meta left, items right) | Desktop allocation table with auto-fill buttons |
| **1024px – 1279px**| Standard Desktop | Full 7-column data table with inline actions | Full 8-column data table with payment tags | High-efficiency multi-row tabular entry with Tab key navigation | Full multi-invoice allocation table with live balance rail |
| **1280px – 1440px+**| High-Res Desktop / Studio | Full table with hover elevation & instant filters | Full table with embedded material item snippets | Side-by-side split: Form inputs (60%) + Invoice PDF preview (40%) | Full-width ledger allocation matrix with audit trails |

---

## 13. EMPTY STATES SPECIFICATION

1. **No Suppliers Yet**:
   - **Icon**: `lucide: Building` in Warm Gold badge (`#F9F3E5`).
   - **Headline**: `No suppliers registered yet`
   - **Explanation**: *"Register cement dealers, steel stockists, or hardware vendors to begin tracking procurement and site deliveries."*
   - **CTA**: `[+ Register First Supplier]`.
2. **No Materials in Catalog**:
   - **Icon**: `lucide: PackageSearch` in soft stone badge (`#EFECE6`).
   - **Headline**: `Materials catalog is empty`
   - **Explanation**: *"Add construction items (cement, TMT steel, sand) to enable rapid line-item entry on purchase invoices."*
   - **CTA**: `[+ Add Standard Material]`.
3. **No Purchases Recorded**:
   - **Icon**: `lucide: ShoppingCart` in soft stone badge (`#EFECE6`).
   - **Headline**: `No material purchases recorded`
   - **Explanation**: *"Record vendor invoices or site delivery challans to track procurement costs against projects."*
   - **CTA**: `[+ Record First Purchase]`.
4. **No Supplier Payments**:
   - **Icon**: `lucide: Receipt` in emerald tint badge (`#EAF5EE`).
   - **Headline**: `No supplier payments logged`
   - **Explanation**: *"Disburse payments to vendors and allocate them across outstanding invoices to update ledgers."*
   - **CTA**: `[+ Record Supplier Payment]`.
5. **No Purchases for this Supplier**:
   - **Headline**: `No purchases from this vendor`
   - **Explanation**: *"No invoices have been logged under this supplier account yet."*
   - **CTA**: `[+ Record Purchase for this Supplier]`.
6. **No Purchases for this Project**:
   - **Headline**: `No material procurement on this site`
   - **Explanation**: *"No materials have been delivered or billed to this project code yet."*
   - **CTA**: `[+ Add Site Purchase]`.
7. **No Outstanding Supplier Payments (All Settled)**:
   - **Icon**: `lucide: CheckCircle2` in emerald tint badge (`#EAF5EE`).
   - **Headline**: `All supplier bills settled`
   - **Explanation**: *"There are no overdue or pending purchase invoices requiring disbursement at this time."*
8. **No Search Results**:
   - **Icon**: `lucide: SearchX`.
   - **Headline**: `No matching records found`
   - **Explanation**: *"We couldn't find any suppliers, materials, or purchases matching your search terms."*
   - **CTA**: `[Clear All Filters]`.

---

## 14. LOADING & SKELETON STATES

- **Suppliers Shimmer Skeleton**: 5 rows of shimmering bars mirroring table geometry (`h-12 bg-stone-200 animate-pulse rounded`).
- **Purchases Table Shimmer**: Shimmering headers and transaction bars.
- **Allocation Matrix Skeleton**: While fetching a supplier's unpaid invoices during payment creation, the allocation matrix displays 3 shimmering rows with input placeholders (`h-10 bg-stone-100 rounded`).
- **Document Upload Progress**: Uploading invoice scans displays an animated progress bar with clear cancellation option.

---

## 15. ERROR STATES & RESILIENCE

1. **Duplicate Invoice Number Warning**:
   - Amber inline alert: *"Invoice number already exists for this supplier. Verify if this delivery was already recorded."*
2. **Over-Allocation Error**:
   - Crimson inline alert: *"Allocations (₹3,25,000) exceed total payment amount (₹3,00,000). Adjust row allocations before saving."*
3. **Allocation Exceeds Invoice Balance**:
   - Field error: *"Cannot allocate ₹90,000 to an invoice with only ₹84,000 balance due."*
4. **Network Interruption During Save**:
   - Form state preserved locally; retry banner appears: *"Connection lost. Unsaved invoice data preserved. [Retry Submission]"*.
5. **Access Restricted**:
   - Muted lock icon: *"Supplier payment disbursement restricted to Account Administrators."*

---

## 16. ACCESSIBILITY SPECIFICATION (WCAG 2.1 AA)

- **Keyboard Tabular Entry**: Desktop multi-row purchase entry supports complete keyboard operation (`Tab`, `Shift+Tab`, `Enter` adds row, `Delete` removes row).
- **Focus Rings**: Standard 2px solid `#4A0E0E` with 2px offset on all inputs, buttons, and row items.
- **Numeric Field Attributes**: All quantity, rate, and amount inputs utilize `type="text" inputmode="decimal"` to invoke numeric keypads on mobile without breaking decimal comma formatting.
- **Colorblind Status Badges**: All payment and voucher statuses combine a **text label** with a **geometric solid dot indicator**.
- **Currency Pronunciation**: Screen-reader accessible aria-labels on financial numbers (e.g., `aria-label="Two Lakh Forty Five Thousand Rupees"`).

---

## 17. FINAL DESIGN QUALITY AUDIT & CRAFT CRITIQUE

The design specification has been reviewed against **Impeccable**, **Taste**, **Anthropic Frontend Design**, **UI/UX Pro Max**, and **Vercel Web Design Guidelines**:

| Dimension | Evaluation & Resolution | Status |
| :--- | :--- | :--- |
| **Construction Fidelity** | Accurately models bulk site deliveries, challans, and trade suppliers (TMT steel, Zuari cement, M-Sand) rather than generic retail items. | **PASSED** |
| **Zero Inventory Slop** | Confines materials strictly to a master reference catalog without inventing warehouse bins, stock balances, or reorder levels. | **PASSED** |
| **Multi-Purchase Allocation** | Accurately models real contractor payments where one lump-sum disbursement settles multiple outstanding invoices. | **PASSED** |
| **Rule 18 Financial Integrity** | Strictly isolates supplier payables from customer money and employee wages. Zero speculative profit displayed. | **PASSED** |
| **Fast Field Entry** | Mobile photo capture for challans, automatic client-side photo compression to $<500\text{KB}$, and offline draft safety. | **PASSED** |
| **Visual Taste & Aesthetics** | Pure white surface cards, 1px stone borders (`#E2DDD5`), Deep Maroon accents (`#4A0E0E`), and Warm Gold highlights (`#C99A2E`). | **PASSED** |
| **Accessibility (WCAG 2.1 AA)** | Keyboard navigation for multi-row entry, color-independent status pills, high-contrast focus rings, and screen-reader support. | **PASSED** |

---

### Conclusion & Implementation Readiness
This specification completes **Module 06 — Procurement Module Design**. It provides the complete UX/UI architecture, interaction standards, responsive behaviors, and state matrices required to build the procurement and vendor management engine of the **Shivarivel Construction & Interiors** ERP.

**DESIGN PHASE COMPLETE. DO NOT WRITE PRODUCTION CODE OR PROCEED TO IMPLEMENTATION UNTIL ORDERED.**
