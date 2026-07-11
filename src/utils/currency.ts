export function getCurrencySymbol(currencyCode?: string): string {
  switch (currencyCode) {
    case 'EUR': return '€';
    case 'SAR': return '﷼';
    case 'GBP': return '£';
    case 'JPY': return '¥';
    case 'AED': return 'د.إ';
    case 'USD':
    default:
      return '$';
  }
}
