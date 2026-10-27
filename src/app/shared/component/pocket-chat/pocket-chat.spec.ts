import { of } from 'rxjs';
import { PocketChat } from './pocket-chat';

describe('Minimized chat', () => {
  function gestureChat() {
    spyOn(window, 'matchMedia').and.returnValue({ matches: true } as MediaQueryList);
    const chat = Object.create(PocketChat.prototype) as any;
    Object.assign(chat, { opened: true, minimized: false, dragOffset: 0, draft: 'Pendiente de enviar', rows: [{ id: 5 }] });
    const header = document.createElement('header');
    header.setPointerCapture = () => {};
    const event = (x: number, y: number, target = header) => ({
      pointerId: 1, pointerType: 'touch', clientX: x, clientY: y,
      target, currentTarget: header,
    } as unknown as PointerEvent);
    return { chat, header, event };
  }
  it('minimizes with a downward header drag and preserves the conversation and draft', () => {
    const { chat, event } = gestureChat();
    chat.startDrag(event(120, 30));
    chat.moveDrag(event(125, 130));
    expect(chat.dragOffset).toBeGreaterThan(0);
    chat.finishDrag(event(125, 130));
    expect(chat.minimized).toBeTrue();
    expect(chat.opened).toBeTrue();
    expect(chat.draft).toBe('Pendiente de enviar');
    expect(chat.rows).toEqual([{ id: 5 }]);
    expect(chat.dragOffset).toBe(0);
  });
  it('does not minimize on a short, horizontal or cancelled drag', () => {
    const { chat, event } = gestureChat();
    for (const [x, y, cancelled] of [[120, 45, false], [250, 110, false], [120, 140, true]] as const) {
      chat.startDrag(event(120, 30));
      chat.moveDrag(event(x, y));
      chat.finishDrag(event(x, y), cancelled);
      expect(chat.minimized).toBeFalse();
      expect(chat.dragOffset).toBe(0);
    }
  });
  it('leaves action buttons and desktop interactions outside the drag gesture', () => {
    const { chat, header, event } = gestureChat();
    const button = document.createElement('button');
    header.appendChild(button);
    chat.startDrag(event(120, 30, button));
    chat.finishDrag(event(120, 140));
    expect(chat.minimized).toBeFalse();
    (window.matchMedia as jasmine.Spy).and.returnValue({ matches: false });
    chat.startDrag(event(120, 30));
    chat.finishDrag(event(120, 140));
    expect(chat.minimized).toBeFalse();
  });
  it('does not mark fetched messages as read while minimized', async () => {
    const chat = Object.create(PocketChat.prototype) as any;
    const selected = { id: 1, username: 'QA', unread: 2 };
    const markRead = jasmine.createSpy('markRead').and.resolveTo();
    Object.assign(chat, {
      selected,
      opened: true,
      minimized: true,
      revision: 0,
      destroyed: false,
      rows: [{ id: 5 }],
      http: { get: () => of([{ id: 5, body: 'Hola' }]) },
      markRead,
    });
    await chat.load();
    expect(markRead).not.toHaveBeenCalled();
    expect(selected.unread).toBe(2);
    chat.minimized = false;
    await chat.load();
    expect(markRead).toHaveBeenCalledWith(5);
  });
});
