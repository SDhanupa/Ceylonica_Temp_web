import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';

/* ── Types (mirror ContributionController responses) ─────────────────────── */

export interface VillageCategoryProgress {
  slug: string;
  name_en: string;
  name_si: string | null;
  name_ta: string | null;
  records: number;
  in_review: number;
  topics_total: number;
  topics_covered: number;
}

export interface VillageProgress {
  village: {
    ccode: string;
    name_en: string | null;
    name_si: string | null;
    name_ta: string | null;
    ds_en: string | null;
    district_en: string | null;
  };
  summary: {
    records: number;
    in_review: number;
    contributors: number;
    businesses_surveyed: number;
    categories_total: number;
    categories_covered: number;
    topics_total: number;
    topics_covered: number;
    completion: number;
  };
  categories: VillageCategoryProgress[];
  generated_at: string;
}

export type ContributionStatus = 'pending' | 'approved' | 'rejected' | 'draft' | 'submitted';

export interface MyContribution {
  id: string;
  kind: 'place' | 'business_survey';
  title: string | null;
  category: { slug: string; name_en: string; name_si?: string | null; root_slug: string | null; root_name_en: string | null } | null;
  village: string | null;
  ccode?: string | null;
  reg_number: string | null;
  status: ContributionStatus;
  is_update: boolean;
  created_at: string | null;
  full_data?: any;
}

export interface MyContributions {
  summary: { total: number; approved: number; in_review: number; drafts: number; villages: number };
  items: MyContribution[];
}

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

const readError = async (res: Response): Promise<ApiError> => {
  const body = await res.json().catch(() => null);
  const first = body?.errors && Object.values(body.errors)[0];
  const message = (Array.isArray(first) && first[0]) || body?.message || body?.error || `Request failed (${res.status})`;
  return new ApiError(String(message), res.status);
};

/* ── Generic loader ──────────────────────────────────────────────────────── */

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => void;
}

/**
 * Loads once per `key`, ignores responses that arrive after the key changed or
 * the component unmounted, and exposes a manual refetch.
 */
function useApi<T>(key: string | null, load: (signal: AbortSignal) => Promise<T>): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(key !== null);
  const [error, setError] = useState<ApiError | null>(null);
  const [nonce, setNonce] = useState(0);
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    if (key === null) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    loadRef
      .current(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setData(result);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof ApiError ? err : new ApiError(err?.message || 'Network error', 0));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [key, nonce]);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);
  return { data, loading, error, refetch };
}

/* ── Hooks ───────────────────────────────────────────────────────────────── */

export const useVillageProgress = (ccode: string | null | undefined) =>
  useApi<VillageProgress>(ccode ? `village:${ccode}` : null, async (signal) => {
    const res = await fetch(`/api/contributions/village/${encodeURIComponent(ccode as string)}`, {
      signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw await readError(res);
    return (await res.json()).data as VillageProgress;
  });

export const useMyContributions = () => {
  const { getToken, isAuthenticated } = useAuth();
  return useApi<MyContributions>(isAuthenticated ? 'mine' : null, async (signal) => {
    const token = await getToken();
    if (!token) throw new ApiError('Your session has expired. Please sign in again.', 401);
    const res = await fetch('/api/contributions/mine', {
      signal,
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw await readError(res);
    return (await res.json()).data as MyContributions;
  });
};

/* ── Submission ──────────────────────────────────────────────────────────── */

export interface SubmitResult {
  reg_number: string | null;
  status: 'pending';
  is_update_proposal: boolean;
  credited: boolean;
}

export const submitContribution = async (
  slug: string,
  payload: Record<string, unknown>,
  token: string | undefined,
): Promise<SubmitResult> => {
  const res = await fetch(`/api/submit-survey-data/${encodeURIComponent(slug)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      // Anonymous contributions are allowed; a token only adds attribution.
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await readError(res);
  const body = await res.json();
  if (!body?.success) throw new ApiError(body?.message || 'Submission failed', res.status);
  return body as SubmitResult;
};
