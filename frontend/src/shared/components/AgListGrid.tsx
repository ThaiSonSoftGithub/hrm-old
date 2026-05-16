import { AgGridReact } from 'ag-grid-react';
import type {
  ColDef,
  GridReadyEvent,
  IRowNode,
  RowSelectedEvent,
} from 'ag-grid-community';
import { useImperativeHandle, useRef, forwardRef } from 'react';
import { hrmGridTheme } from './AgGrid';

export interface AgListGridHandle<T> {
  getSelected: () => T[];
  clearSelection: () => void;
}

interface Props<T> {
  rowData: T[];
  columnDefs: ColDef<T>[];
  getRowId: (data: T) => string;
  loading?: boolean;
  emptyText?: string;
  selectable?: boolean;
  onSelectionChange?: (selected: T[]) => void;
  paginationPageSize?: number;
  defaultColDef?: ColDef;
  /** Cho phép disable click selection (chỉ dùng checkbox). */
  enableClickSelection?: boolean;
}

const VI_LOCALE = {
  page: 'Trang', to: 'đến', of: 'trên', next: 'Sau', last: 'Cuối',
  first: 'Đầu', previous: 'Trước', loadingOoo: 'Đang tải...',
  selectAll: 'Chọn tất cả', searchOoo: 'Tìm...',
  blanks: 'Trống', filterOoo: 'Lọc...',
  applyFilter: 'Áp dụng', clearFilter: 'Xóa lọc',
  equals: 'Bằng', notEqual: 'Khác',
  contains: 'Chứa', notContains: 'Không chứa',
  startsWith: 'Bắt đầu bằng', endsWith: 'Kết thúc bằng',
  noRowsToShow: 'Chưa có dữ liệu',
} as const;

function AgListGridInner<T>(
  {
    rowData, columnDefs, getRowId, loading, emptyText = 'Chưa có dữ liệu',
    selectable = false, onSelectionChange,
    paginationPageSize = 20,
    defaultColDef,
    enableClickSelection = false,
  }: Props<T>,
  ref: React.Ref<AgListGridHandle<T>>,
) {
  const gridRef = useRef<AgGridReact<T>>(null);

  useImperativeHandle(ref, () => ({
    getSelected: () => (gridRef.current?.api.getSelectedNodes() ?? []).map((n: IRowNode<T>) => n.data!).filter(Boolean),
    clearSelection: () => gridRef.current?.api.deselectAll(),
  }));

  const handleSelectionChange = () => {
    if (!onSelectionChange) return;
    const nodes = gridRef.current?.api.getSelectedNodes() ?? [];
    onSelectionChange(nodes.map((n) => n.data!).filter(Boolean));
  };

  return (
    <AgGridReact<T>
      ref={gridRef}
      theme={hrmGridTheme}
      rowData={rowData}
      columnDefs={columnDefs}
      defaultColDef={defaultColDef ?? { sortable: true, filter: true, resizable: true }}
      getRowId={(p) => getRowId(p.data)}
      rowSelection={
        selectable
          ? { mode: 'multiRow', checkboxes: true, headerCheckbox: true, enableClickSelection }
          : undefined
      }
      selectionColumnDef={selectable ? { pinned: 'left', width: 44, suppressMovable: true, resizable: false } : undefined}
      onRowSelected={onSelectionChange ? handleSelectionChange as (e: RowSelectedEvent) => void : undefined}
      onGridReady={(e: GridReadyEvent) => e.api.sizeColumnsToFit()}
      pagination
      paginationPageSize={paginationPageSize}
      paginationPageSizeSelector={[10, 20, 50, 100]}
      animateRows
      loading={loading}
      overlayNoRowsTemplate={emptyText}
      localeText={VI_LOCALE}
    />
  );
}

export const AgListGrid = forwardRef(AgListGridInner) as <T>(
  props: Props<T> & { ref?: React.Ref<AgListGridHandle<T>> }
) => React.ReactElement;
