"use client";

import { useEffect, useState } from "react";
import { PROGRAMME_GROUPS, OFFICIAL_PROGRAMMES, otherText, asOther } from "@/lib/programmes";

const OTHER = "__other__";

// Course dropdown used everywhere a member's Department/Course is entered: committee Add/Edit,
// Dance Floor "Add dancer", and the member's own Programme page. Grouped official VIT Chennai
// programmes; "Other" reveals a text box and is saved as "Other: <text>".
// `value` is what is stored; an old free-text value that is not an official programme shows as
// "please choose" with the old text next to it, so nothing is silently guessed.
export default function ProgrammeSelect({
  value,
  onChange,
  className,
  required = true,
  id,
}: {
  value: string;
  onChange: (department: string) => void;
  className: string; // the form's input style (committee and Dance Floor differ)
  required?: boolean;
  id?: string;
}) {
  const typed = otherText(value);
  const official = OFFICIAL_PROGRAMMES.has(value);
  const [choice, setChoice] = useState(official ? value : typed !== null ? OTHER : "");
  const [text, setText] = useState(typed ?? "");
  // What was saved before, when it is not something this dropdown can show.
  const legacy = !official && typed === null && value.trim() ? value : "";

  // Follow the value when a form loads its data after the first render (Edit page).
  useEffect(() => {
    const t = otherText(value);
    if (OFFICIAL_PROGRAMMES.has(value)) setChoice(value);
    else if (t !== null) {
      setChoice(OTHER);
      setText(t);
    }
  }, [value]);

  return (
    <div className="space-y-2">
      <select
        id={id}
        aria-label={id ? undefined : "Programme"}
        value={choice}
        required={required}
        onChange={(e) => {
          const v = e.target.value;
          setChoice(v);
          if (v === OTHER) onChange(text.trim() ? asOther(text) : "");
          else onChange(v);
        }}
        className={className}
      >
        <option value="">Choose your programme...</option>
        {PROGRAMME_GROUPS.map((g) => (
          <optgroup key={g.group} label={g.group}>
            {g.programmes.map((p) => (
              <option key={p.name} value={p.name}>
                {p.full ? `${p.name} - ${p.full}` : p.name}
              </option>
            ))}
          </optgroup>
        ))}
        <option value={OTHER}>Other (not listed)</option>
      </select>

      {choice === OTHER && (
        <input
          value={text}
          required={required}
          minLength={2}
          onChange={(e) => {
            setText(e.target.value);
            onChange(e.target.value.trim() ? asOther(e.target.value) : "");
          }}
          placeholder="Type your programme, e.g. B.Des Interior Design"
          aria-label="Programme (not listed)"
          className={className}
        />
      )}

      {legacy && choice === "" && (
        <p className="text-xs text-amber-300/90">
          Currently saved: <span className="font-medium">&ldquo;{legacy}&rdquo;</span>. This is not a recognised
          VIT Chennai programme, so please choose the correct one.
        </p>
      )}
    </div>
  );
}
