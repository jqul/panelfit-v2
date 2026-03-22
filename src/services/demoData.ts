import { ClientData, TrainingPlan } from '../types';

export const DEMO_CLIENT: ClientData = {
  id: 'demo-client',
  name: 'Alex',
  surname: 'García',
  weight: 83.5,
  fatPercentage: 14.2,
  muscleMass: 68.1,
  totalLifted: 485,
  planDescription: 'Powerlifting · Progresión +2.5 kg/semana',
  trainerId: 'demo-trainer',
  token: 'demo-token',
  createdAt: Date.now(),
};

export const DEMO_PLAN: TrainingPlan = {
  clientId: 'demo-client',
  type: 'powerlifting',
  restMain: 180,
  restAcc: 90,
  restWarn: 30,
  weeks: [
    {
      label: 'Semana 3',
      rpe: '@8',
      isCurrent: true,
      days: [
        {
          title: 'LUNES — Empuje',
          focus: 'Sentadilla / Banca / Militar',
          exercises: [
            {
              name: 'Sentadilla',
              sets: '4×5',
              weight: '105 kg',
              isMain: true,
              comment: 'Mantén el pecho alto en el descenso.',
            },
            {
              name: 'Press banca',
              sets: '4×5',
              weight: '85 kg',
              isMain: true,
              comment: 'Codos a 45°, no los abras.',
            }
          ]
        }
      ]
    }
  ]
};
