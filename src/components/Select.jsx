import React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SelectUi = ({
  className,
  placeholder,
  children,
  defaultValue,
  value,
  valueClassFn,
  onChange,
  onValueChange,
  align,
  sideOffset,
  position,
  alignOffset,
  strategy, 
  ...triggerProps
}) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue || "");
  const currentValue = value !== undefined ? value : internalValue;

  const triggerClassName = valueClassFn
    ? valueClassFn(currentValue)
    : className;

  const handleChange = (val) => {
    setInternalValue(val);
    if (onChange) onChange(val);
    if (onValueChange) onValueChange(val);
  };

  return (
    <Select value={currentValue} onValueChange={handleChange}>
      <SelectTrigger
        className={`w-full border-none focus:ring-0 text-[16px] focus:outline-none text-foreground px-0 [&>svg]:hidden ${triggerClassName} py-0 !h-fit whitespace-normal break-words text-left`}
        {...triggerProps} // sideOffset/align/strategy TIDAK ikut ke sini lagi
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>

      <SelectContent
        className="break-words whitespace-normal"
        align={align}
        sideOffset={sideOffset}
        position={position}
      >
        <SelectGroup>{children}</SelectGroup>
      </SelectContent>
    </Select>
  );
};

export default SelectUi;
