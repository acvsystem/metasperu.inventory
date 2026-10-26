import { MatPaginatorIntl } from '@angular/material/paginator';

/** Spanish labels used throughout the inventory workspace. */
export function inventoryPaginator(): MatPaginatorIntl {
  const paginator = new MatPaginatorIntl();
  paginator.itemsPerPageLabel = 'Filas por página:';
  paginator.nextPageLabel = 'Página siguiente';
  paginator.previousPageLabel = 'Página anterior';
  paginator.firstPageLabel = 'Primera página';
  paginator.lastPageLabel = 'Última página';
  paginator.getRangeLabel = (page, size, length) => {
    if (length === 0 || size === 0) return `0 de ${length}`;
    return `${page * size + 1}–${Math.min((page + 1) * size, length)} de ${length}`;
  };
  return paginator;
}
