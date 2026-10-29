import React, { createContext, ReactNode, RefObject, useContext } from 'react';
import { ChapterHead } from './ChapterHead';
import { StepId } from './steps';

const EmbeddedStepContext = createContext(false);

export const SectionTitle = ({
  id,
  className,
  children,
}: {
  id?: string;
  className: string;
  children: ReactNode;
}) => {
  const Heading = useContext(EmbeddedStepContext) ? 'h5' : 'h3';
  return (
    <Heading id={id} className={className}>
      {children}
    </Heading>
  );
};

interface Props {
  step: StepId;
  headingId: string;
  headingRef?: RefObject<HTMLHeadingElement>;
  kicker: ReactNode;
  title: ReactNode;
  isEmbedded?: boolean;
  children: ReactNode;
}

export const StepSection = ({
  step,
  headingId,
  headingRef,
  kicker,
  title,
  isEmbedded = false,
  children,
}: Props) => {
  if (isEmbedded) {
    return (
      <EmbeddedStepContext.Provider value>
        <div className="step-body">{children}</div>
      </EmbeddedStepContext.Provider>
    );
  }
  return (
    <section className="chapter card p-4" aria-labelledby={headingId}>
      <ChapterHead step={step}>
        <p className="chapter-kicker">{kicker}</p>
        <h2 id={headingId} className="text-balance" tabIndex={-1} ref={headingRef}>
          {title}
        </h2>
      </ChapterHead>
      {children}
    </section>
  );
};
