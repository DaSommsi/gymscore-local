import { Router, Request, Response } from 'express';
import { getDatabaseManager, IStudent } from '../db/database';
import { ExcelService } from '../services/excel.service';

export const studentsRouter = Router();

/**
 * Returns all registered students with optional search filtering.
 */
studentsRouter.get('/', (req: Request, res: Response) => {
  const db = getDatabaseManager().getDb();
  const search = req.query.search as string;

  let query = 'SELECT * FROM students ORDER BY CAST(start_number AS INTEGER) ASC, start_number ASC';
  let params: unknown[] = [];

  if (search) {
    query = `
      SELECT * FROM students 
      WHERE start_number LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR group_name LIKE ?
      ORDER BY CAST(start_number AS INTEGER) ASC
    `;
    const searchPattern = `%${search}%`;
    params = [searchPattern, searchPattern, searchPattern, searchPattern];
  }

  const students = db.prepare(query).all(...params);
  res.json({ success: true, data: students });
});

/**
 * Fast lookup endpoint for mobile helper stations by student start number.
 */
studentsRouter.get('/by-start-number/:startNumber', (req: Request, res: Response) => {
  const db = getDatabaseManager().getDb();
  const { startNumber } = req.params;

  const student = db
    .prepare('SELECT * FROM students WHERE start_number = ?')
    .get(startNumber);

  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Teilnehmer mit dieser Startnummer nicht gefunden.'
    });
  }

  res.json({ success: true, data: student });
});

/**
 * Creates a single student entry.
 */
studentsRouter.post('/', (req: Request, res: Response) => {
  const db = getDatabaseManager().getDb();
  const { start_number, first_name, last_name, gender, birth_year, group_name, notes } = req.body;

  if (!start_number || !first_name || !last_name || !gender || !birth_year) {
    return res.status(400).json({
      success: false,
      message: 'Pflichtfelder fehlen (Startnummer, Vorname, Nachname, Geschlecht, Geburtsjahr).'
    });
  }

  try {
    const statement = db.prepare(`
      INSERT INTO students (start_number, first_name, last_name, gender, birth_year, group_name, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = statement.run(
      start_number.toString().trim(),
      first_name.trim(),
      last_name.trim(),
      gender.toUpperCase(),
      Number(birth_year),
      (group_name || '').trim(),
      (notes || '').trim()
    );

    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Datenbankfehler';
    res.status(400).json({ success: false, message: errorMessage });
  }
});

/**
 * Imports student roster from an uploaded base64 Excel spreadsheet.
 */
studentsRouter.post('/import-excel', (req: Request, res: Response) => {
  const { fileBase64 } = req.body;

  if (!fileBase64) {
    return res.status(400).json({
      success: false,
      message: 'Keine Excel-Datei übermittelt (fileBase64 erforderlich).'
    });
  }

  try {
    const buffer = Buffer.from(fileBase64, 'base64');
    const { validStudents, errors, totalRowsProcessed } = ExcelService.parseStudentRoster(buffer);

    if (validStudents.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Keine gültigen Teilnehmerzeilen in der Excel-Tabelle gefunden.',
        errors
      });
    }

    const db = getDatabaseManager().getDb();
    const insertStatement = db.prepare(`
      INSERT OR REPLACE INTO students (start_number, first_name, last_name, gender, birth_year, group_name, notes)
      VALUES (@startNumber, @firstName, @lastName, @gender, @birthYear, @groupName, @notes)
    `);

    const transaction = db.transaction((roster) => {
      for (const student of roster) {
        insertStatement.run(student);
      }
    });

    transaction(validStudents);

    res.json({
      success: true,
      importedCount: validStudents.length,
      totalRowsProcessed,
      errors
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Fehler beim Verarbeiten der Excel-Datei';
    res.status(500).json({ success: false, message });
  }
});

/**
 * Downloads a sample Excel roster template for schools.
 */
studentsRouter.get('/template/download', (_req: Request, res: Response) => {
  const buffer = ExcelService.generateTemplateBuffer();

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', 'attachment; filename="gymscore_teilnehmer_vorlage.xlsx"');
  res.send(buffer);
});

/**
 * Deletes all registered students and their associated scores.
 */
studentsRouter.delete('/all', (_req: Request, res: Response) => {
  const db = getDatabaseManager().getDb();
  db.prepare('DELETE FROM students').run();

  res.json({ success: true, message: 'Alle Teilnehmer wurden gelöscht.' });
});

/**
 * Deletes a single student.
 */
studentsRouter.delete('/:id', (req: Request, res: Response) => {
  const db = getDatabaseManager().getDb();
  const { id } = req.params;

  db.prepare('DELETE FROM students WHERE id = ?').run(id);
  res.json({ success: true, message: 'Teilnehmer erfolgreich gelöscht.' });
});
