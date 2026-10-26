import { of } from 'rxjs';
import { PocketChat } from './pocket-chat';

describe('Minimized chat', () => {
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
