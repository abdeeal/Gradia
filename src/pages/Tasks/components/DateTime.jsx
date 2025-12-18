"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function DateTime({ defaultValue, value, onChange }) {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState();
  const [time, setTime] = React.useState("00:00");

  React.useEffect(() => {
    const initial = value || defaultValue;
    if (!initial) return;
    const d = new Date(initial);
    if (isNaN(d.getTime())) return;
    setDate(d);
    const hh = d.getHours().toString().padStart(2, "0");
    const mm = d.getMinutes().toString().padStart(2, "0");
    setTime(`${hh}:${mm}`);
    onChange && onChange(d.toISOString());
  }, [defaultValue, value, onChange]);

  React.useEffect(() => {
    if (date && time && onChange) {
      const [hh, mm] = time.split(":");
      const updated = new Date(date);
      updated.setHours(parseInt(hh));
      updated.setMinutes(parseInt(mm));
      onChange(updated.toISOString());
    }
  }, [date, time, onChange]);
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex gap-4 items-center">
      <div className="flex flex-col gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id="date-picker"
              className="w-fit justify-between font-normal text-[16px] border-none px-0 focus:px-2 hover:px-2 flex gap-2 !py-0 focus:py-1 h-fit hover:h-9 focus:h-9"
            >
              {date ? date.toLocaleDateString() : "Select date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              fromYear={currentYear}
              toYear={currentYear + 3}
              onSelect={(newDate) => {
                setDate(newDate);
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex flex-col gap-3">
        <Input
          type="time"
          id="time-picker"
          step="60"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="bg-background border-none appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none focus-visible:ring-[2px] !py-0 focus:py-0 h-fit focus:h-9"
        />
      </div>
    </div>
  );
}
