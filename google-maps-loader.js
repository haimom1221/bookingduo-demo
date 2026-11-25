// The SDK is loaded on the first eligible map, after the app has opened.
(() => {
  let attempt;
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
    if (window.bookingDuoGoogleMapsStatus === 'failed') return Promise.resolve(false);
    if (attempt) return attempt;
    const key = document.querySelector('meta[name="bookingduo-maps-client"]')?.content;
    if (!key) return Promise.resolve(false);
    attempt = new Promise((resolve) => {
      let finished = false;
      const script = document.createElement('script');
      const settle = (ok) => {
        if (finished && ok) return;
        finished = true;
        clearTimeout(timeout);
        mark(ok ? 'ready' : 'failed');
        resolve(ok);
      };
      const timeout = setTimeout(() => settle(false), 12000);
      window.gm_authFailure = () => settle(false);
      window.bookingDuoGoogleSdkReady = () => settle(typeof window.google?.maps?.Map === 'function');
      script.onerror = () => settle(false);
      const url = new URL('https://maps.googleapis.com/maps/api/js');
      url.search = new URLSearchParams({ key, v: 'quarterly', loading: 'async', callback: 'bookingDuoGoogleSdkReady' });
      script.src = url.href;
      script.async = true;
      script.referrerPolicy = 'strict-origin-when-cross-origin';
      mark('loading');
      document.head.appendChild(script);
    });
    return attempt;
  };
})();
