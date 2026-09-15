export function suggestTemplateName(planName: string, memberName?: string) {
  let name = planName.trim();
  if (!name) return '';
  if (memberName) {
    const suffix = ` for ${memberName}`;
    if (name.toLowerCase().endsWith(suffix.toLowerCase())) {
      name = name.slice(0, -suffix.length).trim();
    }
  } else {
    name = name.replace(/\s+for\s+.+$/i, '').trim();
  }
  return name || planName.trim();
}

export function staffName(user?: { firstName?: string | null; lastName?: string | null } | null) {
  if (!user) return '—';
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return name || '—';
}
