// src/context/ExamTimerContext.js
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useRef,
  useCallback,
} from "react";

// Check if running in a browser environment
const isBrowser = typeof window !== "undefined";

const ExamTimerContext = createContext({
  // Provide a default shape to prevent destructuring errors even if Provider fails
  elapsedTime: 0,
  formattedTime: "00:00:00",
  resetTimer: () => {
    console.warn("Reset timer called before Provider initialized");
  },
});

// Helper function for localStorage keys
const getStartTimeKey = (examId) => `examStartTime_${examId}`;

export const ExamTimerProvider = ({ children, currentExamId }) => {
  const [elapsedTime, setElapsedTime] = useState(0); // Time in seconds
  const intervalRef = useRef(null); // To hold interval ID
  const examIdRef = useRef(currentExamId); // Keep track of the active exam
  const [isClientInitialized, setIsClientInitialized] = useState(false); // Track client hydration

  // Function to start or resume the timer
  const startOrResumeTimer = useCallback((examId) => {
    // ----> GUARD: Only run localStorage logic in browser <----
    if (!isBrowser || !examId) {
      console.log("Skipping timer start/resume (SSR or no examId)");
      return;
    }

    const startTimeKey = getStartTimeKey(examId);
    let startTime = localStorage.getItem(startTimeKey);

    if (!startTime) {
      // If no start time exists, start a new timer
      startTime = Date.now().toString();
      localStorage.setItem(startTimeKey, startTime);
      setElapsedTime(0); // Start from 0
      console.log(`Timer started for exam ${examId}`);
    } else {
      // If start time exists, calculate initial elapsed time
      const initialElapsed = Math.floor(
        (Date.now() - parseInt(startTime, 10)) / 1000
      );
      setElapsedTime(initialElapsed >= 0 ? initialElapsed : 0); // Ensure non-negative
      console.log(`Timer resumed for exam ${examId} at ${initialElapsed}s`);
    }

    // Clear any existing interval before starting a new one
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Start the interval to update time every second
    intervalRef.current = setInterval(() => {
      if (!isBrowser) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        return;
      }

      const currentStartTime = localStorage.getItem(startTimeKey); // Re-read in case it was cleared
      if (currentStartTime) {
        setElapsedTime(
          Math.floor((Date.now() - parseInt(currentStartTime, 10)) / 1000)
        );
      } else {
        // Stop if start time is missing (e.g., finished exam)
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setElapsedTime(0);
      }
    }, 1000);
  }, []); // Empty dependency array - function itself doesn't change

  // Effect to start timer when the provider mounts or examId changes
  useEffect(() => {
    // Mark that client has initialized
    setIsClientInitialized(true);

    // If there's a currentExamId passed, ensure the timer is running for it
    if (currentExamId) {
      // If the exam ID changed, potentially reset timer for the new exam
      if (examIdRef.current !== currentExamId) {
        console.log(
          `Exam ID changed from ${examIdRef.current} to ${currentExamId}. Restarting timer logic.`
        );
        // Clear old interval if it exists
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        examIdRef.current = currentExamId; // Update the ref
        setElapsedTime(0); // Reset display initially
        startOrResumeTimer(currentExamId); // Start/resume for the new ID
      } else if (!intervalRef.current) {
        // If same exam ID but interval isn't running (e.g. after hot reload), start/resume
        startOrResumeTimer(currentExamId);
      }
    } else {
      // If no currentExamId (e.g., navigating away from exam), clear interval
      if (intervalRef.current) {
        console.log("No current exam ID, clearing interval.");
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        // We might not want to reset elapsedTime here, depends on desired UX
      }
      examIdRef.current = null;
    }

    // Cleanup function to clear interval when the provider unmounts
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log("ExamTimerProvider unmounting, cleared interval.");
      }
    };
  }, [currentExamId, startOrResumeTimer]); // Rerun if examId changes

  // Function to stop and reset the timer (e.g., on finish)
  const resetTimer = useCallback((examId) => {
    // ----> GUARD: Only run localStorage logic in browser <----
    if (!isBrowser || !examId) return;

    if (!examId) return;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    const startTimeKey = getStartTimeKey(examId);
    localStorage.removeItem(startTimeKey);
    setElapsedTime(0); // Reset display
    examIdRef.current = null; // Clear tracked exam ID
    console.log(`Timer reset and cleared for exam ${examId}`);
  }, []);

  // Format elapsed time into HH:MM:SS
  const formatTime = (totalSeconds) => {
    if (totalSeconds < 0) totalSeconds = 0; // Handle potential negative values briefly
    const hours = Math.floor(totalSeconds / 3600)
      .toString()
      .padStart(2, "0");
    const minutes = Math.floor((totalSeconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  // Provide the state, ensuring formattedTime is always a string
  const value = {
    elapsedTime,
    formattedTime: formatTime(elapsedTime),
    resetTimer,
  };

  return (
    <ExamTimerContext.Provider value={value}>
      {children}
    </ExamTimerContext.Provider>
  );
};

// Hook to use the context
export const useExamTimer = () => useContext(ExamTimerContext);
