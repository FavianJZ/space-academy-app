import { useReducer, useCallback } from 'react';
import type { GameState, GamePhase, NavigationRoute } from '../types/threejs-intro.types';

type GameAction = 
  | { type: 'SET_PHASE'; payload: GamePhase }
  | { type: 'SET_WARP_SPEED'; payload: number }
  | { type: 'SET_ALARM'; payload: boolean }
  | { type: 'SET_SHAKING'; payload: boolean }
  | { type: 'SELECT_ROUTE'; payload: NavigationRoute }
  | { type: 'RESET' };

const initialState: GameState = {
  kecepatanWarp: 0.2,
  isAlarmActive: false,
  isShaking: false,
  phase: 'idle',
};

const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'SET_PHASE':
      return { ...state, phase: action.payload };
    case 'SET_WARP_SPEED':
      return { ...state, kecepatanWarp: action.payload };
    case 'SET_ALARM':
      return { ...state, isAlarmActive: action.payload };
    case 'SET_SHAKING':
      return { ...state, isShaking: action.payload };
    case 'SELECT_ROUTE':
      return { ...state, selectedRoute: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
};

export const useIntroGameState = () => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const setPhase = useCallback((phase: GamePhase) => {
    dispatch({ type: 'SET_PHASE', payload: phase });
  }, []);

  const setWarpSpeed = useCallback((speed: number) => {
    dispatch({ type: 'SET_WARP_SPEED', payload: speed });
  }, []);

  const setAlarmActive = useCallback((active: boolean) => {
    dispatch({ type: 'SET_ALARM', payload: active });
  }, []);

  const setShaking = useCallback((shaking: boolean) => {
    dispatch({ type: 'SET_SHAKING', payload: shaking });
  }, []);

  const selectRoute = useCallback((route: NavigationRoute) => {
    dispatch({ type: 'SELECT_ROUTE', payload: route });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return {
    state,
    setPhase,
    setWarpSpeed,
    setAlarmActive,
    setShaking,
    selectRoute,
    reset,
  };
};
