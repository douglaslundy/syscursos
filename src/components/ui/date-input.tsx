"use client";

import { useEffect, useRef, useState } from "react";

import { brDateToIso, isoToBrDate, maskBrDate } from "@/lib/date-input";

type DateInputProps = {
  name: string;
  /** Valor inicial em ISO (yyyy-mm-dd). */
  defaultValue?: string;
  /** Limites em ISO (yyyy-mm-dd). */
  min?: string;
  max?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
};

/** Exibe dd/mm/aaaa independente do locale do navegador; envia yyyy-mm-dd no campo `name`. */
export function DateInput({ name, defaultValue, min, max, required, disabled, className }: DateInputProps) {
  const [text, setText] = useState(isoToBrDate(defaultValue));
  const ref = useRef<HTMLInputElement>(null);
  const iso = brDateToIso(text);

  useEffect(() => {
    let message = "";
    if (text !== "" && iso === "") message = "Use dd/mm/aaaa";
    else if (iso && ((min && iso < min) || (max && iso > max))) {
      message = `Data fora do periodo permitido${min ? ` (a partir de ${isoToBrDate(min)})` : ""}`;
    }
    ref.current?.setCustomValidity(message);
  }, [text, iso, min, max]);

  return (
    <>
      <input
        className={className}
        disabled={disabled}
        inputMode="numeric"
        maxLength={10}
        onChange={(event) => setText(maskBrDate(event.target.value))}
        placeholder="dd/mm/aaaa"
        ref={ref}
        required={required}
        value={text}
      />
      <input disabled={disabled} name={name} type="hidden" value={iso} />
    </>
  );
}
