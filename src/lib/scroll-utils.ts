type Section = { id: string; top: number };

export function getActiveSection(sections: Section[], scrollY: number): string {
  const sorted = [...sections].sort((a, b) => a.top - b.top);
  let active = sorted[0].id;
  for (const section of sorted) {
    if (scrollY >= section.top) {
      active = section.id;
    }
  }
  return active;
}
