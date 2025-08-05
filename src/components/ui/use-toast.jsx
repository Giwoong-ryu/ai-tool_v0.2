// src/components/ui/use-toast.jsx
import * as React from "react";
// import { ToastAction } from "./toast"; // <-- 이제 toast.jsx에서 직접 내보내지 않음

const TOAST_LIMIT = 1; // 동시에 표시할 토스트 개수
const TOAST_REMOVE_DELAY = 1000000; // 토스트 제거 지연 시간 (자동 제거 안 함) - 거의 영구

let count = 0;
const genId = () => {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
};

const toast = (props) => {
  const id = genId();
  const newToast = { id, ...props };
  dispatch({ type: "ADD_TOAST", toast: newToast });
  return {
    id: newToast.id,
    dismiss: () => dispatch({ type: "DISMISS_TOAST", toastId: newToast.id }),
    update: (props) => dispatch({ type: "UPDATE_TOAST", toast: { ...newToast, ...props } }),
  };
};

function reducer(state, action) {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };
    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };
    case "DISMISS_TOAST":
      const { toastId } = action;
      if (toastId) {
        return {
          ...state,
          toasts: state.toasts.map((t) =>
            t.id === toastId ? { ...t, open: false } : t
          ),
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.open),
      };
    case "REMOVE_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
    default:
      throw new Error();
  }
}

const listeners = [];
let state = { toasts: [] };

function dispatch(action) {
  state = reducer(state, action);
  listeners.forEach((listener) => listener(state));
}

export function useToast() { // export 키워드 추가
  const [toasts, setToasts] = React.useState(state.toasts);

  React.useEffect(() => {
    const listener = (newState) => {
      setToasts(newState.toasts);
    };
    listeners.push(listener);

    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [toasts]); 

  return {
    ...state,
    toast, // toast 함수를 useToast 훅 내부에서 반환
    toasts, 
  };
}
