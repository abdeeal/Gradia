import React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SelectUi = ({ className, placeholder, children, defaultValue, valueClassFn }) => {
  const [value, setValue] = React.useState(defaultValue || "");

  React.useEffect(() => {
    setValue(defaultValue || "");
  }, [defaultValue]);

  const triggerClassName = valueClassFn ? valueClassFn(value) : className;

  return (
    <Select defaultValue={defaultValue} onValueChange={setValue}>
      <SelectTrigger className={`w-full border-none focus:ring-0 text-[16px] focus:outline-none text-foreground px-0 [&>svg]:hidden ${triggerClassName}`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>{children}</SelectGroup>
      </SelectContent>
    </Select>
  );
};


export default SelectUi;
