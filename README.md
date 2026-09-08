# GymScore Local 🏃💨

> **Offline-first, lokales Sport-Bewertungs- und Aufnahmesystem für Schulen**
> *(Offline-first, local-network sport assessment manager for schools)*

GymScore Local ist eine leichtgewichtige, eigenständige Desktop-Anwendung, die speziell für Sportlehrkräfte, Schulen (z. B. Sportmittelschulen, Gymnasien) und Vereine entwickelt wurde. Sie ersetzt fehleranfällige Papierlisten und manuelle Excel-Eingaben am Wettkampftag durch ein vollständig offline-fähiges, lokales Echtzeit-Erfassungssystem.

---

## 🎯 Vision & Vorteile für Schulen

Traditionelle Sportfeste, Aufnahmetests und Bundesjugendspiele leiden unter denselben Problemen:
1. **Papierchaos:** Schülerhelfer notieren Zeiten und Weiten auf Klemmbrettern.
2. **Übertragungsengpass:** Am Ende des Tages muss eine Lehrkraft hunderte Zettel mühsam in Excel abtippen.
3. **Mangelnde Netzabdeckung:** Sporthallen sind berüchtigt für Funklöcher und fehlendes Schul-WLAN.
4. **Datenschutz (DSGVO):** Schülerdaten (Namen, Geburtsdaten, sportliche Leistungsdaten) dürfen nicht unbedacht auf externen Cloud-Plattformen gespeichert werden.

### Die Lösung mit GymScore Local:
- **100% Offline & DSGVO-konform:** Läuft als Desktop-App auf dem Laptop des Koordinators. Sämtliche Daten verbleiben in einer lokalen SQLite-Datenbank auf dem Rechner. Keine Cloud, keine externen Server, keine Accounts.
- **Lokaler Helfer-Zugriff über WLAN/Hotspot:** Der Laptop hostet einen leichtgewichtigen Webserver im lokalen Netzwerk. Helfer scannen einfach einen QR-Code auf ihren Smartphones/Tablets und können an ihrer Station (z. B. Sprint, Standweitsprung, Pendellauf) Ergebnisse sofort per Touch eingeben.
- **Nahtlose Excel-Integration:** Vor dem Event wird die Klassen- bzw. Teilnehmerliste per Excel (.xlsx) eingespielt. Nach dem Event werden fertige Ranglisten, Punkte und Rohwerte auf Knopfdruck wieder als Excel und druckfertiges PDF exportiert.
- **Touch- & Hallentauglich:** Großflächige Ziffernblöcke, klare Farben und kontrastreiche Schriften – optimiert für helle Hallenbeleuchtung und schnelle Bedienung mit Handschuhen oder schwitzigen Händen.

---

## 📶 Aufbau in der Sporthalle (WLAN / Hotspot)

GymScore Local benötigt **keine Internetverbindung**. Der Betrieb in der Turnhalle funktioniert nach folgendem simplen Prinzip:

```text
               ┌────────────────────────────────────────────────────────┐
               │              Lokaler Offline-WLAN-Router                │
               │         (z. B. TP-Link Travel-Router oder              │
               │          mobiler Hotspot ohne SIM-Karte)               │
               └───────────▲────────────────────▲──────────────────────▲┘
                           │                    │                      │
                           │                    │                      │
┌──────────────────────────┴────────┐   ┌───────┴────────┐   ┌─────────┴────────┐
│        Koordinator-Laptop         │   │ Smartphone     │   │ Tablet           │
│         (GymScore Local)          │   │ Station 1      │   │ Station 2        │
│   Hostet Desktop-App & Webserver  │   │ 20m Sprint     │   │ Standweitsprung  │
│   Zeigt QR-Code & Live-Status     │   │ (Eingabe)      │   │ (Eingabe)        │
└───────────────────────────────────┘   └────────────────┘   └──────────────────┘
```

### Schritt-für-Schritt Aufbau:
1. **WLAN aktivieren:** Schließen Sie einen gewöhnlichen WLAN-Router in der Halle an die Steckdose (ein Internetkabel ist **nicht** erforderlich) ODER aktivieren Sie den persönlichen Hotspot auf einem Dienst-Smartphone.
2. **Laptop verbinden:** Verbinden Sie den Koordinator-Laptop mit diesem WLAN.
3. **GymScore Local starten:** Die App erkennt automatisch die IP-Adresse im lokalen Netz (z. B. `192.168.1.45:3000`) und zeigt einen gut sichtbaren Verbindungs-QR-Code auf dem Dashboard an.
4. **Helfer verbinden:** Die Schülerhelfer verbinden ihre Smartphones mit demselben Hallen-WLAN, scannen den QR-Code mit der Kamera und wählen ihre Station aus. Fertig!

---

## 🚀 Schnellstart für Entwicklung & Build

### Voraussetzungen
- **Node.js:** v20+ (empfohlen LTS oder aktuell)
- **npm:** v10+

### Installation & Vorbereitung
```bash
# Repository klonen oder im Ordner öffnen
cd gymscore-local

# Abhängigkeiten installieren
npm install
```

### Entwicklungsmodus starten
```bash
# Startet Vite Dev-Server für Renderer & Helper-UI sowie Electron & Express
npm run dev
```

### Produktion & Executable erstellen
```bash
# Baut alle Frontend-Bundles und TypeScript-Quellen
npm run build

# Erstellt eine portable Desktop-Executable für Windows (.exe)
npm run electron:build
```

---

## 📂 Projektstruktur

```text
gymscore-local/
├── src/
│   ├── main/          # Electron Main-Prozess & Fensterverwaltung
│   ├── server/        # Express REST-API, SQLite-Datenbank & Import/Export
│   │   ├── db/        # SQLite Schema, Migrationen & Repository-Layer
│   │   ├── routes/    # Endpunkte für Schüler, Stationen, Ergebnisse & System
│   │   └── services/  # Excel-Parser, IP-Erkennung & Punkteberechnung
│   ├── renderer/      # Desktop-Dashboard für den Koordinator (React + Tailwind)
│   └── helper-ui/     # Mobile Web-App für Stationshelfer (Touch-optimiert)
├── data/              # Lokale SQLite-Datenbank & Excel-Vorlagen
├── docs/              # Ausführliche Handbücher & technische Dokumentation
├── AGENT.md           # Strikte Coding-, Design- & Lokalisierungs-Richtlinien
├── ROADMAP.md         # Entwicklungsmeilensteine
└── package.json       # Build-Skripte & Abhängigkeiten
```

---

## 🔒 Datenschutz & Sicherheit
- Alle Schülernamen, Geburtsjahrgänge und Testergebnisse werden ausschließlich in der lokalen SQLite-Datei unter `./data/gymscore.db` gespeichert.
- Keine Cookies von Drittanbietern, keine Analyse-Tools, keine externen Schriftarten (Google Fonts lokal eingebunden oder Systemschriften).
- Volle DSGVO-Konformität bei sachgemäßem Betrieb auf einem schuleigenen Endgerät.

---

## 🛠️ Entwicklungs- & Git-Richtlinien
- **Coding & Design-Standards:** Siehe [AGENT.md](AGENT.md).
- **Git Commit Conventions:** Siehe [docs/GIT_COMMIT_RULES.md](docs/GIT_COMMIT_RULES.md) (folgt Conventional Commits 1.0.0, Englisch, imperativ).

---

## 📄 Lizenz
GymScore Local wird unter der [MIT-Lizenz](LICENSE) bereitgestellt.
