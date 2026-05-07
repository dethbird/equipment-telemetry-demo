import type { Asset, AssetDetail, WorkOrderRow } from '../types';

// Seed tenant ID used as default — override via VITE_TENANT_ID env var.
export const TENANT_ID: string =
  (import.meta.env.VITE_TENANT_ID as string | undefined) ??
  'a0000000-0000-0000-0000-000000000001';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GET ${path} → ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export function fetchAssets(): Promise<Asset[]> {
  return get<Asset[]>(`/assets?tenantId=${TENANT_ID}`);
}

export function fetchAssetDetail(id: string): Promise<AssetDetail> {
  return get<AssetDetail>(`/assets/${id}?tenantId=${TENANT_ID}`);
}

export function fetchWorkOrders(): Promise<WorkOrderRow[]> {
  return get<WorkOrderRow[]>(`/work-orders?tenantId=${TENANT_ID}`);
}
