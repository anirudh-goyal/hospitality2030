import type { Role } from "@/components/role-switcher";

type Observation = {
  extracted: {
    applicableRoles: string[];
    categories: string[];
  };
};

export function isVisibleToRole<T extends Observation>(
  obs: T,
  role: Role
): boolean {
  if (role === "front_desk") return true;
  return obs.extracted.applicableRoles.includes(role);
}

export function filterForRole<T extends Observation>(
  obs: T[],
  role: Role
): T[] {
  return obs.filter((o) => isVisibleToRole(o, role));
}
