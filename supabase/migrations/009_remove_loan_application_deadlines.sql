-- Loan application is not a contract deadline: buyers apply for financing before
-- an offer is ever written, and TREC 40-10 imposes no application date. Drop the
-- rows the old deadline engine generated so timelines stop showing it.

DELETE FROM deadlines
WHERE deadline_type = 'loan_application';
