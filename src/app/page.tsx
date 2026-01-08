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

  const handleSubmit = () => {
    console.log("Assessment submitted:", state);
    // TODO: Submit to webhook
    alert("Assessment submitted! (Check console for data)");
  };

  const canProceed = isEmailStep
    ? state.email && state.email.includes("@")
    : isPainPointsStep
    ? true // Pain points is optional
    : currentQuestion && state.answers[currentQuestion.id];

  const progress = ((state.currentStep + 1) / totalSteps) * 100;

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>
              Step {state.currentStep + 1} of {totalSteps}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question, Pain Points, or Email Capture */}
        <div className="bg-white rounded-lg shadow-md p-8">
          {currentQuestion ? (
            <>
              <div className="mb-6">
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full mb-4">
                  {
                    assessmentConfig.pillars.find(
                      (p) => p.id === currentQuestion.pillar
                    )?.name
                  }
                </span>
                <h2 className="text-2xl font-bold text-gray-900">
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
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center">
                        <div
                          className={`w-5 h-5 rounded-full border-2 mr-3 flex-shrink-0 flex items-center justify-center ${
                            isSelected
                              ? "border-blue-600 bg-blue-600"
                              : "border-gray-300"
                          }`}
                        >
                          {isSelected && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                        <span
                          className={`${
                            isSelected
                              ? "text-gray-900 font-medium"
                              : "text-gray-700"
                          }`}
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
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Tell Us About Your Challenges
                </h2>
                <p className="text-gray-600">
                  Please briefly bullet point your major inefficiency pain points or concerns (optional).
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  e.g. "We're slow to engage new leads", "We're concerned that we're behind on AI adoption and our competitors will pull ahead"
                </p>
              </div>

              <div className="mb-6">
                <label
                  htmlFor="painPoints"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Pain Points & Concerns
                </label>
                <textarea
                  id="painPoints"
                  value={state.painPoints || ""}
                  onChange={(e) => handlePainPointsChange(e.target.value)}
                  placeholder="• We're slow to engage new leads&#10;• High manual workload on admin tasks&#10;• Concerned about competitors adopting AI faster"
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                />
              </div>
            </>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Get Your Results
                </h2>
                <p className="text-gray-600">
                  Enter your email to receive your personalized assessment
                  report.
                </p>
              </div>

              <div className="mb-6">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={state.email || ""}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
            className="px-6 py-3 text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Back
          </button>

          {isEmailStep ? (
            <button
              onClick={handleSubmit}
              disabled={!canProceed}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Submit Assessment
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canProceed}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </main>
  );
}