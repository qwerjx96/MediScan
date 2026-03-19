import type { FrequencyType } from '../types';

export const FREQUENCY_LABELS: Record<FrequencyType, string> = {
  once_daily: 'Once daily',
  twice_daily: 'Twice daily',
  three_times_daily: 'Three times daily',
  four_times_daily: 'Four times daily',
  every_x_hours: 'Every X hours',
  weekly: 'Weekly',
  as_needed: 'As needed',
};

/** Number of doses per day (null = variable / user-defined) */
export const FREQUENCY_DOSE_COUNT: Record<FrequencyType, number | null> = {
  once_daily: 1,
  twice_daily: 2,
  three_times_daily: 3,
  four_times_daily: 4,
  every_x_hours: null,
  weekly: 1,
  as_needed: null,
};
