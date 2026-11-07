/** Room bounds and shelf footprints shared by movement and scene construction. */
export const BAYS = [-6.5, 0, 6.5].flatMap(x => [-5, 1].map(z => ({ x, z })));
export function canStand(x: number, z: number): boolean {
  return Math.abs(x) < 11.3 && z > -10.3 && z < 12.3 &&
    !BAYS.some(b => Math.abs(x - b.x) < 2.65 && Math.abs(z - b.z) < 1.05);
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
