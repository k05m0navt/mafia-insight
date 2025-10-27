'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import type { UserFriendlyError } from './error-mapping';

/**
 * Error context state
 */
interface ErrorContextState {
  errors: UserFriendlyError[];
  isRetrying: boolean;
  retryCount: number;
}

/**
 * Error context actions
 */
type ErrorContextAction =
  | { type: 'ADD_ERROR'; payload: UserFriendlyError }
  | { type: 'REMOVE_ERROR'; payload: string }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'SET_RETRYING'; payload: boolean }
  | { type: 'INCREMENT_RETRY_COUNT' }
  | { type: 'RESET_RETRY_COUNT' };

/**
 * Error context value
 */
interface ErrorContextValue {
  state: ErrorContextState;
  addError: (error: UserFriendlyError) => void;
  removeError: (errorCode: string) => void;
  clearErrors: () => void;
  setRetrying: (isRetrying: boolean) => void;
  incrementRetryCount: () => void;
  resetRetryCount: () => void;
}

/**
 * Error context reducer
 */
function errorReducer(
  state: ErrorContextState,
  action: ErrorContextAction
): ErrorContextState {
  switch (action.type) {
    case 'ADD_ERROR':
      return {
        ...state,
        errors: [
          ...state.errors.filter((e) => e.code !== action.payload.code),
          action.payload,
        ],
      };
    case 'REMOVE_ERROR':
      return {
        ...state,
        errors: state.errors.filter((e) => e.code !== action.payload),
      };
    case 'CLEAR_ERRORS':
      return {
        ...state,
        errors: [],
      };
    case 'SET_RETRYING':
      return {
        ...state,
        isRetrying: action.payload,
      };
    case 'INCREMENT_RETRY_COUNT':
      return {
        ...state,
        retryCount: state.retryCount + 1,
      };
    case 'RESET_RETRY_COUNT':
      return {
        ...state,
        retryCount: 0,
      };
    default:
      return state;
  }
}

/**
 * Error context
 */
const ErrorContext = createContext<ErrorContextValue | undefined>(undefined);

/**
 * Error context provider
 */
interface ErrorProviderProps {
  children: ReactNode;
}

export function ErrorProvider({ children }: ErrorProviderProps) {
  const [state, dispatch] = useReducer(errorReducer, {
    errors: [],
    isRetrying: false,
    retryCount: 0,
  });

  const addError = (error: UserFriendlyError) => {
    dispatch({ type: 'ADD_ERROR', payload: error });
  };

  const removeError = (errorCode: string) => {
    dispatch({ type: 'REMOVE_ERROR', payload: errorCode });
  };

  const clearErrors = () => {
    dispatch({ type: 'CLEAR_ERRORS' });
  };

  const setRetrying = (isRetrying: boolean) => {
    dispatch({ type: 'SET_RETRYING', payload: isRetrying });
  };

  const incrementRetryCount = () => {
    dispatch({ type: 'INCREMENT_RETRY_COUNT' });
  };

  const resetRetryCount = () => {
    dispatch({ type: 'RESET_RETRY_COUNT' });
  };

  const value: ErrorContextValue = {
    state,
    addError,
    removeError,
    clearErrors,
    setRetrying,
    incrementRetryCount,
    resetRetryCount,
  };

  return (
    <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>
  );
}

/**
 * Hook to use error context
 */
export function useErrorContext() {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useErrorContext must be used within an ErrorProvider');
  }
  return context;
}

/**
 * Hook to get current errors
 */
export function useErrors() {
  const { state } = useErrorContext();
  return state.errors;
}

/**
 * Hook to get retry state
 */
export function useRetryState() {
  const { state } = useErrorContext();
  return {
    isRetrying: state.isRetrying,
    retryCount: state.retryCount,
  };
}
