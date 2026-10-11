// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it } from 'vitest';
import { CoursePage } from './Course';
afterEach(cleanup);
it('moves keyboard focus into the requested chapter section',()=>{
  render(<MemoryRouter initialEntries={['/learn/linear-programming#python']}><CoursePage/></MemoryRouter>);
  expect(document.getElementById('python')).toHaveFocus();
});
