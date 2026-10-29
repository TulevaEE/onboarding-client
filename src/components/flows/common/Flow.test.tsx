import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Flow, FlowStep } from './Flow';

const steps: FlowStep[] = [
  { path: 'first', Component: () => <p>First step</p>, title: 'First' },
  { path: 'second', Component: () => <p>Second step</p>, title: 'Second' },
  { path: 'third', Component: () => <p>Third step</p>, title: 'Third' },
];

const flowAt = (lastPartOfPath: string) => (
  <MemoryRouter initialEntries={[`/flow/${lastPartOfPath}`]}>
    <Flow steps={steps} flowPath="/flow" lastPartOfPath={lastPartOfPath} />
  </MemoryRouter>
);

describe('Flow', () => {
  test('keeps every step title in place as the flow moves on, updating it rather than replacing it', () => {
    const { rerender } = render(flowAt('first'));
    const titles = ['First', 'Second', 'Third'].map((title) => screen.getByText(title));

    rerender(flowAt('second'));

    titles.forEach((title) => expect(title).toBeInTheDocument());
    expect(screen.getByText('Second')).toHaveClass('h2');
    expect(screen.getByText('First')).not.toHaveClass('h2');
  });
});
