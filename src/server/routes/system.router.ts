import { Router, Request, Response } from 'express';
import { getDatabaseManager } from '../db/database';
import { NetworkService } from '../services/network.service';

export const systemRouter = Router();

/**
 * Returns current LAN network connection details and QR codes.
 */
systemRouter.get('/network', async (req: Request, res: Response) => {
  try {
    const port = Number(process.env.PORT || 3000);
    const networkInfo = await NetworkService.getNetworkInfo(port);

    res.json({ success: true, data: networkInfo });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Netzwerkfehler';
    res.status(500).json({ success: false, message });
  }
});

/**
 * Returns overall competition metrics and database summary.
 */
systemRouter.get('/status', (_req: Request, res: Response) => {
  const db = getDatabaseManager().getDb();

  const studentCount = (
    db.prepare('SELECT COUNT(*) AS count FROM students').get() as { count: number }
  ).count;

  const stationCount = (
    db.prepare('SELECT COUNT(*) AS count FROM stations WHERE is_active = 1').get() as { count: number }
  ).count;

  const resultCount = (
    db.prepare('SELECT COUNT(*) AS count FROM results').get() as { count: number }
  ).count;

  res.json({
    success: true,
    data: {
      studentCount,
      stationCount,
      resultCount,
      timestamp: new Date().toISOString()
    }
  });
});

/**
 * Returns stored system configuration settings.
 */
systemRouter.get('/settings', (_req: Request, res: Response) => {
  const db = getDatabaseManager().getDb();
  const settingsRows = db.prepare('SELECT key, value FROM settings').all() as Array<{
    key: string;
    value: string;
  }>;

  const settings: Record<string, string> = {};
  for (const row of settingsRows) {
    settings[row.key] = row.value;
  }

  res.json({ success: true, data: settings });
});

/**
 * Updates a configuration setting.
 */
systemRouter.post('/settings', (req: Request, res: Response) => {
  const db = getDatabaseManager().getDb();
  const { key, value } = req.body;

  if (!key || value === undefined) {
    return res.status(400).json({ success: false, message: 'Schlüssel und Wert erforderlich.' });
  }

  db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `).run(key, String(value));

  res.json({ success: true, message: 'Einstellung gespeichert.' });
});
