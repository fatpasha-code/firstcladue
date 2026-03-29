---
date: "2026-03-29 22:58"
promoted: false
---

Когда current_phase=null и все предыдущие фазы завершены — это Route C (phase complete, more phases remain), а не Route B. В этом случае verify-work должен быть в "Also available". Ошибка проявилась в /gsd:progress: пропустил verify-work при переходе от Phase 2 к Phase 3.
