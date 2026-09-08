# GymScore Local — Roadmap & Meilensteinplanung

Dieses Dokument beschreibt die strukturierten Entwicklungsphasen von **GymScore Local**. Jeder Meilenstein baut auf stabilen, offline-fähigen Software-Fundamenten auf.

---

## 📍 Meilenstein 1: Kern-Engine, SQLite-Datenbank & Excel-Import/Export
*Fokus: Datenpersistenz, Schema-Stabilität und Tabellenverarbeitung ohne externe Abhängigkeiten.*

- [x] **Projekt-Grundgerüst & Toolchain:**
  - TypeScript-Konfiguration, Vite-Builds, Electron-Bootstrap.
  - Express.js Backend-Server mit CORS und Fehlerbehandlung.
- [x] **SQLite Datenbankschicht (`better-sqlite3`):**
  - Tabellen für `students`, `stations`, `results` und `settings`.
  - Transaktionale Datenspeicherung und automatische Indizes für schnelle Suchabfragen nach Startnummern.
- [x] **Excel-Parser & Export-Engine:**
  - Importieren von Klassen- und Teilnehmerlisten (.xlsx) mit Spaltenüberprüfung (`Startnummer`, `Vorname`, `Nachname`, `Geschlecht`, `Geburtsjahr`).
  - Fehlertoleranter Import (Duplikaterkennung, Bereinigung von Leerzeichen).
  - Export vollständiger Zwischen- und Endergebnisse in formatiertes Excel mit Punktesummierung.
- [x] **Lokale Netzwerkerkennung:**
  - Automatische Ermittlung der primären IPv4-Adresse über das Node `os`-Modul.
  - Generierung des Verbindungs-QR-Codes und der direkten Server-URL für Helfer.

---

## 📍 Meilenstein 2: Touch-optimierte Helfer-Weboberfläche (Mobile Client)
*Fokus: Reibungslose, fehlerfreie Dateneingabe an den Stationen in der Turnhalle.*

- [ ] **Stationenauswahl & Statusanzeige:**
  - Startbildschirm zur Auswahl der aktiven Station (z. B. "20m Sprint", "Standweitsprung", "Achterlauf").
  - Permanente Anzeige der aktuellen Station und des lokalen Verbindungsstatus (Online / Offline).
- [ ] **Eingabemaske mit großem Ziffernblock:**
  - Schnelleingabe der Startnummer mit sofortiger Anzeige des Schülernamens zur Sichtkontrolle.
  - Großflächiger, virtueller Ziffernblock (optimiert für Smartphones ohne störende Systemtastatur).
  - Stationsspezifische Einheitenanzeige (Sekunden mit Komma, Zentimeter, Wiederholungen).
- [ ] **Plausibilitätsprüfung & Schnell-Feedback:**
  - Sofortige Warnung bei unmöglichen Werten (z. B. 20m Sprint in 0.5s oder 45.0s).
  - Ein-Klick-Feedback-Buttons für Wertungsnotizen (z. B. "Fehlversuch", "Übergetreten", "2. Versuch").
  - Grüne visuelle Bestätigung bei erfolgreicher Speicherung.
- [ ] **Offline-Puffer (Queue):**
  - Lokale Zwischenspeicherung im Browser (`localStorage` / `IndexedDB`), falls das WLAN kurzzeitig abreißt.
  - Automatisches Nachsenden beim Wiederaufbau der Verbindung.

---

## 📍 Meilenstein 3: Live-Dashboard für den Koordinator (Desktop)
*Fokus: Zentraler Überblick über das gesamte Sportfest und Datenkorrektur.*

- [ ] **Echtzeit-Fortschrittsmonitor:**
  - Übersicht aller Stationen mit Anzahl erfasster Ergebnisse und Durchlaufquote (z. B. "Station 1: 45 / 60 Schülern").
  - Live-Aktivitätsfeed mit den zuletzt eingegangenen Wertungen.
- [ ] **Teilnehmerverwaltung & Suche:**
  - Schnelle Filtersuche nach Startnummer, Name oder Klasse.
  - Detaillierte Schüleransicht mit allen absolvierten Stationen und aktuellen Zwischenpunkten.
  - Nachträgliche Korrekturmöglichkeit fehlerhafter Einträge mit Revisions-Audit.
- [ ] **Wettkampfsteuerung:**
  - Stationen anlegen, deaktivieren oder Einheiten und Bewertungsregeln anpassen (z. B. Höher=Besser vs. Niedriger=Besser).
  - Generierung von Testläufen und Vorlagen für Druckbögen.

---

## 📍 Meilenstein 4: Standalone-Packaging & Automatischer QR-Code
*Fokus: Ein-Klick-Start ohne Kommandozeile für Sportlehrkräfte.*

- [ ] **Electron Standalone-Builds:**
  - Paketierung als portables Windows-Programm (`.exe`) via `electron-builder`.
  - Optionaler Build für macOS (`.dmg`) und Linux (`.AppImage`).
- [ ] **Integrierte Netzwerk-Zentrale:**
  - Vollbild-Modus für den Startbildschirm mit großem QR-Code zum Projizieren auf Hallenwand oder Monitor.
  - Automatische Port-Konflikt-Behebung (sucht freien Port, falls 3000 belegt ist).
- [ ] **Datenbank-Sicherung:**
  - Automatisches Backup der SQLite-Datenbank bei jedem Programmstart und Beenden.

---

## 📍 Meilenstein 5: Automatisierte Offline-Urkunden & Berichte
*Fokus: Druckfertige Auswertungen direkt am Ende des Sporttags.*

- [ ] **Urkundengenerator (PDF):**
  - Vektorbasierter PDF-Export für Schülereinzelurkunden (Gold, Silber, Bronze oder Ehrenurkunde).
  - Platzhalter für Schullogo, Datum, Unterschriftenzeile und Punktedetails.
- [ ] **Klassen- und Jahrgangslisten:**
  - Druckoptimierte Übersichtstabellen für das Lehrerzimmer.
  - Statistiken (Mittelwert, Bestleistung pro Station, Geschlechtervergleich).
