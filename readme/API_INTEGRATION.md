# API Integration — siteLeader-admin

## Axios instance

**File:** `src/lib/axios.ts`

```typescript
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,   // sends HttpOnly cookies automatically
});
```

Import `axiosInstance` everywhere. Never use `axios` directly.

---

## Request interceptor

```typescript
axiosInstance.interceptors.request.use((config) => {
  setLoading(true);  // Zustand global loader
  const token = localStorage.getItem('token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  if (['post', 'put', 'patch'].includes(config.method!) && !config.data) {
    config.data = {};
  }
  return config;
});
```

---

## Response interceptor

```typescript
axiosInstance.interceptors.response.use(
  (response) => { setLoading(false); return response; },
  (error) => {
    setLoading(false);
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## API endpoint constants

**File:** `src/constants/apiEndpoints.ts`

Always import from here. Never hardcode API paths.

### Structure (key sections)

```typescript
export const API = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REGISTER: '/api/auth/register',
  },
  SITES: {
    LIST: '/api/sites',
    DETAIL: (id: string) => `/api/sites/${id}`,
    STATS: (id: string) => `/api/sites/${id}/stats`,
    ASSIGN_LABOUR: '/api/sites/assign-labour',
    ATTENDANCE: '/api/sites/attendance',
    ATTENDANCE_SUMMARY: (id: string) => `/api/sites/${id}/attendance/summary`,
    LOGS: '/api/sites/logs',
    SITE_LOGS: (id: string) => `/api/sites/${id}/logs`,
  },
  LABOURS: {
    LIST: '/api/labours',
    DETAIL: (id: string) => `/api/labours/${id}`,
  },
  MATERIALS: {
    LIST: '/api/materials',
    DETAIL: (id: string) => `/api/materials/${id}`,
    LOG: '/api/materials/log',
    LOGS: '/api/materials/logs',
  },
  FINANCE: {
    LIST: '/api/finance',
    DETAIL: (id: string) => `/api/finance/${id}`,
  },
  QUOTATIONS: {
    LIST: '/api/quotations',
    DETAIL: (id: string) => `/api/quotations/${id}`,
  },
  ADMIN: {
    PROFILE: '/api/admin/profile',
    STATS: '/api/admin/dashboard-stats',
  },
};
```

---

## Error handling in components

```typescript
try {
  await axiosInstance.post(API.SITES.LIST, payload);
  toast.success('Site created successfully');
  fetchSites();
  setOpen(false);
} catch (err: any) {
  toast.error(err?.response?.data?.message || 'Something went wrong');
} finally {
  setDialogLoading(false);
}
```

Always show a toast on error with the backend message as fallback.

---

## Image domains

`next.config.ts` allows remote images from:
- `d1ee7knodiza2n.cloudfront.net`
- `d3apo1dvh0os5u.cloudfront.net`

These are the CloudFront CDN domains serving S3-uploaded files.

---

*Last updated: 2026-04-17*
