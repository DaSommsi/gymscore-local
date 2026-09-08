-- GymScore Local SQLite Schema
-- Designed for offline single-file embedded storage

PRAGMA foreign_keys = ON;

-- Students / Participants table
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

-- Assessment stations (e.g. 20m sprint, standing long jump, agility test)
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

-- Recorded assessment results per student and station
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

-- System settings & key-value configuration store
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for high-frequency live search and lookup queries
CREATE INDEX IF NOT EXISTS idx_students_start_number ON students (start_number);
CREATE INDEX IF NOT EXISTS idx_results_student_id ON results (student_id);
CREATE INDEX IF NOT EXISTS idx_results_station_id ON results (station_id);
CREATE INDEX IF NOT EXISTS idx_results_recorded_at ON results (recorded_at);
