const flags = import.meta.glob<string>('../../assets/flags/*.svg', {
  query: '?url',
  import: 'default',
  eager: true,
});

export function flagUrl(countryCode: string): string | undefined {
  return flags[`../../assets/flags/${countryCode.toLowerCase()}.svg`];
}
