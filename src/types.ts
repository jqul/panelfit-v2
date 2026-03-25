export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'super_admin' | 'trainer' | 'client';
  approved?: boolean;
  trainerId?: string; // For clients
  createdAt: number;
}

export interface ClientData {
  id: string;
  name: string;
  surname: string;
  weight: number;
  fatPercentage: number;
  muscleMass: number;
  totalLifted: number;
  planDescription: string;
  trainerId: string;
  token: string;
  createdAt: number;
}

export interface Exercise {
  name: string;
  sets: string;
  weight: string;
  isMain: boolean;
  comment: string;
  videoUrl?: string;
}

export interface DayPlan {
  title: string;
  focus: string;
  exercises: Exercise[];
}

export interface WeekPlan {
  label: string;
  rpe: string;
  isCurrent: boolean;
  startDate?: string;
  endDate?: string;
  days: DayPlan[];
}

export interface TrainingPlan {
  clientId: string;
  weeks: WeekPlan[];
  type: string;
  restMain: number;
  restAcc: number;
  restWarn: number;
  message?: string;
  audioUrl?: string;
  audioTitle?: string;
}

export interface LogSet {
  weight: string;
  reps: string;
  timestamp?: string;
}

export interface ExerciseLog {
  sets: { [key: number]: LogSet };
  done: boolean;
  note?: string;
  dateDone?: string;
  videoB64?: string;
}

export interface TrainingLogs {
  [key: string]: ExerciseLog; // key format: ex_w{weekIndex}_d{dayIndex}_r{exerciseIndex}
}

export interface WeightLog {
  id: string;
  clientId: string;
  weight: number;
  fatPercentage?: number;
  date: string;
}

export interface Habit {
  id: string;
  clientId: string;
  text: string;
  sub: string;
  order: number;
}

export interface HabitLog {
  clientId: string;
  date: string;
  completedHabitIds: string[];
}

export interface DietPlan {
  clientId: string;
  kcal: number;
  protein: number;
  carbs: number;
  fats: number;
  meals: {
    time: string;
    name: string;
    kcal: number;
    items: string[];
  }[];
  advice?: string;
}

export interface ProgressPhoto {
  id: string;
  clientId: string;
  date: string;
  frontUrl?: string;
  backUrl?: string;
  sideUrl?: string;
}
