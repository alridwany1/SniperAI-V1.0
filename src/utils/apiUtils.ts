export async function safeFetchJson<T = any>(url: string, options?: RequestInit): Promise<T> {
  const isApiCall = (url.startsWith('/api') || url.includes('/api/')) && !url.includes('/api/auth/');
  if (isApiCall) {
    options = options || {};
    const headers = new Headers(options.headers || {});
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    const tenantId = typeof window !== 'undefined' ? (localStorage.getItem('selectedTenantId') || localStorage.getItem('tenantId')) : null;
    if (tenantId && !headers.has('X-Tenant-ID')) {
      headers.set('X-Tenant-ID', tenantId);
    }
    options.headers = headers;
  }

  const res = await fetch(url, options);
  const contentType = res.headers.get('content-type') || '';

  if (!res.ok) {
    let errorMsg = `HTTP ${res.status} ${res.statusText}`;
    if (contentType.includes('application/json')) {
      try {
        const errData = await res.json();
        errorMsg = errData.message || errData.error || errData.details || errorMsg;
      } catch (_) {}
    } else {
      const text = await res.text();
      if (text.trim().startsWith('<')) {
        errorMsg = `Server error (${res.status}): API endpoint returned HTML.`;
      } else if (text) {
        errorMsg = text.slice(0, 200);
      }
    }
    throw new Error(errorMsg);
  }

  if (contentType.includes('application/json')) {
    return await res.json();
  }

  const text = await res.text();
  if (!text || text.trim() === '') {
    return {} as T;
  }

  if (text.trim().startsWith('<')) {
    throw new Error(`Expected JSON from ${url}, but received HTML.`);
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`Failed to parse JSON response from ${url}`);
  }
}
