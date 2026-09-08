import { Router, Request, Response } from 'express';
import { getDatabaseManager, IStation } from '../db/database';

export const stationsRouter = Router();

/**
 * Lists all stations along with current result count.
 */
stationsRouter.get('/', (_req: Request, res: Response) => {
  const db = getDatabaseManager().getDb();

  const stations = db.prepare(`
    SELECT s.*, 
      (SELECT COUNT(DISTINCT student_id) FROM results WHERE station_id = s.id) AS completed_students_count,
      (SELECT COUNT(*) FROM results WHERE station_id = s.id) AS total_results_count
    FROM stations s
    ORDER BY s.id ASC
  `).all();

  res.json({ success: true, data: stations });
});

/**
 * Creates a new sports assessment station.
 */
stationsRouter.post('/', (req: Request, res: Response) => {
  const db = getDatabaseManager().getDb();
  const { name, unit, sort_order, min_val, max_val, is_active } = req.body;

  if (!name || !unit || !sort_order) {
    return res.status(400).json({
      success: false,
      message: 'Pflichtfelder fehlen (Name, Einheit, Sortierung).'
    });
  }

  try {
    const statement = db.prepare(`
      INSERT INTO stations (name, unit, sort_order, min_val, max_val, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = statement.run(
      name.trim(),
      unit,
      sort_order,
      Number(min_val ?? 0),
      Number(max_val ?? 9999),
      is_active !== undefined ? Number(is_active) : 1
    );

    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Datenbankfehler';
    res.status(400).json({ success: false, message: errorMessage });
  }
});

/**
 * Updates an existing station's settings.
 */
stationsRouter.put('/:id', (req: Request, res: Response) => {
  const db = getDatabaseManager().getDb();
  const { id } = req.params;
  const { name, unit, sort_order, min_val, max_val, is_active } = req.body;

  try {
    const statement = db.prepare(`
      UPDATE stations 
      SET name = ?, unit = ?, sort_order = ?, min_val = ?, max_val = ?, is_active = ?
      WHERE id = ?
    `);

    statement.run(
      name.trim(),
      unit,
      sort_order,
      Number(min_val),
      Number(max_val),
      Number(is_active ?? 1),
      id
    );

    res.json({ success: true, message: 'Station erfolgreich aktualisiert.' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Datenbankfehler';
    res.status(400).json({ success: false, message: errorMessage });
  }
});

/**
 * Deletes a station if needed.
 */
stationsRouter.delete('/:id', (req: Request, res: Response) => {
  const db = getDatabaseManager().getDb();
  const { id } = req.params;

  db.prepare('DELETE FROM stations WHERE id = ?').run(id);
  res.json({ success: true, message: 'Station erfolgreich gelöscht.' });
});
