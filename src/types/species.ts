/**
 * TypeScript types for species profiles and related data structures
 */

export interface SpeciesRange {
  ph: [number, number];
  temp: [number, number];
  do: [number, number];
  tds: [number, number];
  ntu: [number, number];
}

export interface CriticalRanges {
  ph?: [number, number];
  temp?: [number, number];
}

export interface FeedSchedule {
  times: string[];
  portions: string;
}

export interface CalibrationPresets {
  ph_offset: number;
  temp_offset: number;
  do_calibration: number;
}

export interface SpeciesProfile {
  id: string;
  name: string;
  icon: string;
  description: string;
  ranges: SpeciesRange;
  critical_ranges: CriticalRanges;
  feed_schedule: FeedSchedule;
  calibration_presets: CalibrationPresets;
}

export interface MergedRanges {
  ph: [number, number] | null;
  temp: [number, number] | null;
  do: [number, number] | null;
  tds: [number, number] | null;
  ntu: [number, number] | null;
}

export interface Conflict {
  metric: keyof SpeciesRange;
  species: string[];
  ranges: Array<[number, number]>;
  intersection: [number, number] | null;
}

export interface Recommendation {
  metric: keyof SpeciesRange;
  suggested_range: [number, number];
  reasoning: string;
}

export type Severity = 'ok' | 'warning' | 'critical';

export interface SpeciesWarning {
  speciesId: string;
  speciesName: string;
  speciesIcon: string;
  metric: keyof SpeciesRange;
  value: number;
  severity: Severity;
  message: string;
  recommendedAction?: string;
}

export interface TankProfile {
  selectedSpecies: string[];
  mergedRanges: MergedRanges;
  conflicts: Conflict[];
  recommendations: Recommendation[];
  calibrationPresets: CalibrationPresets;
}

