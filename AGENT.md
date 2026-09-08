# GymScore Local — Developer & Agent Guidelines

This document sets the mandatory standards and constraints for any human developer or AI agent working on **GymScore Local**. Every rule here is strict and must be obeyed without exception.

---

## 1. Core Architecture & Philosophy

- **Zero Cloud Dependency:** The app runs entirely offline. It must never attempt to connect to external servers, cloud databases, or remote telemetry.
- **Local Network Resilient:** Student helpers on phones/tablets connect via a local Wi-Fi router or hotspot. Connections may drop when walking between gym halls. All helper interfaces must handle reconnects gracefully without losing entered values or crashing.
- **Privacy by Default:** Student data (names, birth years, grades, sports assessment results) must stay on the coordinator's local machine inside the local SQLite database.

---

## 2. Localization & Language Rules (STRICT)

- **User Interfaces (Desktop & Mobile):**
  - **100% German:** All labels, buttons, headings, tooltips, dialogs, placeholder texts, error toasts, and exported reports (Excel / PDF) **MUST** be in clean, natural, professional German.
  - Examples:
    - `Startnummer` (never "Bib Number" or "Start Number")
    - `Station wählen` (never "Select Station")
    - `Ergebnis speichern` (never "Save Result")
    - `Teilnehmerliste importieren` (never "Import Roster")
    - `Auswertung exportieren` (never "Export Evaluation")
    - `Verbindungsstatus: Bereit` (never "Connection Status: Ready")
- **Code & Internals:**
  - **100% English:** All source code, database tables, column names, variables, functions, interfaces, API routes, and comments **MUST** be in English.
  - Examples:
    - Route: `/api/students`, `/api/results` (never `/api/schueler`)
    - DB Columns: `first_name`, `birth_year`, `raw_value` (never `vorname`, `geburtsjahr`)
    - Functions: `saveResult()`, `importStudentRoster()`

---

## 3. UI / Design Anti-Slop Rules

GymScore Local is built for noisy, high-paced school gym environments where teachers and student helpers need immediate clarity, not shiny animations.

### ❌ What is FORBIDDEN:
- **NO Generic SaaS Clichés:** No purple-to-blue gradients, no multi-color glowing borders, no floating frosted glass (backdrop-blur) cards.
- **NO Gratuitous Animations:** No bouncing badges, no pulsing buttons, no complex page transition slides. Animations must be limited to instant state transitions (<150ms) for critical feedback.
- **NO Tiny Click Targets:** Never use desktop-style micro-buttons (<44px) on touch interfaces.

### ✅ What is REQUIRED:
- **School-Grade, High-Contrast Design:** Clean slate/zinc/gray neutral palette with stark functional accents:
  - **Success / Valid:** High-contrast emerald/green (`#16a34a` / `#15803d`).
  - **Attention / Active:** Solid school blue (`#2563eb`) or dark slate (`#0f172a`).
  - **Error / Disconnected:** High-contrast crimson/red (`#dc2626`).
- **Touch-First for Gym Helpers:**
  - Font sizes on inputs must be at least **16px** (prevents iOS auto-zoom).
  - Minimum button / target size is **48x48px** with comfortable touch padding.
  - Custom on-screen numeric keypad with large buttons for fast result entry.
- **Gym Readability:** Clear typography, high contrast against bright gym lighting, bold status indicators visible from an arm's length.

---

## 4. Coding & Quality Standards

### Naming Conventions
- **Variables & Functions:** `camelCase` (e.g., `studentRoster`, `calculateTotalScore()`).
- **Classes & Interfaces:** `PascalCase` (e.g., `StationResult`, `IStationService`).
- **Constants:** `SCREAMING_SNAKE_CASE` (e.g., `DEFAULT_HTTP_PORT`, `MAX_ATTEMPTS`).
- **Private Members:** Prefix with an underscore (e.g., `_databaseConnection`).

### Code Structure & Whitespace
- **Vertical Air:** Keep code readable and breathing. Group related statements together and separate logical blocks (setup, validation, execution, response) with a single blank line.
- **Function Length:** Keep functions focused and short (under 25-30 lines). Break large functions into distinct private/helper functions.
- **No Dead Code or Placeholders:** Never commit `// TODO: implement later` or dummy mock handlers. Every endpoint and function must be fully implemented and handle errors.

### Commenting Standards
- Explain the **Why** (architectural intent, edge cases, domain rules), not the **What** (the code should speak for itself).
- Use **JSDoc format** (`/** ... */`) for exported functions, interfaces, and classes.
- Use single-line comments (`//`) only for non-obvious business logic.
- All comments must be in clear English.

---

## 5. Offline & Network Resilience Rules

- The mobile helper client must maintain an offline-friendly in-memory queue.
- If a helper device submits a score while Wi-Fi drops, the app must queue the submission, display an amber retry badge, and flush automatically once network connectivity is restored.
- The coordinator desktop app must display live LAN network information (IP address, port, and QR code) prominently so helpers can reconnect effortlessly.

---

## 6. Git Commit Conventions (STRICT)

Every commit to this repository must follow **Conventional Commits 1.0.0**:

- **Structure:** `<type>(<scope>): <short description in imperative mood>`
- **Language:** English only (matching the internal codebase standard).
- **Format:** Imperative mood ("add", "fix", "refactor", not "added" or "fixes"), lower case, max 72 characters, no trailing period.
- **Allowed Types:**
  - `feat`: User-facing new functionality
  - `fix`: Bug fix
  - `docs`: Documentation only changes
  - `style`: Formatting, whitespace (no logic changes)
  - `refactor`: Code restructuring without behavioral change
  - `perf`: Performance improvement
  - `test`: Adding or updating test suites
  - `build`: Build system or bundler changes (tsup, vite, electron-builder)
  - `chore`: Tooling, maintenance, dependency bumps, gitignore
- **Allowed Scopes:** `server`, `db`, `renderer`, `helper`, `excel`, `network`, `electron`, `docs`, `deps`
- **Atomic Commits:** Exactly one logical change per commit. Never commit generic messages like `update`, `wip`, `fixes`.

