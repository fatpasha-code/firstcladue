# Phase 3: Record View - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-29
**Phase:** 03-record-view
**Areas discussed:** Inline editing, Interpretation tab, Extraction content, Шапка страницы

---

## Inline Editing

**Q: Как работает режим редактирования?**
Options: Edit mode toggle / Click-to-edit inline
→ **Edit mode toggle** (единая кнопка на странице)

**Q: Как сохраняются правки?**
Options: Explicit save button / Auto-save on blur
→ **Explicit save button**

**Q: Какие поля редактируемы?**
Options: Только description / Все текстовые поля / Всё включая enums
→ **Все текстовые поля** (description, person, deadline/by_when; enums read-only)

**Q: Кнопка Сохранить сохраняет...**
Options: Всё сразу (все табы) / Только активную вкладку
→ **Всё сразу**

---

## Interpretation Tab

**Q: Как показывать hidden_blockers/ambiguities (claim + evidence)?**
Options: Claim + свёрнутая цитата / Claim + всегда видная цитата / Только claim
→ **Claim + свёрнутая цитата** ("источник ▾")

**Q: Порядок блоков во вкладке Интерпретация?**
Options: real_status → summary → management_view → hidden_blockers → ambiguities → clarification_questions
      / summary → management_view → real_status → ...
→ **real_status → summary → management_view → hidden_blockers → ambiguities → clarification_questions**

**User question (вышла за scope):** Можно ли перемещать задачи между статусами мышкой?
→ Отклонено как scope creep. Записано в backlog (drag-and-drop таск-борд — отдельная фаза).

---

## Extraction Content

**Q: Вкладка Блокеры: показывать impact?**
Options: Да, бейдж high/medium/low / Нет, только текст
→ **Да, цветной бейдж** (red=high, yellow=medium, gray=low)

**Q: Вкладка Дедлайны: как отличать explicit vs inferred?**
Options: Бейдж "выведен" / Курсив + сноска
→ **Бейдж "выведен"** для type=inferred; explicit без бейджа

**Q: Если в табе нет данных?**
Options: Текст "Ничего не найдено" / Скрывать пустые табы
→ **Текст "Ничего не найдено"** (muted)

---

## Шапка страницы

**Q: Что показывать над табами?**
Options (multi): Дата записи / Label / StatusBadge / Ссылка назад
→ **Все четыре**: дата + label + StatusBadge + ссылка назад

**Q: raw_text показывать на странице?**
Options: Нет / Да, свёрнутый блок
→ **Нет**
