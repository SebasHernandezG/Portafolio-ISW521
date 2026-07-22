export const Role = Object.freeze({
  USER: "user",
  ASSISTANT: "ia"
});

export function ensureValidRole(role) {
  if (!Object.values(Role).includes(role)) {
    throw new TypeError(`Rol de mensaje no válido: ${role}`);
  }

  return role;
}
