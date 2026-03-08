export const buildApprovedImportSecrets = (secrets = []) =>
  (Array.isArray(secrets) ? secrets : [])
    .filter((secret) => secret?.confidence === "high")
    .map((secret) => ({
      ...secret,
      suggestedEnvVar: secret?.suggestedEnvVar || "",
    }));

export const buildApprovedImportVals = (approvedSecrets = []) =>
  (Array.isArray(approvedSecrets) ? approvedSecrets : []).reduce(
    (nextVals, secret) => {
      const envVar = String(secret?.suggestedEnvVar || "").trim();
      const value = String(secret?.value || "");
      if (!envVar || !value) return nextVals;
      nextVals[envVar] = value;
      return nextVals;
    },
    {},
  );
