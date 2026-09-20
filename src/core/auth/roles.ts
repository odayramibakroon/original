export function isActiveAdmin(value: unknown): boolean {
  return typeof value === "object" && value !== null &&
    "role" in value && value.role === "admin" &&
    "active" in value && value.active === true;
}
