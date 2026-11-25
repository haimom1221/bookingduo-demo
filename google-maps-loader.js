// The SDK is loaded on the first eligible map, after the app has opened.
(() => {
  let attempt, script;
  let generation = 0;
  const firstTiles = new Map();
  // The Flutter web adapter treats an idle camera as ready even before a base
  // tile arrives. Subscribe when the SDK constructs each map, including when
  // two screens have maps alive at once.
  function observeTiles() {
    const MapView = window.google.maps.Map;
    window.google.maps.Map = class extends MapView {
      constructor(...args) {
        super(...args);
        const id = this.getDiv().id;
        let finish;
        const rendered = new Promise(resolve => { finish = resolve; });
        firstTiles.set(id, rendered);
        const listener = this.addListener('tilesloaded', () => {
          listener.remove();
          finish(true);
        });
        // A view can be removed while Dart is still waiting for onMapCreated.
        setTimeout(() => {
          listener.remove();
          if (firstTiles.get(id) === rendered) firstTiles.delete(id);
          finish(false);
        }, 15000);
      }
    };
  }
  window.bookingDuoFirstMapTiles = (mapId) => {
    const id = 'plugins.flutter.io/google_maps_' + mapId;
    const result = firstTiles.get(id);
    firstTiles.delete(id);
    return result ?? Promise.resolve(false);
  };
  window.bookingDuoGoogleMapsStatus = 'idle';
  const mark = (status) => {
    window.bookingDuoGoogleMapsStatus = status;
    window.dispatchEvent(new Event('bookingduo-google-maps-status'));
  };
  window.bookingDuoLoadGoogleMaps = () => {
    const { protocol, hostname, port } = window.location;
    if (protocol !== 'https:' || (port && port !== '443') ||
        (hostname !== 'haimom1221.github.io' && !hostname.endsWith('.claudeusercontent.com'))) {
      return Promise.resolve(false);
    }
    if (window.bookingDuoGoogleMapsStatus !== 'failed' && attempt) return attempt;
    const key = document.querySelector('meta[name="bookingduo-maps-client"]')?.content;
    if (!key) return Promise.resolve(false);
    const id = ++generation;
    const callback = 'bookingDuoGoogleSdkReady' + id;
    // The Maps bootstrap skips initialization if a failed SDK still owns the namespace.
    if (script && window.google?.maps) delete window.google.maps;
    script?.remove();
    attempt = new Promise((resolve) => {
      let finished = false;
      script = document.createElement('script');
      const settle = (ok) => {
        if (id !== generation || (finished && ok)) return;
        finished = true;
        clearTimeout(timeout);
        mark(ok ? 'ready' : 'failed');
        resolve(ok);
      };
      const timeout = setTimeout(() => {
        // A stalled script can still call back after a new attempt has started.
        window[callback] = () => { delete window[callback]; };
        settle(false);
      }, 12000);
      window.gm_authFailure = () => settle(false);
      window[callback] = () => {
        delete window[callback];
        const ready = typeof window.google?.maps?.Map === 'function';
        if (ready && id === generation && !finished) observeTiles();
        settle(ready);
      };
      script.onerror = () => {
        delete window[callback];
        settle(false);
      };
      const url = new URL('https://maps.googleapis.com/maps/api/js');
      url.search = new URLSearchParams({ key, v: 'quarterly', loading: 'async', callback });
      script.src = url.href;
      script.async = true;
      script.referrerPolicy = 'strict-origin-when-cross-origin';
      mark('loading');
      document.head.appendChild(script);
    });
    return attempt;
  };
})();
