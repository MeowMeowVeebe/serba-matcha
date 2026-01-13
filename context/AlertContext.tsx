"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import GlobalAlert from "../components/GlobalAlert";

type AlertContextType = {
  showAlert: (message: string) => void;
};

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) throw new Error("useAlert must be used within AlertProvider");
  return context;
};

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [alert, setAlert] = useState({ show: false, message: "" });

  const showAlert = (message: string) => setAlert({ show: true, message });

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <GlobalAlert
        show={alert.show}
        message={alert.message}
        onClose={() => setAlert({ show: false, message: "" })}
      />
    </AlertContext.Provider>
  );
};
