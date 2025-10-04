/**
 * Type definitions for the scheduler component
 */

/**
 * Represents a time slot in the scheduler
 */
export interface Slot {
  /** Unique identifier for the slot */
  id: string;
  /** ID of the schedule this slot belongs to */
  scheduleId: string | number;
  /** ISO date string (YYYY-MM-DD) for this slot */
  date: string;
  /** Start time in 24-hour format (HH:mm) */
  startTime: string;
  /** End time in 24-hour format (HH:mm) */
  endTime: string;
  /** Whether this slot is an exception to the recurring schedule */
  isException: boolean;
  /** ID of the exception if this is an exception slot */
  exceptionId?: string | number;
}

/**
 * Represents a single day's data in the week view
 */
export interface WeekData {
  /** ISO date string for this day */
  date: string;
  /** Name of the day (Monday, Tuesday, etc.) */
  dayName: string;
  /** Day number (0 = Sunday, 6 = Saturday) */
  dayNumber: number;
  /** All slots for this day */
  slots: Slot[];
}

/**
 * Props for the slot form component
 */
export interface SlotFormProps {
  /** Callback when form is submitted */
  onSubmit: (data: { startTime: string; endTime: string }) => void;
  /** Callback when form is cancelled */
  onCancel: () => void;
  /** Whether the form is currently submitting */
  isLoading: boolean;
}

/**
 * Props for the slot modal component
 */
export interface SlotModalProps {
  /** The slot being edited */
  slot: Slot & { scheduleId: string; exceptionId?: string };
  /** Callback when modal is submitted */
  onSubmit: (data: { startTime: string; endTime: string }) => void;
  /** Callback when modal is cancelled */
  onCancel: () => void;
  /** Callback when slot is deleted */
  onDelete: () => void;
  /** Whether the modal is currently submitting */
  isLoading: boolean;
}
