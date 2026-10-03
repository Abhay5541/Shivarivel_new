# Shivarivel Construction & Interiors

# Database Rules



## 1. Database Is the Source of Truth



PostgreSQL is the authoritative source for:



- financial balances

- transaction integrity

- relationships

- permissions

- company isolation

- important calculations



Frontend calculations must never replace database truth.



---



# 2. IDs



Use UUID primary keys.



Default:



gen_random_uuid()



Foreign keys must reference the correct parent entity.



---



# 3. Company Isolation



Business data should be associated with company_id.



company_id must not be freely supplied by an untrusted client.



Where appropriate:



company_id DEFAULT current_company_id()



RLS must ensure users can only access their company data.



---



# 4. Money



All money fields must use:



numeric(14,2)



Never use:



- float

- double precision

- JavaScript floating point as database authority



Money must be rounded and validated consistently.



---



# 5. Quantity



Material quantities should use:



numeric(12,3)



Examples:



- 10.500 kg

- 25.000 bags

- 12.750 m

- 5.250 sq.ft



---



# 6. Projects



Projects are the central operational entity.



Project-linked records should reference project_id where applicable.



Examples:



- purchases

- expenses

- employee attendance

- wages

- customer payments

- work progress

- daily reports

- documents



---



# 7. Supplier Payments



Supplier payments must be supplier-level transactions.



Do NOT make:



purchase.supplier_payment_id



the primary financial design.



Instead use:



supplier_payments



and:



supplier_payment_allocations



One supplier payment may be allocated across multiple purchases.



---



# 8. Supplier Payment Validation



The following rules must always hold:



total allocations <= payment amount



allocation amount <= purchase outstanding



total allocations against a purchase <= purchase outstanding



A payment cannot be allocated to a purchase belonging to another supplier.



A payment cannot exceed the supplier's relevant outstanding amount unless explicitly supported by the business rules.



---



# 9. Supplier Balance



Supplier balance must be transaction-derived.



Conceptually:



Supplier Balance

=

Total Purchases

-

Total Allocated Supplier Payments



Do not store an independently editable supplier balance.



---



# 10. Purchase Balance



Purchase outstanding:



Purchase Amount

-

Allocated Supplier Payments



Purchase outstanding cannot become negative.



---



# 11. Employee Wage Rules



Wages earned and employee advances are separate concepts.



Example:



Wages earned = ₹10,000

Advance = ₹3,000

Payment = ₹4,000



Then:



Wage payable = ₹6,000



Advance outstanding = ₹3,000



Do NOT subtract employee advance from wage payable unless an explicit advance recovery transaction occurs.



---



# 12. Employee Advances



Advance transaction:



Employee receives ₹3,000.



Outstanding advance:



₹3,000



If recovery = ₹1,000:



Outstanding advance:



₹2,000



Advance recovery must be an explicit transaction.



---



# 13. Employee Payments



Employee payments reduce wage payable according to the defined financial transaction model.



They must not silently modify employee advance balances.



---



# 14. Wage Payable



Conceptually:



Wage Payable

=

Wages Earned

-

Employee Wage Payments

-

Explicit Wage Adjustments / Recoveries where supported



Advance balances remain separate.



---



# 15. Customer Payments



V1 customer payment must have:



project_id NOT NULL



The selected project must belong to the selected customer.



If a milestone is provided:



milestone.project_id must equal payment.project_id



---



# 16. Customer Balance



Customer balance should be derived from:



Project Contract/Receivable Amount

-

Customer Payments



Do not maintain a manually editable customer balance.



---



# 17. Recorded Project Cost



Recorded Project Cost is:



Purchases

+

Employee Wages

+

Project Expenses



This is NOT profit.



Never label this value as:



Profit



unless a proper revenue/accounting model has been implemented.



---



# 18. Financial Corrections



Never delete completed financial transactions to correct mistakes.



Use reversal transactions.



A reversal should:



- reference the original transaction

- preserve the original transaction

- record the correction

- maintain an audit trail



---



# 19. Required Views



Important views include:



v_purchase_balance



v_supplier_balance



v_project_customer_balance



v_employee_wage_payable



v_employee_advance_outstanding



v_project_financials



v_supervisor_employees



---



# 20. Important RPC Functions



Expected database functions include:



create_purchase_transaction



allocate_supplier_payment



record_supplier_payment



generate_employee_wages



record_employee_advance



recover_employee_advance



record_employee_payment



record_customer_payment



reverse_financial_transaction



convert_estimate_to_project



convert_enquiry_to_project



get_dashboard



get_my_day



generate_weekly_report



generate_notifications



expire_estimates



---



# 21. Atomic Financial Operations



Financial operations involving multiple tables must be atomic.



For example:



Recording supplier payment

+

allocating it to purchases



must either completely succeed or completely fail.



Do not allow partial financial state.



---



# 22. Audit



Important financial operations should be auditable.



Audit information should include:



- who performed the action

- when it happened

- affected entity

- operation

- relevant transaction reference



---



# 23. Database Constraints



Use database constraints for important rules.



Examples:



- positive amounts where required

- valid foreign keys

- unique business identifiers where required

- valid status values

- valid dates

- valid allocation amounts

- company isolation

- non-negative balances where appropriate



---



# 24. Golden Test Cases



These scenarios must always work correctly.



## Supplier Payment



Purchase A = ₹10,000



Payment = ₹6,000



Allocation = ₹6,000



Outstanding = ₹4,000



---



## Multiple Purchase Allocation



Purchase A = ₹10,000



Purchase B = ₹5,000



Supplier Payment = ₹12,000



Allocation:



A = ₹8,000

B = ₹4,000



Remaining:



A = ₹2,000

B = ₹1,000



---



## Employee Wage



Wages earned = ₹10,000



Employee payment = ₹4,000



Wage payable = ₹6,000



---



## Employee Advance



Advance = ₹3,000



Recovery = ₹1,000



Advance outstanding = ₹2,000



---



## Combined Employee Scenario



Wages earned = ₹10,000



Advance = ₹3,000



Payment = ₹4,000



Wage payable = ₹6,000



Advance outstanding = ₹3,000



If advance recovery = ₹1,000:



Wage payable = ₹5,000



Advance outstanding = ₹2,000



---



# 25. Database Safety



Never allow the frontend to:



- bypass RLS

- use service role credentials

- directly modify protected financial records

- manually overwrite derived balances

- create invalid cross-company relationships



The database must remain the final authority.
