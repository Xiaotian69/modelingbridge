// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render,screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect,it } from 'vitest';
import { LearnPage } from './Learn';
it('separates reading, practice, and open competition training',()=>{
  render(<MemoryRouter><LearnPage/></MemoryRouter>);
  expect(screen.getByRole('link',{name:'开始精讲'})).toHaveAttribute('href','/learn/linear-programming');
  expect(screen.getByRole('link',{name:'进入专项练习'})).toHaveAttribute('href','/practice/linear-programming');
  expect(screen.getByRole('link',{name:'进入七关实战'})).toHaveAttribute('href','/quest');
});
