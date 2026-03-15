import { useCallback, useEffect, useMemo, useRef } from "https://esm.sh/preact/hooks";
import { fetchGoogleAccounts } from "../../lib/api.js";
import { useCachedFetch } from "../../hooks/use-cached-fetch.js";

export const useGoogleAccounts = ({ gatewayStatus }) => {
  const hasRefreshedAfterGatewayRunningRef = useRef(false);
  const { data, loading, refresh } = useCachedFetch(
    "/api/google/accounts",
    fetchGoogleAccounts,
    { maxAgeMs: 30000 },
  );

  const accounts = useMemo(
    () => (Array.isArray(data?.accounts) ? data.accounts : []),
    [data?.accounts],
  );
  const hasCompanyCredentials = Boolean(data?.hasCompanyCredentials);
  const hasPersonalCredentials = Boolean(data?.hasPersonalCredentials);

  const refreshAccounts = useCallback(async () => {
    return refresh({ force: true });
  }, [refresh]);

  useEffect(() => {
    if (gatewayStatus !== "running") {
      hasRefreshedAfterGatewayRunningRef.current = false;
      return;
    }
    if (hasRefreshedAfterGatewayRunningRef.current) return;
    hasRefreshedAfterGatewayRunningRef.current = true;
    refreshAccounts().catch(() => {});
  }, [gatewayStatus, refreshAccounts]);

  return {
    accounts,
    loading,
    hasCompanyCredentials,
    hasPersonalCredentials,
    refreshAccounts,
  };
};
