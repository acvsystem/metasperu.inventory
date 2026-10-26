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
});
