import React from "react";
import { useInstallerStore } from "../store/installer";

interface LayoutProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  step?: number;
  totalSteps?: number;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function Layout({
  icon,
  title,
  subtitle,
  step,
  totalSteps = 12,
  children,
  footer,
}: LayoutProps) {
  const { currentStep } = useInstallerStore();
  const activeStep = step ?? currentStep;
  const progress = ((activeStep + 1) / totalSteps) * 100;

  return (
    <div className="installer-card">
      {/* Progress strip */}
      <div className="progress-strip">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Header */}
      <div className="card-header">
        <div className="step-icon">{icon}</div>
        <div className="step-title">{title}</div>
        {subtitle && <div className="step-subtitle">{subtitle}</div>}
      </div>

      {/* Content */}
      <div className="card-content page-enter">{children}</div>

      {/* Footer */}
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
}
