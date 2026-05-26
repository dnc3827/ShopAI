export function htmlToPlainText(value?: string | null): string {
  if (!value) return '';

  if (!/[<&]/.test(value)) return value;

  if (typeof document !== 'undefined') {
    const template = document.createElement('template');
    template.innerHTML = value;
    return (template.content.textContent || '').replace(/\s+/g, ' ').trim();
  }

  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
