const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const sampleRoster = [
  {
    Startnummer: '101',
    Vorname: 'Maximilian',
    Nachname: 'Müller',
    Geschlecht: 'M',
    Geburtsjahr: 2014,
    Klasse: '5A',
    Notizen: ''
  },
  {
    Startnummer: '102',
    Vorname: 'Sophie',
    Nachname: 'Schmidt',
    Geschlecht: 'W',
    Geburtsjahr: 2014,
    Klasse: '5A',
    Notizen: ''
  },
  {
    Startnummer: '103',
    Vorname: 'Leon',
    Nachname: 'Schneider',
    Geschlecht: 'M',
    Geburtsjahr: 2013,
    Klasse: '5B',
    Notizen: 'Leichtathletik-Erfahrung'
  },
  {
    Startnummer: '104',
    Vorname: 'Emma',
    Nachname: 'Fischer',
    Geschlecht: 'W',
    Geburtsjahr: 2014,
    Klasse: '5B',
    Notizen: ''
  },
  {
    Startnummer: '105',
    Vorname: 'Lukas',
    Nachname: 'Weber',
    Geschlecht: 'M',
    Geburtsjahr: 2014,
    Klasse: '5B',
    Notizen: ''
  }
];

const targetDir = path.resolve(__dirname, '../data/templates');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const worksheet = XLSX.utils.json_to_sheet(sampleRoster);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'Teilnehmerliste');

const filePath = path.join(targetDir, 'schueler_muster.xlsx');
XLSX.writeFile(workbook, filePath);
console.log('Sample roster generated at:', filePath);
