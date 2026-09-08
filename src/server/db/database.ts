import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

export interface IStudent {
  id?: number;
  start_number: string;
  first_name: string;
  last_name: string;
  gender: 'M' | 'W' | 'D' | 'm' | 'w' | 'd';
  birth_year: number;
  group_name: string;
  notes?: string;
  created_at?: string;
}

export interface IStation {
  id?: number;
  name: string;
  unit: 'seconds' | 'cm' | 'reps' | 'score';
  sort_order: 'higher_is_better' | 'lower_is_better';
  min_val: number;
  max_val: number;
  is_active?: number;
  created_at?: string;
}

export interface IResult {
  id?: number;
  student_id: number;
  station_id: number;
  raw_value: number;
  points: number;
  feedback_tags?: string;
  helper_comment?: string;
  recorded_at?: string;
}

const DEFAULT_DB_PATH = path.resolve(process.cwd(), 'data', 'gymscore.db');

/**
 * Manages the SQLite database connection, schema setup, and default seed data.
 */
export class DatabaseManager {
  private _db: Database.Database;

  /**
   * Initializes the database instance and ensures directory existence.
   */
  constructor(dbPath: string = DEFAULT_DB_PATH) {
    const parentDir = path.dirname(dbPath);

    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    this._db = new Database(dbPath);
    this._db.pragma('journal_mode = WAL');
    this._db.pragma('foreign_keys = ON');

    this._initializeSchema();
    this._seedDefaultData();
  }

  /**
   * Returns the underlying better-sqlite3 database handle.
   */
  public getDb(): Database.Database {
    return this._db;
  }

  /**
   * Reads and executes the schema definition if tables are absent.
   */
  private _initializeSchema(): void {
    const candidatePaths = [
      path.resolve(__dirname, 'schema.sql'),
      path.resolve(__dirname, '../../src/server/db/schema.sql'),
      path.resolve(process.cwd(), 'src/server/db/schema.sql')
    ];

    let schemaSql = '';
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        schemaSql = fs.readFileSync(p, 'utf8');
        break;
      }
    }

    if (!schemaSql) {
      // Robust inline fallback
      schemaSql = `
        CREATE TABLE IF NOT EXISTS students (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          start_number TEXT NOT NULL UNIQUE,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          gender TEXT CHECK(gender IN ('M', 'W', 'D', 'm', 'w', 'd')) NOT NULL,
          birth_year INTEGER NOT NULL,
          group_name TEXT NOT NULL DEFAULT '',
          notes TEXT DEFAULT '',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS stations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          unit TEXT NOT NULL CHECK(unit IN ('seconds', 'cm', 'reps', 'score')),
          sort_order TEXT NOT NULL CHECK(sort_order IN ('higher_is_better', 'lower_is_better')),
          min_val REAL NOT NULL DEFAULT 0,
          max_val REAL NOT NULL DEFAULT 9999,
          is_active INTEGER NOT NULL DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS results (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          student_id INTEGER NOT NULL,
          station_id INTEGER NOT NULL,
          raw_value REAL NOT NULL,
          points REAL NOT NULL DEFAULT 0,
          feedback_tags TEXT DEFAULT '',
          helper_comment TEXT DEFAULT '',
          recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
          FOREIGN KEY (station_id) REFERENCES stations (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_students_start_number ON students (start_number);
        CREATE INDEX IF NOT EXISTS idx_results_student_id ON results (student_id);
        CREATE INDEX IF NOT EXISTS idx_results_station_id ON results (station_id);
        CREATE INDEX IF NOT EXISTS idx_results_recorded_at ON results (recorded_at);
      `;
    }

    this._db.exec(schemaSql);
  }

  /**
   * Seeds sensible default stations and system settings when empty.
   */
  private _seedDefaultData(): void {
    const stationCount = (
      this._db.prepare('SELECT COUNT(*) AS count FROM stations').get() as { count: number }
    ).count;

    if (stationCount === 0) {
      this._insertDefaultStations();
    }

    this._insertDefaultSettings();
  }

  /**
   * Inserts standard athletic school assessment stations.
   */
  private _insertDefaultStations(): void {
    const insertStation = this._db.prepare(`
      INSERT INTO stations (name, unit, sort_order, min_val, max_val, is_active)
      VALUES (@name, @unit, @sort_order, @min_val, @max_val, @is_active)
    `);

    const defaultStations: IStation[] = [
      {
        name: '20m Sprint',
        unit: 'seconds',
        sort_order: 'lower_is_better',
        min_val: 2.0,
        max_val: 15.0,
        is_active: 1
      },
      {
        name: 'Standweitsprung',
        unit: 'cm',
        sort_order: 'higher_is_better',
        min_val: 50.0,
        max_val: 350.0,
        is_active: 1
      },
      {
        name: 'Medizinballstoßen (1kg)',
        unit: 'cm',
        sort_order: 'higher_is_better',
        min_val: 100.0,
        max_val: 1500.0,
        is_active: 1
      },
      {
        name: 'Gewandtheitslauf / Agility',
        unit: 'seconds',
        sort_order: 'lower_is_better',
        min_val: 5.0,
        max_val: 45.0,
        is_active: 1
      }
    ];

    const transaction = this._db.transaction((stations: IStation[]) => {
      for (const station of stations) {
        insertStation.run(station);
      }
    });

    transaction(defaultStations);
  }

  /**
   * Inserts essential default configuration key-values.
   */
  private _insertDefaultSettings(): void {
    const insertSetting = this._db.prepare(`
      INSERT OR IGNORE INTO settings (key, value)
      VALUES (?, ?)
    `);

    insertSetting.run('event_title', 'Sport-Eignungstest 2026');
    insertSetting.run('server_port', '3000');
    insertSetting.run('organization_name', 'Sport-Mittelschule');
  }

  /**
   * Closes the database safely.
   */
  public close(): void {
    if (this._db.open) {
      this._db.close();
    }
  }
}

let dbInstance: DatabaseManager | null = null;

/**
 * Returns a singleton instance of the DatabaseManager.
 */
export function getDatabaseManager(customPath?: string): DatabaseManager {
  if (!dbInstance) {
    dbInstance = new DatabaseManager(customPath);
  }

  return dbInstance;
}
