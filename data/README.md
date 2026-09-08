# Lokaler Datenordner (GymScore Local)

In diesem Ordner werden alle lokalen Zustandsdaten und Vorlagen gespeichert:

- `gymscore.db`: Die SQLite-Datenbankdatei mit allen Tabellen (`students`, `stations`, `results`, `settings`). Diese Datei entsteht automatisch beim ersten Programmstart.
- `gymscore.db-wal` & `gymscore.db-shm`: Temporäre SQLite Write-Ahead-Log Dateien für blitzschnelle Schreiboperationen.
- `templates/`: Enthält Muster-Excel-Dateien für den Teilnehmerimport.

> **Wichtig:** Dieser Ordner verbleibt vollständig auf Ihrem Rechner. Es erfolgt zu keinem Zeitpunkt eine Übertragung in die Cloud.
