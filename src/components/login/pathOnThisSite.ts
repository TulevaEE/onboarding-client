const PATH_ON_THIS_SITE_NO_LONGER_THAN_THE_BACKEND_ACCEPTS = /^\/(?![/\\])\S{0,2047}$/;
const STARTS_ON_THIS_SITE = /^\/(?![/\\])/;

const pathnameAsTheRouterDecodesIt = (path: string): string | undefined => {
  try {
    return decodeURI(path.split(/[?#]/)[0]);
  } catch (malformedEscape) {
    return undefined;
  }
};

export const pathOnThisSite = (path: string | null | undefined): string | undefined => {
  if (!path || !PATH_ON_THIS_SITE_NO_LONGER_THAN_THE_BACKEND_ACCEPTS.test(path)) {
    return undefined;
  }
  const pathname = pathnameAsTheRouterDecodesIt(path);
  return pathname !== undefined && STARTS_ON_THIS_SITE.test(pathname) ? path : undefined;
};
