import { calculateBmi, addMonths } from './bmi.util';

describe('bmi.util', () => {
  describe('calculateBmi', () => {
    it('calculates BMI for normal height/weight', () => {
      // 170cm, 70kg → BMI ≈ 24.2
      expect(calculateBmi(170, 70)).toBe(24.2);
    });

    it('rounds to one decimal', () => {
      expect(calculateBmi(180, 80)).toBe(24.7);
    });
  });

  describe('addMonths', () => {
    it('adds months to a date', () => {
      const start = new Date('2026-01-15');
      const end = addMonths(start, 3);
      expect(end.getFullYear()).toBe(2026);
      expect(end.getMonth()).toBe(3); // April (0-indexed)
    });
  });
});
