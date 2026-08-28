// Course options (fixed)
export const COURSE_OPTIONS = [
  { value: "AIDS", label: "AIDS — Artificial Intelligence and Data Science" },
  { value: "AIML", label: "AIML — Artificial Intelligence and Machine Learning" },
  { value: "IIOT", label: "IIOT — Industrial Internet of Things" },
  { value: "AR", label: "AR — Automation and Robotics" },
];

// Year of Study (1st–4th)
export const YEAR_OPTIONS = [
  { value: "1", label: "1st Year" },
  { value: "2", label: "2nd Year" },
  { value: "3", label: "3rd Year" },
  { value: "4", label: "4th Year" },
];

// Generate years from 2000 to 2050 inclusive
const _yearRange = Array.from({ length: 51 }, (_, i) => String(2000 + i));

export const ADMISSION_YEAR_OPTIONS = _yearRange;   // "2000" … "2050"
export const GRAD_YEAR_OPTIONS = _yearRange;        // same range

// Gender options
export const GENDER_OPTIONS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
  { value: "Prefer not to say", label: "Prefer not to say" },
];
