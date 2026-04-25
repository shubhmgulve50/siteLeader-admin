# State Management — siteLeader-admin

## Pattern overview

Minimal global state. Most state is component-local (`useState`). Zustand handles only the global loading overlay.

---

## Zustand — global loader

**Location:** `src/components/Loader.tsx` (store defined inline with component)

### Store shape

```typescript
interface LoaderState {
  loading: boolean;
  setLoading: (value: boolean) => void;
}
```

### Hook

```typescript
const { loading, setLoading } = useLoader();
```

### Usage

The Axios instance in `src/lib/axios.ts` is the **only** place that calls `setLoading`.
- Request interceptor: `setLoading(true)`
- Response interceptor (success + error): `setLoading(false)`

The `Loader` component subscribes to `loading` and renders a full-screen overlay when true.

Do not call `setLoading` directly in page components — let the Axios interceptors control it.

---

## Local component state patterns

### Page-level state

```typescript
const [data, setData] = useState<T[]>([]);
const [loading, setLoading] = useState(true);      // table fetch loading
const [open, setOpen] = useState(false);            // dialog open/close
const [selected, setSelected] = useState<T | null>(null); // editing target
const [dialogLoading, setDialogLoading] = useState(false); // dialog submit loading
```

### Form state

All form state goes through React Hook Form (`useForm`). Do not use `useState` for individual form fields.

```typescript
const { register, handleSubmit, reset, formState: { errors } } = useForm<FormShape>({
  resolver: zodResolver(schema),
});
```

On dialog close: call `reset()` to clear form state.

---

## Data fetching pattern

No SWR, React Query, or server components for data fetching. All data is fetched client-side in `useEffect`:

```typescript
const fetchData = async () => {
  setLoading(true);
  try {
    const res = await axiosInstance.get(API.FEATURE.LIST);
    setData(res.data.data);
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Failed to load');
  } finally {
    setLoading(false);
  }
};

useEffect(() => { fetchData(); }, []);
```

The global Zustand loader handles the full-screen overlay via Axios interceptors. The `loading` state above drives table skeletons independently.

---

*Last updated: 2026-04-17*
