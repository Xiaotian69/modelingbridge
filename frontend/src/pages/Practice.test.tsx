// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup,fireEvent,render,screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach,expect,it } from 'vitest';
import { PracticePage } from './Practice';
import { PRACTICE_KEY,save } from '../learning/storage';
afterEach(()=>{cleanup();localStorage.clear();});
it('retries previous mistakes and retains feedback after a corrected attempt',()=>{
  save(PRACTICE_KEY,{'practice-1':{correct:false,attempts:1,updated:'today'}});
  render(<MemoryRouter><PracticePage/></MemoryRouter>);
  fireEvent.click(screen.getByRole('button',{name:'错题重练'}));
  expect(screen.getAllByRole('button',{name:'提交答案'})).toHaveLength(1);
  fireEvent.change(screen.getByLabelText('你的数值答案'),{target:{value:'2600'}});
  fireEvent.click(screen.getByRole('button',{name:'提交答案'}));
  expect(screen.getByText('回答正确')).toBeInTheDocument();
  expect(screen.getByText('待重练 0 题')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'错题重练'}));
  expect(screen.getByText(/当前筛选下没有待练题目/)).toBeInTheDocument();
});
