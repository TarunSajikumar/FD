window.FPAPI = window.FPAPI || {
  baseUrl() {
    return (window.FP && window.FP.API_BASE ? window.FP.API_BASE : '/api').replace(/\/$/, '');
  },

  authHeaders() {
    const headers = {};
    try {
      const token = localStorage.getItem('fp_owner_token') || localStorage.getItem('fp_token');
      if (token) headers.Authorization = 'Bearer ' + token;
    } catch (e) {
      // ignore storage errors in private mode
    }
    return headers;
  },

  async fetch(path, opts = {}) {
    let url = String(path || '');
    const base = this.baseUrl();
    if (!/^https?:\/\//i.test(url)) {
      if (url.startsWith(base)) {
        // already a full API path
      } else if (url.startsWith('/')) {
        url = base + url;
      } else {
        url = base + '/' + url.replace(/^\/+/, '');
      }
    }

    const options = Object.assign({}, opts);
    options.headers = Object.assign({}, this.authHeaders(), options.headers || {});

    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }

    const res = await window.fetch(url, options);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      const error = new Error('API error ' + res.status + ' ' + text);
      error.status = res.status;
      throw error;
    }

    return res.text().then((text) => {
      try {
        return text ? JSON.parse(text) : null;
      } catch (e) {
        return null;
      }
    });
  },

  get(path) { return this.fetch(path, { method: 'GET' }); },
  post(path, body) { return this.fetch(path, { method: 'POST', body }); },
  put(path, body) { return this.fetch(path, { method: 'PUT', body }); },
  delete(path, body) { return this.fetch(path, { method: 'DELETE', body }); }
};
