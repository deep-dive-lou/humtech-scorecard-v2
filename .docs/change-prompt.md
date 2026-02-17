# Scorecard V2 — Change Prompt (Repo + n8n + Host Site)

Use this prompt to implement the following changes across the Next.js repo, the n8n workflow, and the host website (humtech.ai).

---

## REFERENCE: Current Question Number → Config ID Mapping

| Display # | Config ID | Status |
|-----------|-----------|--------|
| Q1 | q1_engagement_method | Keep |
| Q2 | q2_response_time | Keep |
| Q3 | q3_247_booking | Keep |
| Q4 | q4_show_rate | Keep |
| Q5 | q5_repetitive_manual_processes | Keep |
| Q6 | q6_issue_detection | Keep |
| Q7 | q7_metric_tracking | **Edit** |
| Q8 | q8_non_revenue_time | **Edit (adopt Q9 answers)** |
| Q9 | q9_repetitive_tasks_time | **DELETE** |
| Q10 | q10_kpi_tracking_quality | **DELETE** |
| Q11 | q11_documents_and_signatures | Keep |
| Q12 | q12_current_situation | **Edit** |
| Q13 | q_lead_volume | Keep |
| Q14 | q_deal_value | Keep |
| Q15 | q_estimated_gross_revenue | Keep |
| Q16 | q_estimated_gross_margin | Keep |
| Q17 | q13_desired_outcome (multi-select) | **Edit** |
| Q18 | q14_ai_barriers (multi-select) | **Edit** |
| Q19 | q15_solution_type | **DELETE** |

After deletions, the form will have **16 questions** + notes step + email capture = **18 total steps**.

---

## 1. REPO CHANGES (`src/lib/assessment/config.ts`)

### 1.1 — Q7 (`q7_metric_tracking`): Shorten question, fix caps

**Current text:**
> Do you follow "If you can't measure it, you can't manage it"—tracking key metrics e.g. time to lead engagement, Conversion %, Staff Deflection Savings, pipeline coverage, and sales cycle length?

**New text:**
> Do you track key revenue metrics in one place e.g. time to lead engagement, conversion %, staff deflection savings, pipeline coverage, and sales cycle length?

Changes: removed the idiom, lowercased "Conversion %", "Staff Deflection Savings".

---

### 1.2 — Q8 (`q8_non_revenue_time`): Replace answers with Q9's answer set

Keep the existing Q8 question text. Replace Q8's current options with the answer set from Q9:

**New options for Q8:**
- A: "None"
- B: "60 minutes or less per week"
- C: "1–5 hours per week"
- D: "More than 5 hours per week"
- E: "I don't know / we don't track this"

(These are Q9's current answers, with the 1–5h range instead of Q8's current 1–4h.)

---

### 1.3 — DELETE Q9 (`q9_repetitive_tasks_time`)

Remove entirely from `assessmentConfig.questions[]`. It duplicates Q8 ("how much time do you or your team spend performing standard repetitive tasks...").

---

### 1.4 — DELETE Q10 (`q10_kpi_tracking_quality`)

Remove entirely from `assessmentConfig.questions[]`. It duplicates Q7 (metric tracking).

---

### 1.5 — Q12 (`q12_current_situation`): New answers + bold "current"

**Question text** — make the word "current" bold. In the React component, render Q12's text with `<strong>current</strong>` (or handle via a `richText` flag / dangerouslySetInnerHTML / split approach — whatever is cleanest).

**New answer options (replace all existing):**

**Option A** (id: `advanced`):
> Advanced conversational AI. Over 80% new leads book and attend appointments. Industry leading sales conversion. Minimum or zero repetitive admin. Zero GDPR risk or time loss through email/doc requests. Lead gen & marketing optimal (ROAS/CRO/CAC/CPL/Copy & Creatives). KPI data is cutting edge and visible in one place.

**Option B** (id: `some`):
> Some AI/automation. 50% new leads book and attend appointments. Industry average sales conversion. Some repetitive admin. Some GDPR risk & time loss through email/doc requests. Lead gen and marketing average (ROAS/CRO/CAC/CPL/Copy & Creatives). KPI data partially automated but could be improved.

**Option C** (id: `none`):
> No AI/automation. <50% new leads book & attend appointments. Below desired sales conversion. High repetitive admin. Medium-high GDPR risk & time loss through email/doc requests. Lead gen & marketing unsatisfactory (ROAS/CRO/CAC/CPL/Copy & Creatives). KPI data has manual elements and metrics/display could be improved.

Remove the old "Other, please specify" option D.

---

### 1.6 — Q17 (`q13_desired_outcome`): New answers + "select all that apply"

**Question text** — ensure it explicitly says "Select all that apply" (it currently does: "What best describes the outcome you're looking for? (Select all that apply.)").

**Replace all options with:**

- A (id: `time-saving`): "Time saving deflection ROI - more output per unit of time, fewer manual processes"
- B (id: `ai-sales`): "'Done For You' AI sales system with guaranteed attendance and conversion improvement"
- C (id: `ai-leadgen`): "'Done For You' AI lead generation with guaranteed ROAS improvement (full ad account management)"
- D (id: `growth`): "Growth without friction or linear headcount requirements"
- E (id: `staff-retention`): "Reduced staff frustration and turnover from manual repetitive tasks"
- F (id: `revenue-growth`): "Overall revenue growth without retainers or up-front payments (pay on results only)"
- G (id: `governance`): "Enhance governance / reduce GDPR risk (e.g. ensure cloud data stored in UK data centres / cease sending and/or receiving sensitive data or documents via email)"
- H (id: `none`): "None of the above, we're fine as we are."
- I (id: `other`): "Other, please specify:" `hasTextInput: true`

**Removed:** "A combination of time saving and revenue increase" (old option C).

---

### 1.7 — Q18 (`q14_ai_barriers`): Fix punctuation + add new answers

**Question text** — ensure it explicitly says "Select all that apply". Currently: "What has prevented you from implementing comprehensive AI strategy previously? (Select all that apply.)"

**Fix existing Option A** — replace multiple "or" with commas and one final "or":

**Current:** "We've tried other platforms/apps and the technology did not meet our standards or solve a problem or evidence sufficient ROI/use case"

**New:** "We've tried other platforms/apps and the technology did not meet our standards, solve a problem, or evidence sufficient ROI/use case"

Also **remove the full stop before the closing bracket** in the question text if present.

**Add new options (after existing D):**

- E (id: `no-upfront`): "We don't want to commit to upfront payments, retainers or contracts without evidence that the system produces results for our business specifically."
- F (id: `no-comprehensive`): "We have yet to find a comprehensive solution which can implement AI infrastructure across all departments - most services only solve one or two problems."
- G (id: `aftercare`): "We don't want to use an 'out the box' service without specialised aftercare in case there are issues."
- H (id: `no-upheaval`): "We don't want upheaval or new systems - AI has to integrate with the software and infrastructure already in place."
- I (id: `hands-off`): "We don't have time to learn about AI systems. We need a 'hands off' system which doesn't incur additional time costs to our staff."
- J (id: `other`): "Other, please specify:" `hasTextInput: true`

---

### 1.8 — DELETE Q19 (`q15_solution_type`)

Remove entirely from `assessmentConfig.questions[]`. Q18 now covers it.

---

### 1.9 — Multi-select indication

For **all** multi-select questions (q13_desired_outcome, q14_ai_barriers), ensure the question text or a subtitle clearly indicates "Select all that apply". Both already say this in their text — just verify this remains after edits.

---

### 1.10 — Mobile: form at top of viewport

The form is embedded as an iframe on the host site. On mobile, users have to scroll down to find the form. Options:
- **Host site fix (preferred):** Add a scroll-to-iframe or anchor link on the host page so mobile users jump straight to the form.
- **Repo fix (if needed):** Ensure the form's `<main>` has no excessive top padding on mobile. Currently `py-4 sm:py-6` — this looks fine, so the issue is likely host-side.

---

## 2. REPO: Update `question_ids.md`

After deletions, update `.docs/directories/question_ids.md` to remove:
- `q9_repetitive_tasks_time`
- `q10_kpi_tracking_quality`
- `q15_solution_type`

---

## 3. HOST WEBSITE CHANGES (humtech.ai — outside this repo)

### 3.1 — Update question count text

**Current:** "Answer 15 questions to find out how many leads you're losing"

**New:** "Get your free AI Diagnostic instant report & PDF to share within your business"

### 3.2 — Update tagline

**Current:** "Find out how many leads you're losing if you're NOT embracing AI"

**New:** "Find out how much revenue you're leaving on the table if you're NOT embracing AI"

### 3.3 — Mobile scroll fix

Add an anchor/scroll-to behaviour so mobile users land directly at the form iframe rather than having to scroll down.

---

## 4. n8n WORKFLOW CHANGES

### 4.1 — Question Scoring / Pillar Weight node

The n8n scoring node currently scores Q1–Q11 using kebab-case IDs. After this change:

**Remove these question IDs from `SCORE_0_TO_5` and `QUESTION_WEIGHTS`:**
- `q9-kpi-tracking` (was Q10 `q10_kpi_tracking_quality` — maps to n8n's `q9-kpi-tracking`)
- `q8-repetitive-tasks` (was Q9 `q9_repetitive_tasks_time` — maps to n8n's `q8-repetitive-tasks`)

> **IMPORTANT:** The n8n node uses legacy kebab-case IDs. Per `question_ids.md`, these should be migrated to snake_case to match the frontend. Verify which ID format the `rawAnswers` payload actually sends — if it sends snake_case, update the n8n maps accordingly.

**Update Q8 scoring** — Q8 now has Q9's old answer set (None / 60m / 1-5h / 5h+ / Unknown), so its scoring map needs to reflect the new options. Update the score values for `q7-follow-up-time` (or its snake_case equivalent) to match.

**Update Q12 scoring** — Q12's new 3-tier answers (A: Advanced, B: Some, C: None) replace the old 4-option set. Update `q11-overall-automation` scoring:
- A: 5 (Advanced)
- B: 3 (Some)
- C: 1 (None)

(Remove D scoring since "Other" option is gone.)

**Recalculate pillar weights** if needed — with 2 fewer scored questions, the remaining questions' weights in `QUESTION_WEIGHTS` may need rebalancing to maintain fair pillar representation.

### 4.2 — Banding / Qual Mapping node

Update any references to deleted question IDs. Verify pillar insight text still makes sense with fewer input questions.

### 4.3 — Informative answers mapping

In the scoring node's section 7 ("Informative-only answers"):
- Remove `q14SolutionType` (Q19/q15_solution_type is deleted)
- Update `q12DesiredOutcome` to handle the new expanded multi-select answer IDs (A through I)
- Update `q13Barriers` to handle new answer IDs (A through J)

### 4.4 — Build PDF HTML node

Verify the PDF template doesn't reference deleted questions or their old answer text. Update any hardcoded question text if present.

---

## 5. SUMMARY OF DELETIONS

| Deleted | Reason |
|---------|--------|
| Q9 (`q9_repetitive_tasks_time`) | Duplicates Q8 |
| Q10 (`q10_kpi_tracking_quality`) | Duplicates Q7 |
| Q19 (`q15_solution_type`) | Covered by Q18 |

## 6. POST-CHANGE CHECKLIST

- [ ] Config.ts has 16 questions (was 19)
- [ ] Form shows 18 total steps (16 questions + notes + email)
- [ ] Q7 text shortened, no unnecessary caps
- [ ] Q8 uses Q9's old answer options
- [ ] Q12 has 3 new answer tiers, "current" is bold
- [ ] Q17 has 9 new answer options, says "select all that apply"
- [ ] Q18 has answer A punctuation fixed, 6 new options added, says "select all that apply"
- [ ] "A combination of time saving and revenue increase" option removed from Q17
- [ ] n8n scoring node updated (removed deleted Qs, updated answer maps)
- [ ] n8n informative mapping updated
- [ ] Host site heading text updated
- [ ] Host site mobile scroll-to-form fixed
- [ ] question_ids.md updated
- [ ] End-to-end test: submit form → n8n scores correctly → PDF generates
