export interface InventoryLabel { code: string; title: string }
interface Section {
  nombre_seccion?: string; codigo_sesion?: string; id?: number | string;
  seccion_id_fk?: number | string; seccion_id?: number | string; nombre_zona?: string;
}
const sectionKey = (name: string) => name.trim().replace(/\s+/g, '_').toLowerCase();

export function toInventoryLabels(sections: readonly (Section | string)[], zones: readonly Section[]): InventoryLabel[] {
  const byId = new Map<number, string>(), byName = new Map<string, string>();
  for (const zone of zones) {
    const id = Number(zone.seccion_id ?? zone.seccion_id_fk), name = sectionKey(zone.nombre_seccion || '');
    if (id && !byId.has(id)) byId.set(id, zone.nombre_zona || '');
    if (name && !byName.has(name)) byName.set(name, zone.nombre_zona || '');
  }
  return sections.flatMap((item) => {
    const code = typeof item === 'string' ? item.trim() : String(item.nombre_seccion ?? item.codigo_sesion ?? item.id ?? '').trim();
    if (!code) return [];
    const zone = typeof item === 'string' ? '' : byId.get(Number(item.seccion_id_fk ?? item.seccion_id)) || byName.get(sectionKey(item.nombre_seccion || '')) || item.nombre_zona;
    return [{ code, title: (zone || 'PISO DE VENTAS').trim().toUpperCase() }];
  });
}

