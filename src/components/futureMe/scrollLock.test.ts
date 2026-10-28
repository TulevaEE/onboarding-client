import { lockPageScroll } from './scrollLock';

describe('lockPageScroll', () => {
  const scrolledTo = (offset: number) =>
    Object.defineProperty(window, 'scrollY', { value: offset, configurable: true });

  afterEach(() => {
    scrolledTo(0);
    jest.restoreAllMocks();
  });

  it('puts the page back where it was while still locked, so the page does not smooth-scroll there', () => {
    const lockedWhenScrolled: boolean[] = [];
    const scrollTo = jest.spyOn(window, 'scrollTo').mockImplementation(() => {
      lockedWhenScrolled.push(document.documentElement.classList.contains('scroll-locked'));
    });
    scrolledTo(300);

    const unlock = lockPageScroll();
    unlock();

    expect(scrollTo).toHaveBeenCalledWith(0, 300);
    expect(lockedWhenScrolled).toEqual([true]);
  });

  it('holds the page in place while locked and lets it scroll again after', () => {
    jest.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    scrolledTo(300);

    const unlock = lockPageScroll();
    expect(document.body).toHaveStyle({ top: '-300px' });
    expect(document.documentElement).toHaveClass('scroll-locked');

    unlock();
    expect(document.body).not.toHaveStyle({ position: 'fixed' });
    expect(document.documentElement).not.toHaveClass('scroll-locked');
  });
});
