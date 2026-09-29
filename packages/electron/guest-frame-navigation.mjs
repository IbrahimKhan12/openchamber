// Extension frames run sandboxed with an opaque origin and a CSP that keeps
// them off the network. A frame navigating itself is the one way out that no
// CSP inside the frame can stop: `location = 'https://anywhere/?data=…'`
// carries whatever it was shown in the URL. The desktop shell sees that
// navigation before any request is made (`will-frame-navigate`) and refuses
// it. The web runtime has no such hook; there the panel visibly leaves.
//
// Only opaque-origin subframes are judged. An app-created file-preview iframe
// also has an opaque origin before its first navigation, so origin alone cannot
// distinguish it from an extension.

const LOCAL_SCHEMES = new Set(['about:', 'data:', 'blob:']);
const GUEST_PATH_PREFIX = '/api/guests/';
const FILE_PREVIEW_PATH_PREFIX = '/api/fs/serve/';

/**
 * @param {{ isMainFrame: boolean, frameOrigin: string | undefined, frame?: import('electron').WebFrameMain | null, initiator?: import('electron').WebFrameMain | null, mainFrame?: import('electron').WebFrameMain | null, url: string, isAppOrigin: (url: string) => boolean }} input
 * @returns {boolean} true when the navigation must be refused
 */
export const shouldBlockGuestFrameNavigation = ({ isMainFrame, frameOrigin, frame, initiator, mainFrame, url, isAppOrigin }) => {
  if (isMainFrame || frameOrigin !== 'null') return false;
  let target;
  try {
    target = new URL(url);
  } catch {
    return true;
  }
  // No network request: the document is built from what the frame already has.
  if (LOCAL_SCHEMES.has(target.protocol)) return false;
  if (isAppOrigin(url)) {
    // Another page of an extension on this app's server, which the same CSP governs.
    if (target.pathname.startsWith(GUEST_PATH_PREFIX)) return false;
    // Only the app can start a direct child's first file-preview navigation.
    // A loaded extension cannot navigate itself (or a nested frame) here.
    if ((target.protocol === 'http:' || target.protocol === 'https:')
      && target.pathname.startsWith(FILE_PREVIEW_PATH_PREFIX)
      && frame && mainFrame && initiator === mainFrame) {
      try {
        if (frame.url === '' && frame.parent === mainFrame) return false;
      } catch {
        // A detached frame cannot prove it belongs to the app.
      }
    }
  }
  return true;
};
