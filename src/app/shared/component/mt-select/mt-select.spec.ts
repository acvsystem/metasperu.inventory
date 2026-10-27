import { MtSelect } from './mt-select';

describe('Select dialog cancellation', () => {
  it('discards unconfirmed changes and preserves confirmed choices', () => {
    const select = new MtSelect();
    select.isMultiselect = true;
    select.data = [
      { key: 1, value: 'A1', selected: true },
      { key: 2, value: 'A2', selected: false },
    ];
    select.openStoreModal();
    select.toggleItem(select.data[1]);
    (select as any).cancelSelection();
    expect(select.data.map((item) => item.selected)).toEqual([true, false]);
    select.openStoreModal();
    select.toggleItem(select.data[1]);
    const emit = spyOn(select.selectdOption, 'emit');
    select.confirmSelection();
    (select as any).cancelSelection();
    expect(emit).toHaveBeenCalledWith(select.data);
    expect(select.data.map((item) => item.selected)).toEqual([true, true]);
  });
  it('selects all matching options, including rows outside the viewport, and preserves other selections', () => {
    const select = new MtSelect();
    select.isMultiselect = true;
    select.data = Array.from({ length: 5000 }, (_, i) => ({ key: i, value: 'Sección ' + i, selected: i === 4999 }));
    select.openStoreModal();
    select.handleFilter({ target: { value: 'Sección 1' } });
    const matching = select.filteredData.length;
    select.setAllSelected({ detail: { checked: true } });
    select.handleFilter({ target: { value: '' } });
    const emit = spyOn(select.selectdOption, 'emit');
    select.confirmSelection();
    expect(emit.calls.mostRecent().args[0].length).toBe(matching + 1);
    expect(select.data[4999].selected).toBeTrue();
  });
});
