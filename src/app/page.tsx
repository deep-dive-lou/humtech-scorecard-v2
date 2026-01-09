"use client";

import { useState } from "react";
import { assessmentConfig } from "@/lib/assessment/config";
import { AssessmentState } from "@/lib/assessment/types";

export default function AssessmentPage() {
  const totalQuestions = assessmentConfig.questions.length;
  const totalSteps = totalQuestions + 2; // +1 for pain points, +1 for email capture

  const [state, setState] = useState<AssessmentState>({
    answers: {},
    currentStep: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPainPointsStep = state.currentStep === totalQuestions;
  const isEmailStep = state.currentStep === totalQuestions + 1;
  const currentQuestion = !isPainPointsStep && !isEmailStep
    ? assessmentConfig.questions[state.currentStep]
    : null;

  const handleAnswer = (optionId: string) => {
    if (!currentQuestion) return;

    setState((prev) => ({
      ...prev,
      answers: {
        ...prev.answers,
        [currentQuestion.id]: optionId,
      },
    }));
  };

  const handleNext = () => {
    if (state.currentStep < totalSteps - 1) {
      setState((prev) => ({ ...prev, currentStep: prev.currentStep + 1 }));
    }
  };

  const handleBack = () => {
    if (state.currentStep > 0) {
      setState((prev) => ({ ...prev, currentStep: prev.currentStep - 1 }));
    }
  };

  const handleEmailChange = (email: string) => {
    setState((prev) => ({ ...prev, email }));
  };

  const handlePainPointsChange = (painPoints: string) => {
    setState((prev) => ({ ...prev, painPoints }));
  };

  const handleSubmit = async () => {
    // TODO: Replace with your n8n webhook URL
    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || "";

    if (!webhookUrl) {
      console.error("N8N webhook URL not configured");
      alert("Configuration error. Please contact support.");
      return;
    }

    setIsSubmitting(true);

    // Transform answers to include full question and answer text
    const formattedAnswers = assessmentConfig.questions.map((question) => {
      const selectedOptionId = state.answers[question.id];
      const selectedOption = question.options.find(
        (opt) => opt.id === selectedOptionId
      );
      const pillar = assessmentConfig.pillars.find(
        (p) => p.id === question.pillar
      );

      return {
        questionId: question.id,
        questionText: question.text,
        pillar: pillar?.name || question.pillar,
        answerId: selectedOptionId,
        answerText: selectedOption?.label || "",
      };
    });

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: state.email,
          painPoints: state.painPoints || "",
          answers: formattedAnswers,
          rawAnswers: state.answers, // Keep raw data too for reference
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log("Assessment submitted successfully:", state);
      alert("Assessment submitted! Check your email for results.");
    } catch (error) {
      console.error("Error submitting assessment:", error);
      alert("There was an error submitting your assessment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = isEmailStep
    ? state.email && state.email.includes("@")
    : isPainPointsStep
    ? true // Pain points is optional
    : currentQuestion && state.answers[currentQuestion.id];

  const progress = ((state.currentStep + 1) / totalSteps) * 100;

  return (
    <main className="min-h-screen py-8 px-4" style={{ backgroundColor: '#18304F' }}>
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-2" style={{ color: '#DFE3E9' }}>
            <span>
              Step {state.currentStep + 1} of {totalSteps}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full rounded-full h-2" style={{ backgroundColor: '#19304F' }}>
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, backgroundColor: '#E8C34C' }}
            />
          </div>
        </div>

        {/* Question, Pain Points, or Email Capture */}
        <div className="rounded-lg shadow-md p-8" style={{ backgroundColor: '#FBFCFC' }}>
          {currentQuestion ? (
            <>
              <div className="mb-6">
                <span className="inline-block px-3 py-1 text-sm font-medium rounded-full mb-4" style={{ backgroundColor: '#E8C34C', color: '#18304F' }}>
                  {
                    assessmentConfig.pillars.find(
                      (p) => p.id === currentQuestion.pillar
                    )?.name
                  }
                </span>
                <h2 className="text-2xl font-bold" style={{ color: '#18304F' }}>
                  {currentQuestion.text}
                </h2>
              </div>

              <div className="space-y-3">
                {currentQuestion.options.map((option) => {
                  const isSelected =
                    state.answers[currentQuestion.id] === option.id;
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleAnswer(option.id)}
                      className="w-full text-left p-4 rounded-lg border-2 transition-all"
                      style={{
                        borderColor: isSelected ? '#E8C34C' : '#DFE3E9',
                        backgroundColor: isSelected ? '#FEF9EC' : '#FBFCFC',
                      }}
                    >
                      <div className="flex items-center">
                        <div
                          className="w-5 h-5 rounded-full border-2 mr-3 flex-shrink-0 flex items-center justify-center"
                          style={{
                            borderColor: isSelected ? '#E8C34C' : '#DFE3E9',
                            backgroundColor: isSelected ? '#E8C34C' : 'transparent',
                          }}
                        >
                          {isSelected && (
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#18304F' }} />
                          )}
                        </div>
                        <span
                          className={isSelected ? 'font-medium' : ''}
                          style={{ color: '#18304F' }}
                        >
                          {option.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : isPainPointsStep ? (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2" style={{ color: '#18304F' }}>
                  Tell Us About Your Challenges
                </h2>
                <p style={{ color: '#19304F' }}>
                  Please briefly bullet point your major inefficiency pain points or concerns (optional).
                </p>
                <p className="text-sm mt-2" style={{ color: '#6B7280' }}>
                  e.g. "We're slow to engage new leads", "We're concerned that we're behind on AI adoption and our competitors will pull ahead"
                </p>
              </div>

              <div className="mb-6">
                <label
                  htmlFor="painPoints"
                  className="block text-sm font-medium mb-2"
                  style={{ color: '#18304F' }}
                >
                  Pain Points & Concerns
                </label>
                <textarea
                  id="painPoints"
                  value={state.painPoints || ""}
                  onChange={(e) => handlePainPointsChange(e.target.value)}
                  placeholder="• We're slow to engage new leads&#10;• High manual workload on admin tasks&#10;• Concerned about competitors adopting AI faster"
                  rows={6}
                  className="w-full px-4 py-3 rounded-lg outline-none resize-none border-2"
                  style={{
                    borderColor: '#DFE3E9',
                    backgroundColor: '#FBFCFC',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#E8C34C'}
                  onBlur={(e) => e.target.style.borderColor = '#DFE3E9'}
                />
              </div>
            </>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2" style={{ color: '#18304F' }}>
                  Get Your Results
                </h2>
                <p style={{ color: '#19304F' }}>
                  Enter your email to receive your personalized assessment
                  report.
                </p>
              </div>

              <div className="mb-6">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-2"
                  style={{ color: '#18304F' }}
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={state.email || ""}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-lg outline-none border-2"
                  style={{
                    borderColor: '#DFE3E9',
                    backgroundColor: '#FBFCFC',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#E8C34C'}
                  onBlur={(e) => e.target.style.borderColor = '#DFE3E9'}
                />
              </div>
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            onClick={handleBack}
            disabled={state.currentStep === 0}
            className="px-6 py-3 font-medium rounded-lg border-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              color: state.currentStep === 0 ? '#DFE3E9' : '#FBFCFC',
              borderColor: state.currentStep === 0 ? '#19304F' : '#DFE3E9',
              backgroundColor: 'transparent',
            }}
          >
            Back
          </button>

          {isEmailStep ? (
            <button
              onClick={handleSubmit}
              disabled={!canProceed || isSubmitting}
              className="px-6 py-3 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: canProceed && !isSubmitting ? '#E8C34C' : '#D7B745',
                color: '#18304F',
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canProceed}
              className="px-6 py-3 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: canProceed ? '#E8C34C' : '#D7B745',
                color: '#18304F',
              }}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </main>
  );
}