# Interpretation Benchmark Set

Набор тестовых кейсов для оценки и эволюции interpretation prompt.

**Полное описание процесса:** `docs/benchmark-plan.md`
**Rubric для оценки output:** `docs/interpretation-eval-rubric.md`
**Правила изменения промпта:** `.claude/rules/interpretation-prompt-evolution.md`

---

## Структура

```
benchmarks/interpretation/
  README.md              # этот файл
  cases/
    {id}/
      input_raw.txt      # исходный текст разговора
      input_extracted.json
      expected_notes.md  # что должен / не должен поймать output
      category.txt       # категория кейса (1–6)
      outputs/           # сохранённые outputs по версиям промпта
```

## Категории кейсов

| # | Тип | Что тестирует |
|---|-----|---------------|
| 1 | Спокойный статусный синк | Fact fidelity — не добавляет лишних рисков |
| 2 | Созвон с зависимостями | Coverage — правильно фиксирует кто от кого ждёт |
| 3 | Хаотичный тех разговор | Maturity fit — не структурирует сверх меры |
| 4 | Релизный с рисками | Status quality — yellow/red с обоснованием |
| 5 | Малоопределённые решения | Fact fidelity — не придумывает принятых решений |
| 6 | Простой неформальный | Vocabulary / enterprise injection |

## Текущее состояние

Кейсы пока не добавлены. Скелет готов.

Для добавления первого кейса:
1. Создать папку `cases/001/`
2. Добавить `input_raw.txt` с текстом разговора
3. Запустить extraction и сохранить результат как `input_extracted.json`
4. Написать `expected_notes.md` — что должен поймать output
5. Указать категорию в `category.txt`
6. Запустить interpretation и сохранить в `outputs/v1.json`
