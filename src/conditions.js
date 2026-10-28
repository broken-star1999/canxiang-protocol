export function matches(rule, state) {
  if (!rule) return true;
  if (rule.all) return rule.all.every((r) => matches(r, state));
  if (rule.any) return rule.any.some((r) => matches(r, state));
  if (rule.not) return !matches(rule.not, state);
  if (rule.flag) return state.flags[rule.flag] === (rule.value ?? true);
  if (rule.evidence) return state.evidence.includes(rule.evidence);
  if (rule.minEvidence !== undefined)
    return state.evidence.length >= rule.minEvidence;
  if (rule.stat) return (state.values[rule.stat] || 0) >= rule.min;
  return false;
}
