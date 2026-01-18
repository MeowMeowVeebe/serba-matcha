"use client";

import { useState, useEffect } from "react";
import { Button } from "./Button";

export type TourStep = {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector
  position?: "top" | "bottom" | "left" | "right";
  action?: () => void;
};

const DEFAULT_TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Matcha! 🎉",
    description: "Let's take a quick tour to help you get started with the dashboard.",
  },
  {
    id: "dashboard",
    title: "Dashboard Overview",
    description: "This is your main dashboard where you can see all key metrics and analytics at a glance.",
    target: ".dashboard-metrics",
    position: "bottom",
  },
  {
    id: "navigation",
    title: "Navigation Menu",
    description: "Use the sidebar to navigate between different sections like Users, Audit Logs, and RBAC.",
    target: "nav",
    position: "right",
  },
  {
    id: "search",
    title: "Global Search",
    description: "Press Cmd/Ctrl + K to open the command palette and quickly search or perform actions.",
    target: ".global-search",
    position: "bottom",
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "Stay updated with real-time notifications about important system events.",
    target: ".notification-center",
    position: "left",
  },
  {
    id: "theme",
    title: "Customize Your Theme",
    description: "Personalize your experience with different themes, colors, and font sizes.",
    target: ".theme-customizer",
    position: "left",
  },
];

export function OnboardingTour() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompletedTour, setHasCompletedTour] = useState(false);

  useEffect(() => {
    // Check if user has completed the tour
    const completed = localStorage.getItem("tour-completed");
    setHasCompletedTour(completed === "true");

    // Auto-start tour for first-time users after a short delay
    if (!completed) {
      const timer = setTimeout(() => {
        setIsActive(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const currentStepData = DEFAULT_TOUR_STEPS[currentStep];

  const handleNext = () => {
    if (currentStepData.action) {
      currentStepData.action();
    }

    if (currentStep < DEFAULT_TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setIsActive(false);
    setCurrentStep(0);
  };

  const completeTour = () => {
    localStorage.setItem("tour-completed", "true");
    setHasCompletedTour(true);
    setIsActive(false);
    setCurrentStep(0);
  };

  const restartTour = () => {
    setCurrentStep(0);
    setIsActive(true);
  };

  const getTargetPosition = () => {
    if (!currentStepData.target) return null;

    const element = document.querySelector(currentStepData.target);
    if (!element) return null;

    const rect = element.getBoundingClientRect();
    const position = currentStepData.position || "bottom";

    const tooltipWidth = 400;
    const tooltipHeight = 200;
    const offset = 20;

    let top = 0;
    let left = 0;

    switch (position) {
      case "top":
        top = rect.top - tooltipHeight - offset;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case "bottom":
        top = rect.bottom + offset;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case "left":
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - offset;
        break;
      case "right":
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + offset;
        break;
    }

    return {
      top: `${top}px`,
      left: `${left}px`,
      highlightRect: rect,
    };
  };

  const targetPosition = getTargetPosition();

  if (!isActive && hasCompletedTour) {
    return (
      <button
        onClick={restartTour}
        style={{
          position: "fixed",
          bottom: "1rem",
          right: "1rem",
          padding: "0.75rem 1rem",
          background: "var(--color-primary)",
          color: "white",
          border: "none",
          borderRadius: "0.5rem",
          cursor: "pointer",
          fontSize: "0.875rem",
          fontWeight: 600,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          zIndex: 1000,
        }}
        title="Restart Tour"
      >
        🎯 Take Tour Again
      </button>
    );
  }

  if (!isActive) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.7)",
          zIndex: 9997,
          animation: "fadeIn 0.3s ease-out",
        }}
      />

      {/* Highlight target element */}
      {targetPosition?.highlightRect && (
        <div
          style={{
            position: "fixed",
            top: `${targetPosition.highlightRect.top}px`,
            left: `${targetPosition.highlightRect.left}px`,
            width: `${targetPosition.highlightRect.width}px`,
            height: `${targetPosition.highlightRect.height}px`,
            border: "3px solid var(--color-primary)",
            borderRadius: "0.5rem",
            zIndex: 9998,
            pointerEvents: "none",
            animation: "pulse 2s infinite",
          }}
        />
      )}

      {/* Tour Tooltip */}
      <div
        style={{
          position: "fixed",
          top: targetPosition ? targetPosition.top : "50%",
          left: targetPosition ? targetPosition.left : "50%",
          transform: targetPosition ? "none" : "translate(-50%, -50%)",
          width: "400px",
          maxWidth: "calc(100vw - 2rem)",
          background: "white",
          borderRadius: "0.75rem",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.3)",
          zIndex: 9999,
          animation: "slideIn 0.3s ease-out",
        }}
      >
        <div style={{ padding: "1.5rem" }}>
          {/* Progress */}
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", gap: "0.25rem", marginBottom: "0.5rem" }}>
              {DEFAULT_TOUR_STEPS.map((_, index) => (
                <div
                  key={index}
                  style={{
                    flex: 1,
                    height: "4px",
                    background: index <= currentStep ? "var(--color-primary)" : "var(--color-gray-300)",
                    borderRadius: "2px",
                  }}
                />
              ))}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-gray-600)" }}>
              Step {currentStep + 1} of {DEFAULT_TOUR_STEPS.length}
            </div>
          </div>

          {/* Content */}
          <h3 style={{ margin: 0, marginBottom: "0.75rem", fontSize: "1.25rem" }}>
            {currentStepData.title}
          </h3>
          <p style={{ margin: 0, marginBottom: "1.5rem", color: "var(--color-gray-600)", lineHeight: 1.6 }}>
            {currentStepData.description}
          </p>

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Skip Tour
            </Button>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {currentStep > 0 && (
                <Button variant="secondary" size="sm" onClick={handlePrevious}>
                  Previous
                </Button>
              )}
              <Button variant="primary" size="sm" onClick={handleNext}>
                {currentStep === DEFAULT_TOUR_STEPS.length - 1 ? "Finish" : "Next"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.02);
          }
        }
      `}</style>
    </>
  );
}
