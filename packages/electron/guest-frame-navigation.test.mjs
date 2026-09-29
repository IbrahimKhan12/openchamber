import assert from 'node:assert/strict';
import test from 'node:test';

import { shouldBlockGuestFrameNavigation } from './guest-frame-navigation.mjs';

const isAppOrigin = (url) => new URL(url).origin === 'http://127.0.0.1:3902';
const guest = (url) => shouldBlockGuestFrameNavigation({ isMainFrame: false, frameOrigin: 'null', url, isAppOrigin });

test('refuses an extension frame leaving for any other address', () => {
  for (const url of [
    'https://example.com/?data=conversation',
    'http://127.0.0.1:3902/api/session',
    'http://127.0.0.1:3902/',
    'http://127.0.0.1:9999/api/guests/demo/index.html',
    'javascript:alert(1)',
    'not a url',
  ]) {
    assert.equal(guest(url), true, url);
  }
});

test('lets an extension frame load its own pages and local documents', () => {
  for (const url of [
    'http://127.0.0.1:3902/api/guests/demo/index.html?oc_url_token=x',
    'http://127.0.0.1:3902/api/guests/demo/other/page.html',
    'about:srcdoc',
    'about:blank',
    'data:text/html,<p>hi</p>',
    'blob:http://127.0.0.1:3902/0f2d',
  ]) {
    assert.equal(guest(url), false, url);
  }
});

test('leaves the main frame and frames with an origin of their own alone', () => {
  assert.equal(shouldBlockGuestFrameNavigation({ isMainFrame: true, frameOrigin: 'null', url: 'https://example.com/', isAppOrigin }), false);
  assert.equal(shouldBlockGuestFrameNavigation({ isMainFrame: false, frameOrigin: 'https://docs.example', url: 'https://example.com/', isAppOrigin }), false);
});

test('allows an app-created HTML preview without letting an extension navigate to files', () => {
  const mainFrame = {};
  const previewFrame = { url: '', parent: mainFrame };
  const guestFrame = { url: 'http://127.0.0.1:3902/api/guests/demo/index.html', parent: mainFrame };
  const fileUrl = 'http://127.0.0.1:3902/api/fs/serve/tmp/index.html?oc_url_token=x';
  const navigate = (frame, initiator, url = fileUrl) => shouldBlockGuestFrameNavigation({
    isMainFrame: false, frameOrigin: 'null', frame, initiator, mainFrame, url, isAppOrigin,
  });

  assert.equal(navigate(previewFrame, mainFrame), false, 'the app can load its own file preview');
  assert.equal(navigate(guestFrame, guestFrame), true, 'a loaded guest cannot leave for a file preview');
  assert.equal(navigate(guestFrame, mainFrame), true, 'a loaded guest is not a new file-preview frame');
  assert.equal(navigate(previewFrame, previewFrame), true, 'an opaque frame cannot navigate itself to a file preview');
  assert.equal(navigate({ url: '', parent: guestFrame }, mainFrame), true, 'a nested guest frame cannot load a file preview');
  assert.equal(navigate(previewFrame, mainFrame, 'https://example.com/api/fs/serve/tmp/index.html'), true, 'a file preview cannot leave the app origin');
  assert.equal(navigate(previewFrame, mainFrame, 'http://127.0.0.1:3902/api/fs/raw?path=/tmp/file'), true, 'other file routes are not opened');
  assert.equal(navigate({ get url() { throw new Error('detached'); } }, mainFrame), true, 'a detached frame cannot claim the preview exception');
});
