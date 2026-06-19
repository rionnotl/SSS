export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Use HSL for vibrant dark mode colors
  const h = Math.abs(hash) % 360;
  const s = 70 + (Math.abs(hash) % 30); // 70-100%
  const l = 50 + (Math.abs(hash) % 20); // 50-70%
  return `hsl(${h}, ${s}%, ${l}%)`;
}
