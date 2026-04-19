import { API_CONFIG, API_ENDPOINTS } from "./api-constants";

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  
  const headers = new Headers(options.headers || {});
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  
  // For cookies like refresh_token
  options.credentials = 'include';
  
  let response = await fetch(`${API_CONFIG.BASE_URL}${url}`, {
    ...options,
    headers,
  });

  // Handle Token Refresh logic
  if (response.status === 401 && accessToken) {
    try {
      const refreshRes = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        if (data.access) {
          localStorage.setItem('access_token', data.access);
          
          // Retry original request
          headers.set('Authorization', `Bearer ${data.access}`);
          response = await fetch(`${API_CONFIG.BASE_URL}${url}`, {
            ...options,
            headers,
          });
        }
      } else {
        // Refresh failed, maybe logout
        localStorage.removeItem('access_token');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth_logout'));
        }
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
    }
  }

  return response;
}
