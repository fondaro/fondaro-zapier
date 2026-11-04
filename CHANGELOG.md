## Unreleased

- Describes Fondaro as a network and a CRM for real estate agencies.
- New Lead's option reads "Only Growth Leads" (was "Only Leads From Your Lead Plans") and the lead's `leadPlanName` field reads "Growth Area" (was "Lead Plan"). Labels only: the field keys are unchanged, so existing Zaps keep working.

## 3.0.0

- Sign in with your Fondaro account (OAuth). Only an organization admin can connect. Existing 2.x connections need to reconnect.
- 14 instant triggers: New Lead, Lead Assigned, Lead Status Changed, Lead Tagged, Lead Untagged, New Deal, Deal Stage Changed, Deal Won, Deal Lost, New Task, Task Completed, New Note, Call Logged, Call Analyzed.
- 11 actions: Create Lead, Update Lead Contact, Update Lead Status, Add Tags to Lead, Add Lead Assignees, Create Deal, Change Deal Stage, Close Deal as Won, Close Deal as Lost, Create Task, Create Note.
- 14 searches, plus Find or Create Lead.
- New Lead replaces New Lead Assigned; "Only Leads From Your Lead Plans" keeps the old behaviour. The lead's plan is now `leadPlanName`.
- Dropdowns list your tags, team members, statuses and deal stages.
