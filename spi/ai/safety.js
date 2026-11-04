// Applies to requests and generated plans/answers. Source text is never executed.
export const unsafeProtectiveText=text=>/\b(bypass(?:ing|ed)?|defeat(?:ing|ed)?|inhibit(?:ing|ed)?|overrid(?:e|ing)|disabl(?:e|ing|ed))\b/i.test(text)&&/\b(trips?|interlocks?|alarms?|permissives?|safety|protective functions?)\b/i.test(text);
