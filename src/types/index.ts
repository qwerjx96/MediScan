// ─── Drug / Medicine ──────────────────────────────────────────────────────────

export type FrequencyType =
  | 'once_daily'
  | 'twice_daily'
  | 'three_times_daily'
  | 'four_times_daily'
  | 'every_x_hours'
  | 'weekly'
  | 'as_needed';

export interface DrugInfo {
  /** INN / generic name, lower-cased */
  inn: string;
  brandNames: string[];
  /** Plain-text indications */
  indications: string;
  /** Plain-text side effects */
  sideEffects: string;
  /** ISO 3166-1 alpha-2 country code → approval status */
  approvalStatus: Record<string, string>;
  /** Source label for attribution */
  source: string;
}

// ─── Cabinet ──────────────────────────────────────────────────────────────────

export interface Medication {
  id: string;
  inn: string;
  brandName?: string;
  dosage: string;
  frequency: FrequencyType;
  /** HH:MM strings for each daily dose */
  times: string[];
  /** ISO date string */
  startDate: string;
  /** ISO date string or undefined for ongoing */
  endDate?: string;
  notes?: string;
  color: string;
}

// ─── Schedule / dose logs ─────────────────────────────────────────────────────

export interface DoseLog {
  id: string;
  medicationId: string;
  /** ISO datetime */
  scheduledAt: string;
  /** ISO datetime or null if not taken */
  takenAt: string | null;
  status: 'taken' | 'missed' | 'skipped';
}

// ─── Scanner ──────────────────────────────────────────────────────────────────

export type ScannerStep =
  | 'idle'
  | 'capturing'
  | 'ocr'
  | 'nlm'
  | 'gemini'
  | 'done'
  | 'error';

export interface ScanResult {
  rawText: string;
  candidateINN: string | null;
  confidence: 'high' | 'medium' | 'low';
  method: 'ocr+nlm' | 'gemini' | 'manual';
}
