"use client";

import { useState } from "react";
import { assessmentConfig } from "@/lib/assessment/config";
import { AssessmentState } from "@/lib/assessment/types";

export default function AssessmentPage() {
  const totalQuestions = assessmentConfig.questions.length;
  const totalSteps = totalQuestions + 2; // +1 for q15-notes, +1 for email capture

  const [state, setState] = useState<AssessmentState>({
    answers: {},
    otherText: {},
    currentStep: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const isNotesStep = state.currentStep === totalQuestions;
  const isEmailStep = state.currentStep === totalQuestions + 1;
  const currentQuestion = !isNotesStep && !isEmailStep
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

  const handleOtherTextChange = (questionId: string, text: string) => {
    setState((prev) => ({
      ...prev,
      otherText: {
        ...prev.otherText,
        [questionId]: text,
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

  const handleNotesChange = (notes: string) => {
    setState((prev) => ({ ...prev, notes }));
  };

  const handleSubmit = async () => {
    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || "";
    const webhookTestUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_TEST_URL || "";

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

      return {
        questionId: question.id,
        questionText: question.text,
        answerId: selectedOption?.answerId || "",
        answerText: selectedOption?.label || "",
        isScored: question.isScored,
      };
    });

    // Create raw answers mapping with answerId (A, B, C, D, E)
    const rawAnswers: Record<string, string> = {};
    assessmentConfig.questions.forEach((question) => {
      const selectedOptionId = state.answers[question.id];
      const selectedOption = question.options.find(
        (opt) => opt.id === selectedOptionId
      );
      if (selectedOption) {
        rawAnswers[question.id] = selectedOption.answerId;
      }
    });

    // Only include otherText if user selected "Other" options and provided text
    const hasOtherText = Object.keys(state.otherText).some(
      (key) => state.otherText[key]?.trim()
    );

    const payload: Record<string, unknown> = {
      assessment_version: "v2",
      email: state.email,
      timestamp: new Date().toISOString(),
      rawAnswers,
      answers: formattedAnswers,
      freeText: {
        "q15-notes": state.notes || "",
      },
    };

    // Only add otherText if there's actual content
    if (hasOtherText) {
      payload.otherText = state.otherText;
    }

    try {
      // Send to both webhooks in parallel
      const webhookPromises = [
        fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        })
      ];

      // Add test webhook if configured
      if (webhookTestUrl) {
        webhookPromises.push(
          fetch(webhookTestUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          })
        );
      }

      const responses = await Promise.all(webhookPromises);

      // Check if main webhook succeeded
      if (!responses[0].ok) {
        throw new Error(`HTTP error! status: ${responses[0].status}`);
      }

      console.log("Assessment submitted successfully:", state);
      setIsSubmitted(true);
    } catch (error) {
      console.error("Error submitting assessment:", error);
      alert("There was an error submitting your assessment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = isEmailStep
    ? state.email && state.email.includes("@")
    : isNotesStep
    ? true // Notes is optional
    : currentQuestion && state.answers[currentQuestion.id];

  const progress = ((state.currentStep + 1) / totalSteps) * 100;

  // Show thank you page after submission
  if (isSubmitted) {
    return (
      <main className="min-h-screen py-8 px-4 flex items-center justify-center" style={{ backgroundColor: '#193050' }}>
        <div className="max-w-2xl w-full mx-auto">
          <div className="rounded-lg shadow-md p-8 sm:p-12 text-center" style={{ backgroundColor: '#E1E4E9' }}>
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#6BB790' }}>
                <svg className="w-8 h-8" style={{ color: '#E1E4E9' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: '#193050' }}>
                Thank You!
              </h1>
              <p className="text-lg" style={{ color: '#193050' }}>
                Your assessment has been submitted successfully.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-4 sm:py-8 px-4 flex items-center" style={{ backgroundColor: '#193050' }}>
      <div className="max-w-md sm:max-w-lg w-full mx-auto">
        {/* Progress Bar */}
        <div className="mb-4 sm:mb-6">
          <div className="flex justify-between text-xs mb-2" style={{ color: '#E1E4E9' }}>
            <span>
              Step {state.currentStep + 1} of {totalSteps}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full rounded-full h-2" style={{ backgroundColor: '#193050' }}>
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, backgroundColor: '#D8B743' }}
            />
          </div>
        </div>

        {/* Question, Notes, or Email Capture */}
        <div className="rounded-lg shadow-md p-5 sm:p-6" style={{ backgroundColor: '#FBFCFC' }}>
          {currentQuestion ? (
            <>
              <div className="mb-4">
                <span className="inline-block px-2.5 py-0.5 text-xs font-medium rounded-full mb-2.5" style={{ backgroundColor: '#D8B743', color: '#193050' }}>
                  {
                    assessmentConfig.pillars.find(
                      (p) => p.id === currentQuestion.pillar
                    )?.name
                  }
                </span>
                <h2 className="text-base sm:text-lg font-bold leading-snug" style={{ color: '#193050' }}>
                  {currentQuestion.text}
                </h2>
              </div>

              <div className="space-y-2.5">
                {currentQuestion.options.map((option) => {
                  const isSelected =
                    state.answers[currentQuestion.id] === option.id;
                  return (
                    <div key={option.id}>
                      <button
                        onClick={() => handleAnswer(option.id)}
                        className="w-full text-left p-3 rounded-lg border-2 transition-all text-sm"
                        style={{
                          borderColor: isSelected ? '#D8B743' : '#DFE3E9',
                          backgroundColor: isSelected ? '#FEF9EC' : '#FBFCFC',
                        }}
                      >
                        <div className="flex items-start">
                          <div
                            className="w-4 h-4 rounded-full border-2 mr-2.5 flex-shrink-0 flex items-center justify-center mt-0.5"
                            style={{
                              borderColor: isSelected ? '#D8B743' : '#193050',
                              backgroundColor: isSelected ? '#D8B743' : 'transparent',
                            }}
                          >
                            {isSelected && (
                              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#193050' }} />
                            )}
                          </div>
                          <span
                            className={isSelected ? 'font-medium' : ''}
                            style={{ color: '#193050' }}
                          >
                            {option.label}
                          </span>
                        </div>
                      </button>
                      {/* Show text input for "Other" options when selected */}
                      {option.hasTextInput && isSelected && (
                        <div className="mt-2 ml-6">
                          <textarea
                            value={state.otherText[currentQuestion.id] || ""}
                            onChange={(e) => handleOtherTextChange(currentQuestion.id, e.target.value)}
                            placeholder="Please specify..."
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg outline-none resize-none border-2 text-sm"
                            style={{
                              borderColor: '#DFE3E9',
                              backgroundColor: '#FBFCFC',
                              color: '#193050',
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#D8B743'}
                            onBlur={(e) => e.target.style.borderColor = '#DFE3E9'}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : isNotesStep ? (
            <>
              <div className="mb-5">
                <h2 className="text-lg sm:text-xl font-bold mb-2" style={{ color: '#193050' }}>
                  Is there anything else you&apos;d like us to know?
                </h2>
                <p className="text-sm" style={{ color: '#193050' }}>
                  Please share any additional information that might help us understand your needs better (optional).
                </p>
              </div>

              <div className="mb-5">
                <textarea
                  id="notes"
                  value={state.notes || ""}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder="Any additional comments, concerns, or context you'd like to share..."
                  rows={5}
                  className="w-full px-3 py-2.5 rounded-lg outline-none resize-none border-2 text-sm"
                  style={{
                    borderColor: '#DFE3E9',
                    backgroundColor: '#FBFCFC',
                    color: '#193050',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#D8B743'}
                  onBlur={(e) => e.target.style.borderColor = '#DFE3E9'}
                />
              </div>
            </>
          ) : (
            <>
              <div className="mb-5">
                <h2 className="text-lg sm:text-xl font-bold mb-2" style={{ color: '#193050' }}>
                  Get Your Results
                </h2>
                <p className="text-sm" style={{ color: '#193050' }}>
                  Enter your email to receive your assessment report.
                </p>
              </div>

              <div className="mb-5">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-2"
                  style={{ color: '#193050' }}
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={state.email || ""}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2.5 rounded-lg outline-none border-2 text-sm"
                  style={{
                    borderColor: '#DFE3E9',
                    backgroundColor: '#FBFCFC',
                    color: '#193050',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#D8B743'}
                  onBlur={(e) => e.target.style.borderColor = '#DFE3E9'}
                />
              </div>
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-5 gap-3">
          <button
            onClick={handleBack}
            disabled={state.currentStep === 0}
            className="px-5 py-2.5 font-medium rounded-lg border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            style={{
              color: state.currentStep === 0 ? '#E1E4E9' : '#E1E4E9',
              borderColor: state.currentStep === 0 ? '#193050' : '#E1E4E9',
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              if (state.currentStep !== 0) {
                e.currentTarget.style.backgroundColor = '#3DB2DD';
                e.currentTarget.style.borderColor = '#3DB2DD';
              }
            }}
            onMouseLeave={(e) => {
              if (state.currentStep !== 0) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = '#E1E4E9';
              }
            }}
          >
            Back
          </button>

          {isEmailStep ? (
            <button
              onClick={handleSubmit}
              disabled={!canProceed || isSubmitting}
              className="px-5 py-2.5 font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              style={{
                backgroundColor: canProceed && !isSubmitting ? '#D8B743' : '#193050',
                color: canProceed && !isSubmitting ? '#193050' : '#E1E4E9',
              }}
              onMouseEnter={(e) => {
                if (canProceed && !isSubmitting) {
                  e.currentTarget.style.backgroundColor = '#3DB2DD';
                }
              }}
              onMouseLeave={(e) => {
                if (canProceed && !isSubmitting) {
                  e.currentTarget.style.backgroundColor = '#D8B743';
                }
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canProceed}
              className="px-5 py-2.5 font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              style={{
                backgroundColor: canProceed ? '#D8B743' : '#193050',
                color: canProceed ? '#193050' : '#E1E4E9',
              }}
              onMouseEnter={(e) => {
                if (canProceed) {
                  e.currentTarget.style.backgroundColor = '#3DB2DD';
                }
              }}
              onMouseLeave={(e) => {
                if (canProceed) {
                  e.currentTarget.style.backgroundColor = '#D8B743';
                }
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
