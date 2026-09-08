# Git Commit Guidelines & Conventions — GymScore Local

Um eine saubere, nachvollziehbare und professionelle Versionshistorie zu gewährleisten, folgt **GymScore Local** strikt der **Conventional Commits 1.0.0** Spezifikation.

---

## 📌 1. Grundregeln (Strict Rules)

1. **Sprache (Language):**
   - Alle Commit-Nachrichten **MÜSSEN auf Englisch** verfasst werden (entsprechend der Vorgabe: *UI auf Deutsch, Code & Interna auf Englisch*).
2. **Imperativform (Imperative Mood):**
   - Schreiben Sie die Kopfzeile immer als Befehl an die Codebasis:
     - ✅ `add station validation logic` (nicht: `added...` oder `adds...`)
     - ✅ `fix qr code display on local hotspot` (nicht: `fixed...`)
3. **Kein Punkt am Ende:**
   - Die erste Zeile endet **ohne** Punkt (`.`).
4. **Längenbegrenzung:**
   - Kopfzeile maximal **72 Zeichen**.
5. **Atomare Commits:**
   - Jeder Commit umfasst genau **eine** in sich geschlossene, funktionale Änderung. Mischen Sie niemals Refactorings mit neuen Features oder Bugfixes.
6. **Verbotene Commit-Nachrichten:**
   - ❌ `update`, `wip`, `fixed stuff`, `changes`, `commit`, `bugfix`.

---

## 🏗️ 2. Aufbau einer Commit-Nachricht

```text
<type>(<scope>): <short description in imperative mood>

[optionaler Body mit Erklärung des "Warum" und "Was"]

[optionale Footer, z. B. Closes #123 oder BREAKING CHANGE: ...]
```

---

## 🏷️ 3. Erlaubte Typen (`<type>`)

| Typ | Bedeutung | Beispiel |
| :--- | :--- | :--- |
| `feat` | Neue Funktionalität für den Anwender | `feat(helper): add virtual numeric keypad for fast input` |
| `fix` | Behebung eines Fehlers | `fix(server): resolve Express 5 wildcard path regression` |
| `docs` | Reine Dokumentationsänderungen | `docs(readme): add gym hall wifi setup guide` |
| `refactor` | Code-Änderung ohne Verhaltensänderung | `refactor(db): extract station seeding into separate helper` |
| `style` | Code-Formatierung, Whitespace (keine Logik) | `style(renderer): adjust vertical breathing room in tables` |
| `perf` | Leistungsverbesserungen | `perf(db): add index on students start_number` |
| `build` | Änderungen am Build-System oder Tooling | `build(vite): optimize renderer production bundle split` |
| `chore` | Hilfsskripte, Wartungsaufgaben, .gitignore | `chore(git): update gitignore with electron packaging files` |
| `test` | Hinzufügen oder Korrigieren von Tests | `test(excel): add unit test for student roster parser` |

---

## 🎯 4. Erlaubte Bereiche (`<scope>`)

Der Scope grenzt ein, welches Teilsystem des Projekts betroffen ist:

- `server`: Express.js Server, Routing, Middleware
- `db`: SQLite-Datenbank, Schema, Better-SQLite3
- `renderer`: Desktop-Frontend für den Koordinator (Vite + React)
- `helper`: Mobile Web-App für Stationshelfer (Touch-UI)
- `excel`: SheetJS Importer / Exporter
- `network`: LAN-IP-Erkennung, QR-Code-Generierung
- `electron`: Main-Prozess, Preload, Fensterverwaltung
- `docs`: Handbücher, Anleitungen, AGENT.md
- `deps`: NPM-Pakete, `package.json`

---

## 💡 5. Beispiele: Gut vs. Schlecht

### ❌ Schlechte Commits
```text
fix: table problem
added excel export and some buttons
wip
styling changes
quick update for gym hall
```

### ✅ Gute Commits
```text
feat(excel): add template download for student roster
fix(helper): prevent iOS double-tap zoom on keypad buttons
docs(wifi): add step-by-step instructions for travel routers
refactor(server): modularize router registration into separate files
perf(db): optimize result lookup by station ID
chore(deps): update better-sqlite3 to v13.0.3
```

---

## 🌿 6. Branching-Strategie

- `main`: Stabiler, produktionsreifer Hauptzweig.
- `feature/<name>`: Für neue Meilenstein-Funktionen (z. B. `feature/offline-queue`, `feature/pdf-reports`).
- `fix/<name>`: Für gezielte Bugfixes (z. B. `fix/lan-ip-detection`).
- `docs/<name>`: Für reine Dokumentationserweiterungen.
