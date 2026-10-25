"use client";

import { useEffect, useRef, useState } from "react";

import { brTimeToValue, maskBrTime } from "@/lib/date-input";

type TimeInputProps = {
  name: string;
  /** Valor inicial "HH:MM" (24h). */
  defaultValue?: string;
  required?: boolean;
  className?: string;
  "aria-label"?: string;
};

/** Horario sempre em 24h (hh:mm), independente do locale do navegador; envia "HH:MM". */
export function TimeInput({ name, defaultValue, required, className, "aria-label": ariaLabel }: TimeInputProps) {
  const [text, setText] = useState(defaultValue ?? "");
  const ref = useRef<HTMLInputElement>(null);
  const value = brTimeToValue(text);

  useEffect(() => {
    ref.current?.setCustomValidity(text !== "" && value === "" ? "Use hh:mm (24h)" : "");
  }, [text, value]);

  return (
    <>
      <input
        aria-label={ariaLabel}
        className={className}
        inputMode="numeric"
        maxLength={5}
        onChange={(event) => setText(maskBrTime(event.target.value))}
        placeholder="hh:mm"
        ref={ref}
        required={required}
        value={text}
      />
      <input name={name} type="hidden" value={value} />
    </>
  );
}
