export const lockPageScroll = (): (() => void) => {
  const { scrollY } = window;
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  const { style } = document.body;

  document.documentElement.classList.add('scroll-locked');
  style.paddingRight = `${scrollbarWidth}px`;
  style.position = 'fixed';
  style.top = `${-scrollY}px`;
  style.left = '0';
  style.right = '0';
  style.width = '100%';

  return () => {
    style.position = '';
    style.top = '';
    style.left = '';
    style.right = '';
    style.width = '';
    style.paddingRight = '';
    window.scrollTo(0, scrollY);
    document.documentElement.classList.remove('scroll-locked');
  };
};
