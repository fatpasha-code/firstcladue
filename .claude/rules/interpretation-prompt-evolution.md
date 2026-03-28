# Rule: Interpretation Prompt Evolution

**Glob**: `src/lib/ai/interpretation.ts`

## Purpose

This rule governs how the interpretation system prompt may and may not be changed.
The goal is to prevent local patch tuning (fixing one bad output) and enforce
class-level improvements only.

---

## Hard Rules

1. **Never tune against a single transcript.** One bad output is not evidence of a systemic problem.
2. **Every change must address a class of errors**, not a specific word, role, term, or scenario.
3. **Prefer minimal edits.** One focused sentence that fixes the root mechanism beats a full rewrite.
4. **Raw text is always primary.** Do not change the prompt in ways that elevate extractedData above raw text.
5. **Never add domain-specific examples from real user data** into the system prompt.

---

## Required Process Before Changing the Prompt

Before editing `interpretation.ts`, document the following:

1. **What failure was observed?** (describe the output, not the transcript)
2. **Why is this a repeatable class of error?** (not a one-off)
3. **Which of the known failure modes does it belong to?**
   - Confidence inflation (pseudo-precision, made-up numbers)
   - Vocabulary elevation (formal terms replacing casual ones)
   - Enterprise context injection (adding concerns beyond the conversation's maturity)
   - extractedData over-reliance (compounding extraction errors)
   - Plausible-sounding generation (items without grounding in text)
4. **What is the minimal prompt change that addresses the root mechanism?**
5. **What is the regression risk?** (what might get worse)
6. **Was this checked on more than one example?** If not — state that tuning is unsafe without a benchmark.

---

## Acceptable Improvement Targets

- Strengthening the fact/inference/speculation distinction
- Clarifying real_status criteria (green/yellow/red)
- Improving what counts as a valid hidden_blocker (structural grounding requirement)
- Improving calibration of clarification_questions to conversation maturity
- Clarifying the role of extractedData as secondary/navigation-only
- Reducing over-confidence mechanisms

---

## Forbidden Changes

- Adding rules that reference specific words that appeared in one transcript
- Adding examples drawn from a specific real conversation
- Adding domain-specific restrictions (e.g. "tech startups", "bot+webapp projects")
- Increasing prompt length without addressing a specific failure mode
- Changing the output JSON schema (that requires a separate schema migration)
- Removing the raw-text-as-primary rule

---

## Evaluation Requirement

Before merging a prompt change:
- Test on at least 2–3 different conversation types
- Confirm the target failure mode is reduced
- Confirm no obvious regression on previously-good outputs
- If no benchmark set exists: explicitly state "tuning without benchmark — risk unverified"

---

## Говорить "NO" когда

- Prompt изменяется под конкретный разговор или конкретные слова из него
- Нет объяснения какой класс ошибок исправляется
- Изменение увеличивает размер промпта без адресации конкретного механизма
- Примеры в промпте взяты из реальных пользовательских данных
