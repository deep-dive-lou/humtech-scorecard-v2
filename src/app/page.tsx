"use client";

import { useEffect, useState } from "react";
import { assessmentConfig } from "@/lib/assessment/config";
import { AssessmentState } from "@/lib/assessment/types";

export default function AssessmentPage() {
  const NAVY_LIGHT = "#122845";
  const CARD_BG = "#122845";
  const SURFACE_BG = "#FBFCFC";
  const FIELD_BG = "#FBFCFC";
  const FIELD_BORDER = "#DFE3E9";
  const BORDER_SOFT = "rgba(255, 255, 255, 0.26)";
  const TEXT_ON_DARK = "#EAF0F7";
  const MUTED_ON_DARK = "#AFC0D6";
  const GOLD = "#D8B743";
  const GOLD_HOVER = "#C7A233";
  const HOVER_DARK = "#1C3558";
  const totalQuestions = assessmentConfig.questions.length;
  const totalSteps = totalQuestions + 2; // +1 for q16_additional_notes, +1 for email capture

  const [state, setState] = useState<AssessmentState>({
    answers: {},
    multiSelectAnswers: {},
    otherText: {},
    currentStep: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Let host pages auto-resize the iframe to avoid nested scrolling.
  useEffect(() => {
    const emitHeight = () => {
      if (window.parent === window) return;
      const mainEl = document.querySelector("main");
      const mainRectHeight = mainEl
        ? Math.ceil(mainEl.getBoundingClientRect().height)
        : 0;

      const docHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight
      );

      // On mobile, scrollHeight can collapse to viewport height and create extra dead space.
      // Prefer the real rendered form height when it is available.
      const height = Math.max(mainRectHeight, docHeight > window.innerHeight ? docHeight : 0);
      window.parent.postMessage(
        { type: "humtech-scorecard-height", height },
        "*"
      );
    };

    emitHeight();
    const observer = new ResizeObserver(emitHeight);
    observer.observe(document.body);
    window.addEventListener("resize", emitHeight);
    window.addEventListener("load", emitHeight);

    // Re-emit after layout settles (fonts/host transitions can shift height).
    const t1 = window.setTimeout(emitHeight, 80);
    const t2 = window.setTimeout(emitHeight, 300);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", emitHeight);
      window.removeEventListener("load", emitHeight);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [state.currentStep, isSubmitting, isSubmitted]);

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

  const handleMultiSelectAnswer = (optionId: string) => {
    if (!currentQuestion) return;

    setState((prev) => {
      const currentSelections = prev.multiSelectAnswers[currentQuestion.id] || [];
      const isSelected = currentSelections.includes(optionId);

      return {
        ...prev,
        multiSelectAnswers: {
          ...prev.multiSelectAnswers,
          [currentQuestion.id]: isSelected
            ? currentSelections.filter((id) => id !== optionId)
            : [...currentSelections, optionId],
        },
      };
    });
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

  const handleNameChange = (name: string) => {
    setState((prev) => ({ ...prev, name }));
  };

  const handleCompanyChange = (company: string) => {
    setState((prev) => ({ ...prev, company }));
  };

  const handleMobileChange = (mobile: string) => {
    setState((prev) => ({ ...prev, mobile }));
  };

  const handleTitleChange = (title: string) => {
    setState((prev) => ({ ...prev, title }));
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
      if (question.isMultiSelect) {
        // Handle multi-select questions
        const selectedOptionIds = state.multiSelectAnswers[question.id] || [];
        const selectedOptions = selectedOptionIds
          .map((optId) => question.options.find((opt) => opt.id === optId))
          .filter((opt): opt is NonNullable<typeof opt> => opt !== undefined);

        return {
          questionId: question.id,
          questionText: question.text,
          answerId: selectedOptions.map((opt) => opt.answerId),
          answerText: selectedOptions.map((opt) => opt.label),
          isScored: question.isScored,
        };
      } else {
        // Handle single-select questions
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
      }
    });

    // Create raw answers mapping with answerId (A, B, C, D, E, F)
    // For multi-select questions, value is an array of answerIds
    const rawAnswers: Record<string, string | string[]> = {};
    assessmentConfig.questions.forEach((question) => {
      if (question.isMultiSelect) {
        // Handle multi-select questions
        const selectedOptionIds = state.multiSelectAnswers[question.id] || [];
        const selectedAnswerIds = selectedOptionIds
          .map((optId) => {
            const option = question.options.find((opt) => opt.id === optId);
            return option?.answerId;
          })
          .filter((id): id is NonNullable<typeof id> => id !== undefined);
        rawAnswers[question.id] = selectedAnswerIds;
      } else {
        // Handle single-select questions
        const selectedOptionId = state.answers[question.id];
        const selectedOption = question.options.find(
          (opt) => opt.id === selectedOptionId
        );
        if (selectedOption) {
          rawAnswers[question.id] = selectedOption.answerId;
        }
      }
    });

    // Only include otherText if user selected "Other" options and provided text
    const hasOtherText = Object.keys(state.otherText).some(
      (key) => state.otherText[key]?.trim()
    );

    const payload: Record<string, unknown> = {
      assessment_version: "v2",
      contact: {
        name: state.name,
        email: state.email,
        company: state.company,
        mobile: state.mobile || "",
        title: state.title || "",
      },
      timestamp: new Date().toISOString(),
      rawAnswers,
      answers: formattedAnswers,
      freeText: {
        "q16_additional_notes": state.notes || "",
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

      // Get the response from n8n (could be HTML or a URL)
      const responseText = await responses[0].text();

      // Check if response is a URL or HTML content
      if (responseText.startsWith('http://') || responseText.startsWith('https://')) {
        // If it's a URL, open it in a new tab
        window.open(responseText.trim(), '_blank');
      } else if (responseText.trim()) {
        // If it's HTML content, open in a new tab and write the content
        const newTab = window.open('', '_blank');
        if (newTab) {
          newTab.document.write(responseText);
          newTab.document.close();
        }
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
    ? state.email && state.email.includes("@") && state.name && state.name.trim() && state.company && state.company.trim() && state.mobile && state.mobile.trim()
    : isNotesStep
    ? true // Notes is optional
    : currentQuestion && (
        currentQuestion.isMultiSelect
          ? (state.multiSelectAnswers[currentQuestion.id]?.length ?? 0) > 0
          : state.answers[currentQuestion.id]
      );

  const progress = ((state.currentStep + 1) / totalSteps) * 100;

  // Show thank you page after submission
  if (isSubmitted) {
    return (
      <main className="w-full py-4 sm:py-8 px-3 sm:px-4 flex items-center justify-center">
        <div className="max-w-2xl w-full mx-auto rounded-[24px] p-5 sm:p-7 shadow-lg" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER_SOFT}` }}>
          <div className="rounded-lg p-6 sm:p-8 text-center" style={{ backgroundColor: SURFACE_BG, border: `1px solid ${BORDER_SOFT}` }}>
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#6BB790' }}>
                <svg className="w-8 h-8" style={{ color: SURFACE_BG }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: TEXT_ON_DARK }}>
                Thank You!
              </h1>
              <p className="text-lg" style={{ color: MUTED_ON_DARK }}>
                Your assessment has been submitted successfully. Your results will open in a new tab and be emailed to you.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full py-4 sm:py-6 px-3 sm:px-4 flex justify-center">
      <div className="w-full max-w-3xl rounded-[24px] p-5 sm:p-7 shadow-lg" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER_SOFT}` }}>
        {/* Progress Bar */}
        <div className="mb-3 sm:mb-4">
          <div className="flex justify-between text-xs mb-2" style={{ color: TEXT_ON_DARK }}>
            <span>
              Step {state.currentStep + 1} of {totalSteps}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full rounded-full h-2" style={{ backgroundColor: 'rgba(255,255,255,0.20)' }}>
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, backgroundColor: GOLD }}
            />
          </div>
        </div>

        {/* Question, Notes, or Email Capture */}
        <div className="rounded-lg p-4 sm:p-5" style={{ backgroundColor: SURFACE_BG, border: `1px solid ${FIELD_BORDER}` }}>
          {currentQuestion ? (
            <>
              <div className="mb-4">
                <span className="inline-block px-2.5 py-0.5 text-xs font-medium rounded-full mb-2.5" style={{ backgroundColor: '#D8B743', color: NAVY_LIGHT }}>
                  {
                    assessmentConfig.pillars.find(
                      (p) => p.id === currentQuestion.pillar
                    )?.name
                  }
                </span>
                <h2 className="text-base sm:text-lg font-bold leading-snug" style={{ color: NAVY_LIGHT }}>
                  {currentQuestion.text}
                </h2>
              </div>

              <div className="space-y-2.5">
                {currentQuestion.options.map((option) => {
                  const isSelected = currentQuestion.isMultiSelect
                    ? state.multiSelectAnswers[currentQuestion.id]?.includes(option.id) ?? false
                    : state.answers[currentQuestion.id] === option.id;
                  const handleClick = currentQuestion.isMultiSelect
                    ? () => handleMultiSelectAnswer(option.id)
                    : () => handleAnswer(option.id);
                  return (
                    <div key={option.id}>
                      <button
                        onClick={handleClick}
                        className="w-full text-left p-3 rounded-lg border-2 transition-all text-sm"
                        style={{
                          borderColor: isSelected ? GOLD : FIELD_BORDER,
                          backgroundColor: isSelected ? '#FEF9EC' : FIELD_BG,
                        }}
                      >
                        <div className="flex items-start">
                          {currentQuestion.isMultiSelect ? (
                            // Checkbox for multi-select
                            <div
                              className="w-4 h-4 rounded border-2 mr-2.5 flex-shrink-0 flex items-center justify-center mt-0.5"
                              style={{
                                borderColor: isSelected ? GOLD : NAVY_LIGHT,
                                backgroundColor: isSelected ? GOLD : 'transparent',
                              }}
                            >
                              {isSelected && (
                                <svg className="w-3 h-3" style={{ color: NAVY_LIGHT }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          ) : (
                            // Radio button for single-select
                            <div
                              className="w-4 h-4 rounded-full border-2 mr-2.5 flex-shrink-0 flex items-center justify-center mt-0.5"
                              style={{
                                borderColor: isSelected ? GOLD : NAVY_LIGHT,
                                backgroundColor: isSelected ? GOLD : 'transparent',
                              }}
                            >
                              {isSelected && (
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: NAVY_LIGHT }} />
                              )}
                            </div>
                          )}
                          <span
                            className={isSelected ? 'font-medium' : ''}
                            style={{ color: NAVY_LIGHT }}
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
                              borderColor: FIELD_BORDER,
                              backgroundColor: FIELD_BG,
                              color: NAVY_LIGHT,
                            }}
                            onFocus={(e) => e.target.style.borderColor = GOLD}
                            onBlur={(e) => e.target.style.borderColor = FIELD_BORDER}
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
                <h2 className="text-lg sm:text-xl font-bold mb-2" style={{ color: NAVY_LIGHT }}>
                  Is there anything else you&apos;d like us to know?
                </h2>
                <p className="text-sm" style={{ color: NAVY_LIGHT }}>
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
                    borderColor: FIELD_BORDER,
                    backgroundColor: FIELD_BG,
                    color: NAVY_LIGHT,
                  }}
                  onFocus={(e) => e.target.style.borderColor = GOLD}
                  onBlur={(e) => e.target.style.borderColor = FIELD_BORDER}
                />
              </div>
            </>
          ) : (
            <>
              <div className="mb-5">
                <h2 className="text-lg sm:text-xl font-bold mb-2" style={{ color: NAVY_LIGHT }}>
                  Get Your Results
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium mb-2"
                    style={{ color: NAVY_LIGHT }}
                  >
                    Name <span style={{ color: '#D8B743' }}>*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={state.name || ""}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="John Smith"
                    className="w-full px-3 py-2.5 rounded-lg outline-none border-2 text-sm"
                    style={{
                      borderColor: FIELD_BORDER,
                      backgroundColor: FIELD_BG,
                      color: NAVY_LIGHT,
                    }}
                    onFocus={(e) => e.target.style.borderColor = GOLD}
                    onBlur={(e) => e.target.style.borderColor = FIELD_BORDER}
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium mb-2"
                    style={{ color: NAVY_LIGHT }}
                  >
                    Email Address <span style={{ color: '#D8B743' }}>*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={state.email || ""}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3 py-2.5 rounded-lg outline-none border-2 text-sm"
                    style={{
                      borderColor: FIELD_BORDER,
                      backgroundColor: FIELD_BG,
                      color: NAVY_LIGHT,
                    }}
                    onFocus={(e) => e.target.style.borderColor = GOLD}
                    onBlur={(e) => e.target.style.borderColor = FIELD_BORDER}
                  />
                </div>

                <div>
                  <label
                    htmlFor="company"
                    className="block text-sm font-medium mb-2"
                    style={{ color: NAVY_LIGHT }}
                  >
                    Company <span style={{ color: '#D8B743' }}>*</span>
                  </label>
                  <input
                    type="text"
                    id="company"
                    value={state.company || ""}
                    onChange={(e) => handleCompanyChange(e.target.value)}
                    placeholder="Acme Inc."
                    className="w-full px-3 py-2.5 rounded-lg outline-none border-2 text-sm"
                    style={{
                      borderColor: FIELD_BORDER,
                      backgroundColor: FIELD_BG,
                      color: NAVY_LIGHT,
                    }}
                    onFocus={(e) => e.target.style.borderColor = GOLD}
                    onBlur={(e) => e.target.style.borderColor = FIELD_BORDER}
                  />
                </div>

                <div>
                  <label
                    htmlFor="mobile"
                    className="block text-sm font-medium mb-2"
                    style={{ color: NAVY_LIGHT }}
                  >
                    Phone <span style={{ color: '#D8B743' }}>*</span>
                  </label>
                  <input
                    type="tel"
                    id="mobile"
                    value={state.mobile || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow numbers, spaces, hyphens, parentheses, and + at the start
                      const sanitized = value.replace(/[^\d\s\-+()]/g, '');
                      handleMobileChange(sanitized);
                    }}
                    placeholder="+44 20 7946 0958"
                    className="w-full px-3 py-2.5 rounded-lg outline-none border-2 text-sm"
                    style={{
                      borderColor: FIELD_BORDER,
                      backgroundColor: FIELD_BG,
                      color: NAVY_LIGHT,
                    }}
                    onFocus={(e) => e.target.style.borderColor = GOLD}
                    onBlur={(e) => e.target.style.borderColor = FIELD_BORDER}
                  />
                </div>

                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium mb-2"
                    style={{ color: NAVY_LIGHT }}
                  >
                    Job Title <span className="text-xs" style={{ color: '#6B7280' }}>(optional)</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={state.title || ""}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Head of Operations"
                    className="w-full px-3 py-2.5 rounded-lg outline-none border-2 text-sm"
                    style={{
                      borderColor: FIELD_BORDER,
                      backgroundColor: FIELD_BG,
                      color: NAVY_LIGHT,
                    }}
                    onFocus={(e) => e.target.style.borderColor = GOLD}
                    onBlur={(e) => e.target.style.borderColor = FIELD_BORDER}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-3 sm:mt-4 gap-3">
          <button
            onClick={handleBack}
            disabled={state.currentStep === 0}
            className="px-5 py-2.5 font-medium rounded-lg border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            style={{
              color: state.currentStep === 0 ? MUTED_ON_DARK : TEXT_ON_DARK,
              borderColor: state.currentStep === 0 ? "rgba(255,255,255,0.20)" : BORDER_SOFT,
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              if (state.currentStep !== 0) {
                e.currentTarget.style.backgroundColor = HOVER_DARK;
                e.currentTarget.style.borderColor = BORDER_SOFT;
              }
            }}
            onMouseLeave={(e) => {
              if (state.currentStep !== 0) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = BORDER_SOFT;
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
                backgroundColor: canProceed && !isSubmitting ? GOLD : 'rgba(255,255,255,0.18)',
                color: canProceed && !isSubmitting ? NAVY_LIGHT : MUTED_ON_DARK,
              }}
              onMouseEnter={(e) => {
                if (canProceed && !isSubmitting) {
                  e.currentTarget.style.backgroundColor = GOLD_HOVER;
                }
              }}
              onMouseLeave={(e) => {
                if (canProceed && !isSubmitting) {
                  e.currentTarget.style.backgroundColor = GOLD;
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
                backgroundColor: canProceed ? GOLD : 'rgba(255,255,255,0.18)',
                color: canProceed ? NAVY_LIGHT : MUTED_ON_DARK,
              }}
              onMouseEnter={(e) => {
                if (canProceed) {
                  e.currentTarget.style.backgroundColor = GOLD_HOVER;
                }
              }}
              onMouseLeave={(e) => {
                if (canProceed) {
                  e.currentTarget.style.backgroundColor = GOLD;
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
