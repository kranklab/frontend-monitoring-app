import { createContext, useContext } from 'react';

type AppSelectionContextType = {
  selectedIndex: number;
  selectApp: (index: number) => void;
};

export const AppSelectionContext = createContext<AppSelectionContextType>({
  selectedIndex: 0,
  selectApp: () => {},
});

export function useAppSelection() {
  return useContext(AppSelectionContext);
}
