import { createContext, useContext, useState, useCallback } from "react";
import AlertUi from "../components/Alert";

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [alert, setAlert] = useState(null);

  const showAlert = useCallback(({ icon, title, desc, variant, duration = 3000 }) => {
    setAlert({ icon, title, desc, variant });

    setTimeout(() => setAlert(null), duration);
  }, []);

  const hideAlert = useCallback(() => setAlert(null), []);

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      {alert && (
        <div className="fixed md:top-5 right-5 max-md:right-[50%] max-md:translate-x-[50%] max-md:w-[95%] w-[400px] z-[9999] max-lg:bottom-5 animate-fadeIn">
          <AlertUi
            icon={alert.icon}
            title={alert.title}
            desc={alert.desc}
            variant={alert.variant}
          />
        </div>
      )}
    </AlertContext.Provider>
  );
};

export const useAlert = () => useContext(AlertContext);
