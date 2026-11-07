/** Room bounds and shelf footprints shared by movement and scene construction. */
export const BAYS = [-6.5, 6.5].flatMap(x => [-5, 1, 7].map(z => ({ x, z })));
export function canStand(x: number, z: number): boolean {
  return Math.abs(x) < 11.3 && z > -10.3 && z < 12.3 &&
    !BAYS.some(b => Math.abs(x - b.x) < 2.85 && Math.abs(z - b.z) < 1.1) &&
    ![-2.3,2.3].some(chair => Math.abs(x-chair)<1.2 && Math.abs(z+8.6)<1.25) &&
    Math.hypot(x,z+8.25)>1.12;
}
export function stepPosition(x: number, z: number, dx: number, dz: number): { x: number; z: number } {
  // Small substeps prevent passing through shelves after a delayed frame.
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.15));
  for (let i = 0; i < steps; i++) {
    if (canStand(x + dx / steps, z)) x += dx / steps;
    if (canStand(x, z + dz / steps)) z += dz / steps;
  }
  return { x, z };
}
