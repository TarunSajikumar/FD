window.apiFetch = window.apiFetch || function(url, opts = {}) {
  if (window.FPAPI && typeof window.FPAPI.fetch === 'function') {
    return window.FPAPI.fetch(url, opts);
  }
  return window.fetch(url, opts).then(async (res) => {
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      const err = new Error('API error ' + res.status + ' ' + text);
      err.status = res.status;
      throw err;
    }
    return res.json().catch(() => null);
  });
};
