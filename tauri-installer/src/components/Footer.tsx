import { useInstallerStore } from "../store/installer";

interface FooterProps {
  onNext?: () => void;
  onPrev?: () => void;
  nextLabel?: string;
  prevLabel?: string;
  nextDisabled?: boolean;
  hideNext?: boolean;
  hidePrev?: boolean;
  leftExtra?: React.ReactNode;
}

export default function Footer({
  onNext,
  onPrev,
  nextLabel = "Next",
  prevLabel = "Previous",
  nextDisabled = false,
  hideNext = false,
  hidePrev = false,
  leftExtra,
}: FooterProps) {
  const { nextStep, prevStep, currentStep } = useInstallerStore();

  const handlePrev = onPrev ?? prevStep;
  const handleNext = onNext ?? nextStep;

  return (
    <>
      <div className="footer-left">
        <StepIndicator />
        {leftExtra}
      </div>
      <div className="footer-right">
        {!hidePrev && currentStep > 0 && (
          <button className="btn btn-secondary" onClick={handlePrev}>
            <ChevronLeft />
            {prevLabel}
          </button>
        )}
        {!hideNext && (
          <button
            className="btn btn-primary"
            onClick={handleNext}
            disabled={nextDisabled}
          >
            {nextLabel}
            <ChevronRight />
          </button>
        )}
      </div>
    </>
  );
}

function StepIndicator() {
  const { currentStep } = useInstallerStore();
  const total = 12;

  return (
    <div className="step-indicator">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`step-dot ${
            i === currentStep ? "active" : i < currentStep ? "done" : ""
          }`}
        />
      ))}
    </div>
  );
}

function ChevronLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
