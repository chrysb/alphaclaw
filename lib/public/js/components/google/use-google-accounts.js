import { useCallback, useEffect, useState } from "https://esm.sh/preact/hooks";
import { fetchGoogleAccounts } from "../../lib/api.js";

export const useGoogleAccounts = ({ gatewayStatus }) => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasCompanyCredentials, setHasCompanyCredentials] = useState(false);
  const [hasPersonalCredentials, setHasPersonalCredentials] = useState(false);

  const refreshAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchGoogleAccounts();
      if (data.ok) {
        setAccounts(Array.isArray(data.accounts) ? data.accounts : []);
        setHasCompanyCredentials(Boolean(data.hasCompanyCredentials));
        setHasPersonalCredentials(Boolean(data.hasPersonalCredentials));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAccounts();
  }, [refreshAccounts]);

  useEffect(() => {
    if (gatewayStatus === "running") {
      refreshAccounts();
    }
  }, [gatewayStatus, refreshAccounts]);

  return {
    accounts,
    loading,
    hasCompanyCredentials,
    hasPersonalCredentials,
    refreshAccounts,
  };
};
