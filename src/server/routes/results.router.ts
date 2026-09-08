import { Router, Request, Response } from 'express';
import { getDatabaseManager } from '../db/database';
import { ExcelService } from '../services/excel.service';

export const resultsRouter = Router();

/**
 * Lists recorded results with student and station details.
 */
resultsRouter.get('/', (req: Request, res: Response) => {
  const db = getDatabaseManager().getDb();
  const stationId = req.query.stationId as string;
  const studentId = req.query.studentId as string;

  let query = `
    SELECT r.*, 
           s.start_number, s.first_name, s.last_name, s.gender, s.group_name,
           st.name AS station_name, st.unit AS station_unit
    FROM results r
    JOIN students s ON r.student_id = s.id
    JOIN stations st ON r.station_id = st.id
  `;
  const params: unknown[] = [];
  const whereClauses: string[] = [];

  if (stationId) {
    whereClauses.push('r.station_id = ?');
    params.push(stationId);
  }

  if (studentId) {
    whereClauses.push('r.student_id = ?');
    params.push(studentId);
  }

  if (whereClauses.length > 0) {
    query += ' WHERE ' + whereClauses.join(' AND ');
  }

  query += ' ORDER BY r.recorded_at DESC LIMIT 200';

  const results = db.prepare(query).all(...params);
  res.json({ success: true, data: results });
});

/**
 * Returns the most recent entries for a specific station.
 */
resultsRouter.get('/station/:stationId/recent', (req: Request, res: Response) => {
  const db = getDatabaseManager().getDb();
  const { stationId } = req.params;

  const query = `
    SELECT r.*, 
           s.start_number, s.first_name, s.last_name, s.group_name
    FROM results r
    JOIN students s ON r.student_id = s.id
    WHERE r.station_id = ?
    ORDER BY r.recorded_at DESC
    LIMIT 15
  `;

  const results = db.prepare(query).all(stationId);
  res.json({ success: true, data: results });
});

/**
 * Submits a new score from a helper station.
 */
resultsRouter.post('/', (req: Request, res: Response) => {
  const db = getDatabaseManager().getDb();
  const { start_number, station_id, raw_value, feedback_tags, helper_comment } = req.body;

  if (!start_number || station_id === undefined || raw_value === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Startnummer, Stations-ID und Messwert sind erforderlich.'
    });
  }

  const student = db
    .prepare('SELECT * FROM students WHERE start_number = ?')
    .get(String(start_number).trim()) as { id: number; first_name: string; last_name: string } | undefined;

  if (!student) {
    return res.status(404).json({
      success: false,
      message: `Teilnehmer mit Startnummer "${start_number}" nicht gefunden.`
    });
  }

  const station = db
    .prepare('SELECT * FROM stations WHERE id = ?')
    .get(station_id) as { min_val: number; max_val: number; name: string; unit: string } | undefined;

  if (!station) {
    return res.status(404).json({
      success: false,
      message: 'Station nicht gefunden.'
    });
  }

  const numValue = Number(raw_value);
  if (isNaN(numValue)) {
    return res.status(400).json({
      success: false,
      message: 'Der eingegebene Messwert ist keine gültige Zahl.'
    });
  }

  // Soft warning or boundary check
  if (numValue < station.min_val || numValue > station.max_val) {
    return res.status(422).json({
      success: false,
      message: `Unplausibler Wert: ${numValue} liegt außerhalb des erlaubten Bereichs (${station.min_val} - ${station.max_val}).`
    });
  }

  const insertStatement = db.prepare(`
    INSERT INTO results (student_id, station_id, raw_value, points, feedback_tags, helper_comment)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const points = numValue; // Points calculation can be augmented by scoring tables in Milestone 1/3
  const result = insertStatement.run(
    student.id,
    station_id,
    numValue,
    points,
    feedback_tags || '',
    helper_comment || ''
  );

  res.json({
    success: true,
    data: {
      id: result.lastInsertRowid,
      student_name: `${student.first_name} ${student.last_name}`,
      raw_value: numValue
    },
    message: 'Ergebnis erfolgreich gespeichert!'
  });
});

/**
 * Exports complete competition ranking and station results to Excel (.xlsx).
 */
resultsRouter.get('/export-excel', (_req: Request, res: Response) => {
  const db = getDatabaseManager().getDb();

  const students = db.prepare(`
    SELECT * FROM students ORDER BY CAST(start_number AS INTEGER) ASC
  `).all() as Array<{
    id: number;
    start_number: string;
    first_name: string;
    last_name: string;
    gender: string;
    birth_year: number;
    group_name: string;
  }>;

  const stations = db.prepare(`
    SELECT * FROM stations WHERE is_active = 1 ORDER BY id ASC
  `).all() as Array<{
    id: number;
    name: string;
    unit: string;
    sort_order: string;
  }>;

  const results = db.prepare('SELECT * FROM results').all() as Array<{
    student_id: number;
    station_id: number;
    raw_value: number;
  }>;

  // Build matrix for Excel export
  const exportRows = students.map((student) => {
    const row: Record<string, string | number> = {
      Startnummer: student.start_number,
      Nachname: student.last_name,
      Vorname: student.first_name,
      Geschlecht: student.gender,
      Geburtsjahr: student.birth_year,
      Klasse: student.group_name
    };

    for (const station of stations) {
      const studentStationResults = results.filter(
        (r) => r.student_id === student.id && r.station_id === station.id
      );

      if (studentStationResults.length > 0) {
        // Pick best result according to sort_order
        const bestVal =
          station.sort_order === 'lower_is_better'
            ? Math.min(...studentStationResults.map((r) => r.raw_value))
            : Math.max(...studentStationResults.map((r) => r.raw_value));

        row[`${station.name} (${station.unit})`] = bestVal;
      } else {
        row[`${station.name} (${station.unit})`] = '-';
      }
    }

    return row;
  });

  const buffer = ExcelService.generateResultsExportBuffer(exportRows);
  const fileName = `GymScore_Auswertung_${new Date().toISOString().slice(0, 10)}.xlsx`;

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.send(buffer);
});

/**
 * Deletes an erroneous result entry.
 */
resultsRouter.delete('/:id', (req: Request, res: Response) => {
  const db = getDatabaseManager().getDb();
  const { id } = req.params;

  db.prepare('DELETE FROM results WHERE id = ?').run(id);
  res.json({ success: true, message: 'Ergebnis gelöscht.' });
});
