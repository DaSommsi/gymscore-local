import * as XLSX from 'xlsx';
import { IStudent } from '../db/database';

export interface IParsedStudentRow {
  startNumber: string;
  firstName: string;
  lastName: string;
  gender: 'M' | 'W' | 'D';
  birthYear: number;
  groupName: string;
  notes?: string;
}

export interface IImportValidationResult {
  validStudents: IParsedStudentRow[];
  errors: Array<{ rowNumber: number; reason: string }>;
  totalRowsProcessed: number;
}

/**
 * Service to parse incoming student rosters and generate Excel reports.
 */
export class ExcelService {
  /**
   * Reads an uploaded Excel buffer or file path and parses student rows.
   */
  public static parseStudentRoster(fileBuffer: Buffer): IImportValidationResult {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, {
      defval: ''
    });

    const validStudents: IParsedStudentRow[] = [];
    const errors: Array<{ rowNumber: number; reason: string }> = [];

    rawRows.forEach((row, index) => {
      const rowNumber = index + 2; // Account for 1-indexed Excel header
      const parsed = this._validateAndNormalizeRow(row);

      if (parsed.success && parsed.data) {
        validStudents.push(parsed.data);
      } else {
        errors.push({ rowNumber, reason: parsed.error || 'Ungültige Zeile' });
      }
    });

    return {
      validStudents,
      errors,
      totalRowsProcessed: rawRows.length
    };
  }

  /**
   * Validates individual row fields and normalizes naming variations.
   */
  private static _validateAndNormalizeRow(
    row: Record<string, unknown>
  ): { success: boolean; data?: IParsedStudentRow; error?: string } {
    const startNumber = String(
      row['Startnummer'] ?? row['Start-Nr'] ?? row['Start-Nr.'] ?? row['Startnr'] ?? ''
    ).trim();

    const firstName = String(row['Vorname'] ?? '').trim();
    const lastName = String(row['Nachname'] ?? '').trim();
    const rawGender = String(row['Geschlecht'] ?? '').trim().toUpperCase();
    const rawBirthYear = Number(row['Geburtsjahr'] ?? row['Jahrgang'] ?? 0);
    const groupName = String(row['Gruppe'] ?? row['Klasse'] ?? '').trim();
    const notes = String(row['Notizen'] ?? row['Bemerkung'] ?? '').trim();

    if (!startNumber) {
      return { success: false, error: 'Startnummer fehlt' };
    }

    if (!firstName || !lastName) {
      return { success: false, error: 'Vor- oder Nachname fehlt' };
    }

    const gender = this._normalizeGender(rawGender);
    if (!gender) {
      return { success: false, error: 'Ungültiges Geschlecht (erlaubt: M, W, D)' };
    }

    if (isNaN(rawBirthYear) || rawBirthYear < 1950 || rawBirthYear > 2030) {
      return { success: false, error: 'Ungültiges Geburtsjahr' };
    }

    return {
      success: true,
      data: {
        startNumber,
        firstName,
        lastName,
        gender,
        birthYear: rawBirthYear,
        groupName,
        notes
      }
    };
  }

  /**
   * Normalizes gender representations to M, W, or D.
   */
  private static _normalizeGender(value: string): 'M' | 'W' | 'D' | null {
    if (['M', 'MÄNNLICH', 'MALE', 'JUNGE'].includes(value)) return 'M';
    if (['W', 'WEIBLICH', 'FEMALE', 'MÄDCHEN', 'F'].includes(value)) return 'W';
    if (['D', 'DIVERS'].includes(value)) return 'D';
    return null;
  }

  /**
   * Generates a starter Excel template workbook buffer for schools.
   */
  public static generateTemplateBuffer(): Buffer {
    const templateRows = [
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
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Teilnehmerliste');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * Exports comprehensive results with student data and station metrics.
   */
  public static generateResultsExportBuffer(
    resultsData: Record<string, string | number>[]
  ): Buffer {
    const worksheet = XLSX.utils.json_to_sheet(resultsData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ergebnisse');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}
