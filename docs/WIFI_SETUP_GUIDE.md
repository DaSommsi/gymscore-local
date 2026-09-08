# WLAN- und Netzwerk-Leitfaden für Sporthallen

Dieses Dokument erklärt, wie GymScore Local in Turn- und Sporthallen ohne Internetverbindung und ohne Schulnetz-Infrastruktur zuverlässig betrieben wird.

---

## 📌 Das Kernprinzip

GymScore Local benötigt **keinen Internetzugang**. Die gesamte Kommunikation zwischen dem Koordinator-Laptop und den Helfer-Smartphones findet ausschließlich über das **lokale Netzwerk (LAN/WLAN)** statt.

---

## 🛠️ Empfohlene Setups

### Option A: Mobiler Reise-Router (Sehr empfohlen)
Ein kompakter Reise-Router (z. B. TP-Link TL-WR902AC, GL.iNet Mango oder Netgear N300) ist die zuverlässigste Lösung für Sportfeste.

1. **Aufbau:** Router einfach in die Hallen-Steckdose stecken (kein Internet-/LAN-Kabel nötig).
2. **Eigenes WLAN:** Der Router spannt ein vorkonfiguriertes WLAN auf (z. B. `GymScore-Netz`).
3. **Verbindung:**
   - Koordinator-Laptop verbindet sich mit dem WLAN.
   - Alle Helfer-Smartphones verbinden sich mit demselben WLAN.
4. **Vorteil:** Unabhängig von Schulfiltern, keine Firewall-Blockaden, extrem stabil über Distanzen von 30–50 Metern.

---

### Option B: Mobiler Smartphone-Hotspot
Falls kein Router vorhanden ist, kann ein Smartphone als Hotspot dienen.

1. **Hotspot aktivieren:** Auf einem Diensthandy oder Privathandy den persönlichen Hotspot einschalten.
   - *Hinweis:* Mobile Daten können am Handy deaktiviert werden; das lokale WLAN-Netz funktioniert trotzdem.
2. **Laptop & Helfer verbinden:** Alle Geräte mit dem Namen und Passwort des Hotspots verbinden.
3. **Laptop-IP prüfen:** GymScore Local ermittelt automatisch die neue IP des Hotspots (z. B. `192.168.43.15`).

---

### Option C: Schulinternes Gäste-WLAN (mit Einschränkungen)
Falls in der Sporthalle Schul-WLAN verfügbar ist:
- **Wichtig prüfen:** Viele Schulnetzwerke aktivieren eine sogenannte **Client Isolation** (AP Isolation). Dies verhindert, dass zwei WLAN-Geräte direkt miteinander kommunizieren können.
- Wenn Helfer den QR-Code scannen und die Seite nicht lädt, ist Client Isolation aktiv. Nutzen Sie in diesem Fall sofort **Option A** oder **Option B**.

---

## ⚡ Fehlerbehebung bei Verbindungsproblemen

| Problem | Mögliche Ursache | Sofort-Lösung |
| :--- | :--- | :--- |
| Helfer-Handy lädt Seite nicht | Windows-Firewall blockiert Port 3000 | In Windows Defender Firewall den Port `3000` für private Netzwerke freigeben. |
| Helfer sieht "Offline"-Badge | WLAN-Empfang am Hallenrand abgebrochen | In die Reichweite des Routers treten. Das Helfer-UI synchronisiert automatisch, sobald Netz wieder da ist. |
| IP-Adresse hat sich geändert | Laptop hat sich neu ins WLAN eingewählt | Im Koordinator-Dashboard auf "Helfer QR-Code" klicken – der neue QR-Code passt sich automatisch an. |
