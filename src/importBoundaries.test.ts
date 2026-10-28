import { execFileSync } from 'child_process';
import path from 'path';

const ESLINT = path.join(process.cwd(), 'node_modules', 'eslint', 'bin', 'eslint.js');

type LintMessage = { ruleId: string | null };

const boundaryErrors = (filePath: string, importPath: string): LintMessage[] => {
  const output = (() => {
    try {
      return execFileSync(
        process.execPath,
        [ESLINT, '--stdin', '--stdin-filename', filePath, '--format', 'json'],
        { input: `import '${importPath}';\n`, encoding: 'utf8' },
      );
    } catch (error) {
      return (error as { stdout: string }).stdout;
    }
  })();
  const [result] = JSON.parse(output) as { messages: LintMessage[] }[];
  return result.messages.filter(({ ruleId }) => ruleId === 'no-restricted-imports');
};

describe('import boundaries', () => {
  jest.setTimeout(60_000);

  it('lets other features open the Tulevane Mina page', () => {
    expect(
      boundaryErrors('src/components/LoggedInApp/LoggedInApp.js', '../futureMe/FutureMe'),
    ).toEqual([]);
  });

  it('keeps the Tulevane Mina engine and steps out of other features', () => {
    expect(
      boundaryErrors(
        'src/components/pensionCalculator/calculation.ts',
        '../futureMe/engine/pension',
      ),
    ).toHaveLength(1);
    expect(
      boundaryErrors('src/components/millionaire/prefill.ts', '../futureMe/youAnswers'),
    ).toHaveLength(1);
  });

  it('lets Tulevane Mina use its own parts', () => {
    expect(boundaryErrors('src/components/futureMe/FutureMe.tsx', './engine/pension')).toEqual([]);
  });
});
