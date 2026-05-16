import type { Role } from "@/components/role-switcher";

type Observation = {
  extracted: {
    applicableRoles: string[];
    categories: string[];
  };
};

const ALL_ROLES: Role[] = [
  "front_desk",
  "concierge",
  "restaurant",
  "spa",
  "housekeeping",
];

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

export function rolesForText(text: string): Role[] {
  const f = text.toLowerCase();
  if (/allerg|severe|allergy/.test(f)) return ALL_ROLES;
  if (/spouse|wife|husband|partner not traveling/.test(f))
    return ["front_desk", "concierge"];
  if (/knee|surgery|wellness|massage|spa|recover/.test(f))
    return ["front_desk", "spa"];
  if (/pool|child|daughter|son|family|birthday|kid|mia/.test(f))
    return ["front_desk", "concierge"];
  if (/drink|mezcal|wine|spirit|cocktail|coffee|tea|casa dragones/.test(f))
    return ["front_desk", "restaurant", "concierge"];
  if (/ceramic|pottery|art|gallery|museum|interest|collector/.test(f))
    return ["front_desk", "concierge"];
  if (/room|amenity|housekeep|turndown|laundry/.test(f))
    return ["front_desk", "housekeeping"];
  return ["front_desk", "concierge"];
}

export function filterTextsForRole(
  items: string[],
  role: Role
): string[] {
  if (role === "front_desk") return items;
  return items.filter((t) => rolesForText(t).includes(role));
}

export function filterKeyFactsForRole<T extends { fact: string }>(
  items: T[],
  role: Role
): T[] {
  if (role === "front_desk") return items;
  return items.filter((kf) => rolesForText(kf.fact).includes(role));
}

export function gestureVisibleToRole(role: Role): boolean {
  return role === "front_desk" || role === "concierge";
}
