# ShivariVel Construction & Interiors

# Product Specification



## 1. Product Overview



ShivariVel Construction & Interiors is a lightweight, mobile-first internal business management application for the owner of the business.



The application acts as a digital daily operating system for the business.



The primary objective is to allow the owner to open the application and understand the business quickly:



- Money

- Projects

- Workers

- Today's activities

- Pending actions



The application is not intended to be a full ERP or accounting system.



---



## 2. Product Philosophy



The product must remain:



- Lightweight

- Mobile-first

- Fast

- Simple to operate

- Easy to maintain

- Focused on the owner's daily workflow

- Transaction-driven for financial information

- Project-centered



Avoid unnecessary enterprise complexity.



Do not introduce features outside the approved MVP unless explicitly requested.



---



## 3. Primary User



V1 is designed for one primary business owner.



The system is technically prepared for future multi-user and multi-company support through Supabase Auth, profiles, company_id and RLS, but V1 UX should remain simple.



Do not build complicated supervisor/worker workflows unless explicitly requested.



Future roles may include:



- Owner

- Supervisor

- Worker



Worker portal functionality is not part of MVP.



---



## 4. Business Lifecycle



The primary business lifecycle is:



Customer

→ Enquiry

→ Site Visit

→ Estimate

→ Project

→ Materials / Workers / Expenses / Payments

→ Work Progress

→ Daily Report

→ Weekly Report



Projects are the central entity.



---



## 5. Services



The company provides multiple construction and interior-related services.



Services must be modeled using reusable service types.



Do NOT create separate applications or separate modules for each service.



Example service types:



- Building Plan

- 3D Plan

- Approval Plan

- Estimate & Valuation

- Building Contractor

- Site Surveying

- 3D Elevation

- False Ceiling Works

- Interior Works

- Exterior Works

- Profile Light Work



Service types must be configurable through Settings.



---



# 6. MVP Modules



## Dashboard



The dashboard provides a quick business overview.



It should show:



### Money



- Customer receivables

- Supplier payables

- Employee wage payable

- Employee advance outstanding

- Recent payments

- Recent expenses



### Projects



- Active projects

- Upcoming projects

- Projects requiring attention

- Project progress



### Workforce



- Workers today

- Attendance

- Today's wage information



### Actions



- Pending tasks

- Follow-ups

- Upcoming site visits

- Pending payments

- Important reminders



The dashboard should consume existing business data.



Do not create duplicate financial logic inside the dashboard.



---



# 7. Customers



Customers represent clients of the business.



Customer information includes:



- Name

- Phone

- Alternate phone

- Email

- Address

- Location

- Customer type

- Status

- Notes

- Documents



Customer details should show related:



- Enquiries

- Site visits

- Estimates

- Projects

- Customer payments

- Documents



---



# 8. Enquiries



An enquiry represents a potential customer request.



Fields include:



- Customer

- Service type

- Budget

- Source

- Assigned user

- Status

- Next follow-up

- Notes



Enquiries can eventually be converted into projects.



Conversion must use an atomic database operation.



---



# 9. Site Visits



Site visits represent visits related to customers, enquiries or projects.



Fields include:



- Customer

- Enquiry

- Project

- Visit date/time

- Location

- Measurements

- Requirements

- Follow-up date

- Notes

- Photos/documents



---



# 10. Estimates



Estimates represent proposed project/service costs.



MVP estimate categories include:



- Material

- Labour

- Electrical

- Plumbing

- Interior

- Other



The total must equal the sum of the estimate categories.



Estimates have:



- Customer

- Enquiry

- Project if applicable

- Valid-until date

- Status

- Total



Future BOQ support is reserved using estimate_lines.



estimate_lines is V2 UI functionality.



---



# 11. Projects



Projects are the central entity of the application.



A project contains:



- Project code

- Customer

- Project name

- Location

- Start date

- Expected completion date

- Contract value

- Status

- Supervisor

- Source estimate

- Services



A project can contain multiple services.



Projects also connect to:



- Purchases

- Employees

- Attendance

- Wages

- Advances

- Employee payments

- Expenses

- Customer payments

- Work progress

- Daily site reports

- Documents

- Tasks



---



# 12. Project Financial Terminology



Do NOT call project recorded cost "profit".



The application is not an accounting system.



Use:



## Recorded Project Cost



Recorded Project Cost is derived from relevant recorded:



- Purchases

- Employee wages

- Project expenses



Project financial information should include:



- Contract value

- Customer payments received

- Customer outstanding

- Recorded Project Cost



No profit calculation is required in MVP.



---



# 13. Suppliers



Suppliers provide materials/services to the business.



Supplier fields include:



- Name

- Company

- Phone

- Alternate phone

- GST number if applicable

- Category

- Status

- Notes



Supplier details should provide a ledger view containing:



- Purchases

- Supplier payments

- Allocations

- Outstanding balance



---



# 14. Materials



Materials are reusable master records.



Fields include:



- Material name

- Category

- Default unit

- Active/inactive



Inventory management is not part of MVP.



The data model must remain capable of supporting inventory later.



---



# 15. Purchases



Purchases represent materials/services bought from suppliers.



A purchase contains:



- Supplier

- Project

- Invoice number

- Purchase date

- Discount

- Tax

- Total

- Due date

- Purchase items



Purchase items contain:



- Material

- Quantity

- Unit

- Unit price

- Line total



Purchase total must be transactionally derived from its items.



---



# 16. Supplier Payments



Supplier payments represent money paid to suppliers.



A supplier payment may be made against multiple purchases.



Do NOT attach a supplier payment directly to only one purchase.



Use:



supplier_payments

+

supplier_payment_allocations



Rules:



- Allocation amount must be positive.

- Total allocations cannot exceed payment amount.

- Allocation to a purchase cannot exceed purchase outstanding.

- One payment can be allocated across multiple purchases.

- Over-allocation must fail.

- Financial corrections use reversal rather than deletion.



---



# 17. Employees



Employees represent workers.



Fields include:



- Name

- Phone

- Worker type

- Daily wage

- Status

- Joining date

- Emergency contact

- Photo



---



# 18. Attendance



Attendance records:



- Employee

- Date

- Project

- Attendance status

- Daily wage snapshot

- Overtime hours

- Overtime amount



Rule:



One employee should not have duplicate attendance for the same date.



---



# 19. Wages



Wages are generated from attendance.



Wage records include:



- Base wage

- Overtime

- Bonus

- Deduction



Wages earned and wages paid must remain separate.



---



# 20. Employee Advances



Employee advances represent money given to employees in advance.



Advances are NOT wages.



Example:



Wages earned = ₹10,000

Advance = ₹3,000

Payment = ₹4,000



Then:



Wage payable = ₹6,000

Advance outstanding = ₹3,000



If ₹1,000 of the advance is recovered:



Wage payable = ₹5,000

Advance outstanding = ₹2,000



Advance recovery therefore affects both:



- Advance outstanding

- Wage payable



These must be tracked separately.



---



# 21. Employee Payments



Employee payments represent actual money paid to employees.



Payments contain:



- Employee

- Date

- Amount

- Payment method

- Wage period

- Notes



---



# 22. Customer Payments



Every MVP customer payment must belong to a project.



Fields include:



- Customer

- Project

- Optional payment milestone

- Amount

- Payment method

- Reference number

- Date

- Notes

- Receipt attachment



The project must belong to the specified customer.



Overpayment should fail unless explicitly supported later.



---



# 23. Expenses



Expenses represent business/project expenses.



Fields:



- Date

- Category

- Project if applicable

- Amount

- Paid by

- Payment method

- Description



Financial corrections use reversal where required.



---



# 24. My Day



"My Day" is an operational command center.



It is not simply a TODO list.



It should combine:



- Tasks

- Follow-ups

- Site visits

- Payment reminders

- Attendance

- Purchases

- Expenses

- Project activities

- Notifications

- Other important actions for the day



The goal is to answer:



> What do I need to deal with today?



---



# 25. Tasks



Tasks include:



- Title

- Category

- Priority

- Status

- Due date/time

- Related customer

- Related project

- Related supplier

- Related employee

- Reminder time



Tasks can be completed from My Day.



---



# 26. Daily Site Reports



A daily site report contains:



- Project

- Date

- Work completed

- Workers

- Materials

- Expenses

- Issues

- Delays

- Next-day plan

- Notes

- Photos



A project should have at most one daily site report per date.



Existing workers and relevant data should be prefilled where practical.



---



# 27. Work Progress



Projects may contain work items.



Each work item can have:



- Name

- Category

- Status

- Progress percentage

- Start date

- Expected completion

- Actual completion



Progress is project operational information.



---



# 28. Documents and Photos



Documents can be associated with:



- Customer

- Enquiry

- Site visit

- Estimate

- Project

- Purchase

- Payment

- Employee

- Company



Storage files are kept in Supabase Storage.



Metadata remains in the attachments table.



Storage should use private access and signed URLs.



---



# 29. Weekly Reports



Weekly reports summarize:



- Projects

- Purchases

- Labour

- Wages

- Expenses

- Customer payments

- Supplier payments

- Pending payments

- Other important business activity



Weekly report snapshots may be stored for historical reporting.



---



# 30. Settings



Settings should include:



- Company profile

- Company logo

- Address

- Phone

- Alternate phone

- Email

- Website

- GST number if applicable

- Owner/contact information

- Service types



Company information must never be hardcoded inside reports or UI.



Use company_settings.



---



# 31. Quick Add



Quick Add should provide fast access to:



1. New Customer

2. New Enquiry

3. New Site Visit

4. New Estimate

5. New Project

6. New Purchase

7. Customer Payment

8. Supplier Payment

9. Employee Payment

10. Attendance

11. Expense

12. Task

13. Daily Report



---



# 32. MVP Exclusions



Do not build these in MVP:



- Full accounting

- GST/accounting compliance

- Payroll compliance

- Inventory management

- BOQ UI

- Complex scheduling

- Client portal

- Employee application

- GPS attendance

- WhatsApp automation

- AI assistant

- OCR

- Equipment management

- Subcontractor management

- Multi-branch management

- Full offline synchronization



These belong to future versions.



---



# 33. V2 Direction



Potential V2 features:



- Inventory

- Material consumption

- Reorder alerts

- BOQ

- Detailed quotations

- Invoices

- Payment milestones

- Client portal

- WhatsApp sharing

- Automated reminders

- Advanced progress tracking

- Calendar

- Better PDF reports



---



# 34. V3 Direction



Potential V3 features:



- AI assistant

- Voice data entry

- Invoice OCR

- Automatic estimate generation

- Material price tracking

- Cash-flow forecasting

- Predictive project cost

- Employee/customer apps

- GPS attendance

- Equipment/subcontractor management

- Accounting integration

- Multi-branch support



---



# 35. Core Product Rule



The product must remain:



> A daily operating system for the construction and interiors business.



Do not turn it into a generic ERP.



Every new feature must have a clear relationship to:



- Customers

- Projects

- Materials

- Workers

- Money

- Daily operations

- Reports
