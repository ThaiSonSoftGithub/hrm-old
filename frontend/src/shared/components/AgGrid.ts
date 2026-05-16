import { ModuleRegistry, AllCommunityModule, themeQuartz, colorSchemeLightCold } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

/**
 * Theme dùng chung — màu indigo khớp brand HRM ONE.
 */
export const hrmGridTheme = themeQuartz.withPart(colorSchemeLightCold).withParams({
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontSize: 14,
  headerFontWeight: 600,
  headerFontSize: 13,
  headerTextColor: '#475569',
  headerBackgroundColor: '#F8FAFC',
  headerColumnBorder: { color: '#F0F2F7' },
  rowBorder: { color: '#F0F2F7' },
  columnBorder: false,
  borderRadius: 10,
  wrapperBorder: { color: '#E5E7EB' },
  oddRowBackgroundColor: '#FCFCFD',
  rowHoverColor: '#F4F6FB',
  selectedRowBackgroundColor: 'rgba(91, 108, 255, 0.10)',
  accentColor: '#5B6CFF',
  cellHorizontalPadding: 14,
  rowHeight: 44,
  headerHeight: 42,
});
