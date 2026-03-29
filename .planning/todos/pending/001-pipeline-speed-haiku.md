---
title: "Ускорить AI pipeline — переключить модели на Haiku"
status: pending
priority: P3
source: "UAT Phase 02, Test 6"
created: 2026-03-29
theme: performance
---

## Goal

Снизить время ожидания анализа, переключив модели на более быстрые.

## Context

Во время UAT Phase 02 отмечено что pipeline работает медленно. Карточка результата появляется, но пользователь ждёт заметное время. Два последовательных вызова Claude API (extraction → interpretation) на медленной модели дают ощутимую задержку.

## Acceptance Criteria

- [ ] Поменять `CLAUDE_EXTRACTION_MODEL` на `claude-haiku-4-5-20251001` в `.env.local`
- [ ] Оценить качество результата на реальном тексте
- [ ] При необходимости оставить `CLAUDE_INTERPRETATION_MODEL=claude-sonnet-4-6` для баланса качества
- [ ] Обновить `.env.example` если модели изменятся
