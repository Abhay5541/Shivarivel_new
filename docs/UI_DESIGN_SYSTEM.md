# Shivarivel Construction & Interiors

# UI Design System



## 1. Design Philosophy



The application must feel:



- Clean

- Professional

- Fast

- Practical

- Mobile-first

- Construction-business oriented

- Easy for a non-technical owner to use



Avoid making the application look like a generic enterprise ERP.



---



# 2. Mobile First



Primary target:



Mobile phone.



Minimum supported design width:



360px



The interface must work comfortably on:



- mobile

- tablet

- desktop



Desktop should expand the layout rather than becoming a completely different application.



---



# 3. Navigation



Primary navigation should make the following easy to reach:



- Dashboard

- My Day

- Projects

- Customers

- Purchases

- Employees

- Reports



Secondary functionality can be placed under:



- More

- Settings

- Quick Add



---



# 4. Dashboard



Dashboard should prioritize information over decoration.



Top-level information should include:



- Active Projects

- Customer Dues

- Supplier Balance

- Wage Payable

- Today's Tasks

- Today's Visits

- Recent Transactions



Use cards and compact sections.



Avoid excessive charts.



Charts should only be used when they communicate something useful.



---



# 5. Quick Add



Provide a prominent Quick Add action.



Quick Add options:



- Customer

- Enquiry

- Site Visit

- Estimate

- Project

- Purchase

- Customer Payment

- Supplier Payment

- Employee Payment

- Attendance

- Expense

- Task

- Daily Report



---



# 6. Status Badges



Use consistent status badges.



Examples:



Project:



- Planned

- Active

- On Hold

- Completed

- Cancelled



Enquiry:



- New

- Contacted

- Site Visit Planned

- Estimate Prepared

- Converted

- Lost

- On Hold



Estimate:



- Draft

- Sent

- Accepted

- Rejected

- Expired

- Converted



Status should be visually distinguishable but not rely only on color.



---



# 7. Forms



Forms should:



- be short

- group related fields

- show required fields clearly

- validate immediately when useful

- preserve entered data on validation errors

- provide useful error messages

- work well on mobile



Avoid very long single-page forms where possible.



Use sections or steps when necessary.



---



# 8. Financial UI



Financial amounts should be visually clear.



Examples:



Customer Due

₹45,000



Supplier Balance

₹32,500



Wage Payable

₹18,000



Recorded Project Cost

₹2,45,000



Do not label recorded project cost as profit.



---



# 9. Tables



Tables should be responsive.



On mobile:



- prioritize important columns

- allow horizontal scrolling when necessary

- provide detail pages/drawers

- avoid tiny text



Desktop may show more columns.



---



# 10. Loading States



Every data-dependent screen should have an appropriate loading state.



Prefer:



- skeletons

- loading indicators

- disabled submit buttons during mutation



Avoid blank screens.



---



# 11. Empty States



Every list should have a useful empty state.



Example:



"No purchases yet."



Then provide:



"Add Purchase"



Do not show confusing empty tables.



---



# 12. Error States



Errors should explain:



- what went wrong

- whether the action succeeded or failed

- what the user should do next



Do not expose raw database errors directly to the user.



---



# 13. Success Feedback



After successful actions:



- show toast/message

- update relevant data

- navigate appropriately where useful



Avoid unnecessary success modals.



---



# 14. Project Detail Page



Project detail should act as a mini command center.



Sections may include:



- Overview

- Customer

- Financials

- Work Progress

- Purchases

- Employees

- Expenses

- Payments

- Daily Reports

- Documents

- Photos



---



# 15. Customer Detail



Customer detail should show:



- contact information

- enquiries

- site visits

- estimates

- projects

- customer payments

- outstanding amount

- documents



---



# 16. Supplier Detail



Supplier detail should show:



- supplier information

- purchases

- payments

- allocations

- outstanding balance



---



# 17. Employee Detail



Employee detail should show:



- employee information

- attendance

- wages

- advances

- payments

- outstanding advance

- wage payable

- project assignments where applicable



---



# 18. My Day



My Day should be actionable.



Possible sections:



Today:



- Tasks

- Follow-ups

- Site Visits

- Attendance

- Payments Due

- Purchases

- Expenses

- Alerts



The user should be able to act directly from My Day.



---



# 19. Daily Site Report UI



The report form should make it easy to record:



- date

- project

- workers

- work completed

- materials

- expenses

- issues

- delays

- next-day plan

- notes

- photos



Existing project information should be prefilled where practical.



---



# 20. Documents



Documents should display:



- file name

- type

- upload date

- related entity

- preview/download action where supported



Private documents should use secure access.



---



# 21. Responsive Behavior



Mobile:



- single-column forms

- bottom navigation where appropriate

- sticky primary actions

- large touch targets

- compact cards



Desktop:



- sidebar navigation

- wider tables

- multi-column layouts

- dashboard grid



---



# 22. Accessibility



Use:



- semantic HTML

- keyboard accessibility

- visible focus states

- sufficient contrast

- descriptive labels

- accessible buttons

- accessible form errors



Do not rely only on color to communicate state.



---



# 23. Reusable Components



Prefer reusable components for:



- PageHeader

- StatCard

- StatusBadge

- EmptyState

- ErrorState

- LoadingState

- DataTable

- FormField

- ConfirmDialog

- CurrencyDisplay

- DateDisplay

- QuickAdd

- ProjectCard

- PaymentSummary

- FileUploader



Do not duplicate the same UI pattern across modules.



---



# 24. Design Principle



The user should be able to complete common actions with as few steps as practical.



The UI should optimize for:



Clarity

→ Speed

→ Consistency

→ Mobile usability



not visual complexity.
