import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const AlertUi = ({ icon, title, desc, variant }) => {
  return (
    <Alert variant={variant} className="flex items-start gap-2">
      <i
        className={`${icon} text-[16px] ${
          variant == "success"
            ? "text-green"
            : variant == "destructive"
            ? "text-red"
            : variant == "info"
            ? "text-cyan"
            : variant == "warning"
            ? "text-yellow"
            : ""
        }`}
      ></i>
      <div>
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{desc}</AlertDescription>
      </div>
    </Alert>
  );
};

export default AlertUi;
