import { expect, it } from 'vitest';
import { objectiveSegment } from './chartGeometry';
it('deduplicates plot corners so the objective line does not collapse',()=>{
  expect(objectiveSegment(80,20,2400)).toEqual([[0,120],[30,0]]);
});
it('handles horizontal, vertical and zero objectives',()=>{
  expect(objectiveSegment(0,50,2000)).toEqual([[0,40],[120,40]]);
  expect(objectiveSegment(40,0,2000)).toEqual([[50,0],[50,120]]);
  expect(objectiveSegment(0,0,0)).toEqual([]);
});
