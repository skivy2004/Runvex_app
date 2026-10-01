/**
 * Whether someone born on `dateOfBirth` ("YYYY-MM-DD") is at least `minAge`
 * years old on `today`. Compares calendar dates, so the birthday itself counts.
 */
export function isAtLeastAge(dateOfBirth: string, minAge: number, today = new Date()): boolean {
  const [year, month, day] = dateOfBirth.split("-").map(Number);
  const birth = Date.UTC(year, month - 1, day);
  const cutoff = Date.UTC(today.getFullYear() - minAge, today.getMonth(), today.getDate());
  return birth <= cutoff;
}

/** The latest date of birth ("YYYY-MM-DD") for someone who is `minAge` today. */
export function latestDateOfBirthForAge(minAge: number, today = new Date()): string {
  const cutoff = new Date(Date.UTC(today.getFullYear() - minAge, today.getMonth(), today.getDate()));
  return cutoff.toISOString().slice(0, 10);
}
