const RUNTIME_PATH = /^\/(?:api(?:\/|$)|auth(?:\/|$)|health$)/;

export const isPackagedUiRuntimeRequest = (requestUrl) =>
  RUNTIME_PATH.test(new URL(requestUrl).pathname);
