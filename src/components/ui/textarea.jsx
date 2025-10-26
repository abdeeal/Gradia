import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, size = "sm", ...props }) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 field-sizing-content min-h-16 w-full max-w-full min-w-0 box-border flex-shrink-0 rounded-md !bg-background transition-[color,box-shadow] outline-none focus-visible:ring-[2px] disabled:cursor-not-allowed disabled:opacity-50 font-inter break-words ",
        className,
        size == 'lg'
          ? "text-[48px] font-bold focus-visible:ring-0 focus-visible:border-0"
          : "focus:px-1.5 focus:py-1"
      )}
      {...props}
    />
  );
}

export { Textarea };
