import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Brain, CheckCircle2, AlertCircle, ArrowRight, Trophy } from "lucide-react";
import { createPortal } from "react-dom";

export default function QuizModal({ isOpen, onClose, quizData, title }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  if (!isOpen || !quizData || quizData.length === 0) return null;

  const currentQuestion = quizData[currentStep];

  const handleOptionSelect = (index) => {
    if (isSubmitted) return;
    setSelectedOption(index);
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    if (selectedOption === currentQuestion.correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentStep < quizData.length - 1) {
      setCurrentStep(prev => prev + 1);
      setSelectedOption(null);
      setIsSubmitted(false);
    } else {
      setShowResult(true);
    }
  };

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 pointer-events-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-gray-900/90 backdrop-blur-md"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 40 }}
          className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-[#0F111A] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/10"
        >
          {/* Header - Sticky */}
          <div className="px-8 py-6 border-b border-gray-100 dark:border-white/5 bg-white/50 dark:bg-[#0F111A]/50 backdrop-blur-xl flex justify-between items-center sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-black text-gray-900 dark:text-white truncate max-w-[200px]">AI Knowledge Quiz</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{title}</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 text-gray-400 hover:text-red-500 rounded-xl transition-all border border-gray-100 dark:border-white/5 bg-white dark:bg-gray-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-8 flex-grow overflow-y-auto custom-scrollbar">
            {!showResult ? (
              <div className="space-y-6">
                {/* Progress Bar */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex-grow h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-indigo-600"
                      initial={{ width: 0 }}
                      animate={{ width: `${((currentStep + 1) / quizData.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-400">Question {currentStep + 1} of {quizData.length}</span>
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                  {currentQuestion.question}
                </h3>

                <div className="grid grid-cols-1 gap-3 mt-6">
                  {currentQuestion.options.map((option, index) => {
                    const isSelected = selectedOption === index;
                    const isCorrect = isSubmitted && index === currentQuestion.correctAnswer;
                    const isWrong = isSubmitted && isSelected && index !== currentQuestion.correctAnswer;

                    return (
                      <button
                        key={index}
                        onClick={() => handleOptionSelect(index)}
                        className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                          isSelected ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 shadow-lg" : 
                          "border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5"
                        } ${isCorrect ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10" : ""} ${
                          isWrong ? "border-red-500 bg-red-50/50 dark:bg-red-500/10" : ""
                        }`}
                      >
                        <span className={`text-sm font-medium ${isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-gray-600 dark:text-gray-300"}`}>{option}</span>
                        {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                        {isWrong && <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {isSubmitted && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-6 p-4 rounded-2xl border ${selectedOption === currentQuestion.correctAnswer ? "bg-emerald-50/30 border-emerald-100" : "bg-red-50/30 border-red-100"}`}
                  >
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Explanation</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{currentQuestion.explanation}</p>
                  </motion.div>
                )}

                <div className="mt-8 flex justify-end">
                  {!isSubmitted ? (
                    <button 
                      disabled={selectedOption === null}
                      onClick={handleSubmit}
                      className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all"
                    >
                      Submit Answer
                    </button>
                  ) : (
                    <button 
                      onClick={handleNext}
                      className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all"
                    >
                      {currentStep < quizData.length - 1 ? "Next Question" : "See Results"} <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 space-y-6">
                <div className="w-24 h-24 bg-amber-100 dark:bg-amber-500/10 rounded-full flex items-center justify-center mx-auto">
                  <Trophy className="w-12 h-12 text-amber-500" />
                </div>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white">Quiz Complete!</h3>
                <p className="text-lg text-gray-500">You scored <span className="font-black text-indigo-600">{score}</span> out of <span className="font-black">{quizData.length}</span></p>
                <button 
                  onClick={onClose}
                  className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl transition-all"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
