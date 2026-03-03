const crypto = require("crypto");

const kGoogleStateVersion = 2;
const kDefaultGoogleClient = "default";
const kDefaultGoogleScopes = [
  "gmail:read",
  "calendar:read",
  "calendar:write",
  "drive:read",
  "sheets:read",
  "docs:read",
];

const createEmptyGoogleState = () => ({
  version: kGoogleStateVersion,
  accounts: [],
});

const createGoogleAccountId = () => crypto.randomBytes(4).toString("hex");

const normalizeScopes = (services) => {
  if (!Array.isArray(services)) return [...kDefaultGoogleScopes];
  const deduped = Array.from(
    new Set(
      services
        .map((scope) => String(scope || "").trim())
        .filter(Boolean),
    ),
  );
  return deduped.length ? deduped : [...kDefaultGoogleScopes];
};

const normalizeGoogleAccount = (account = {}) => ({
  id: String(account.id || createGoogleAccountId()),
  email: String(account.email || "").trim(),
  client: String(account.client || kDefaultGoogleClient).trim() || kDefaultGoogleClient,
  personal: Boolean(account.personal),
  services: normalizeScopes(account.services),
  authenticated: Boolean(account.authenticated),
});

const normalizeGoogleStateV2 = (state = {}) => {
  const accounts = Array.isArray(state.accounts)
    ? state.accounts.map((account) => normalizeGoogleAccount(account))
    : [];
  return {
    version: kGoogleStateVersion,
    accounts,
  };
};

const hasPersonalGoogleAccount = (state = {}) =>
  (state.accounts || []).some((account) => account.personal);

const writeGoogleState = ({ fs, statePath, state }) => {
  const normalized = normalizeGoogleStateV2(state);
  fs.writeFileSync(statePath, JSON.stringify(normalized, null, 2));
  return normalized;
};

const migrateGoogleStateV1 = ({ fs, statePath, rawState = {} }) => {
  const email = String(rawState.email || "").trim();
  const accounts = email
    ? [
        normalizeGoogleAccount({
          id: createGoogleAccountId(),
          email,
          services: rawState.services,
          authenticated: Boolean(rawState.authenticated),
          client: kDefaultGoogleClient,
          personal: false,
        }),
      ]
    : [];
  const migrated = {
    version: kGoogleStateVersion,
    accounts,
  };
  fs.writeFileSync(statePath, JSON.stringify(migrated, null, 2));
  return migrated;
};

const readGoogleState = ({ fs, statePath }) => {
  if (!fs.existsSync(statePath)) return createEmptyGoogleState();
  try {
    const raw = JSON.parse(fs.readFileSync(statePath, "utf8"));
    if (raw && raw.version === kGoogleStateVersion && Array.isArray(raw.accounts)) {
      return normalizeGoogleStateV2(raw);
    }
    return migrateGoogleStateV1({ fs, statePath, rawState: raw || {} });
  } catch {
    return createEmptyGoogleState();
  }
};

const listGoogleAccounts = (state = {}) => [...(state.accounts || [])];

const getGoogleAccountById = (state = {}, accountId = "") =>
  (state.accounts || []).find((account) => account.id === accountId) || null;

const getGoogleAccountByEmailAndClient = (
  state = {},
  email = "",
  client = kDefaultGoogleClient,
) =>
  (state.accounts || []).find(
    (account) => account.email === email && account.client === client,
  ) || null;

const upsertGoogleAccount = ({
  state,
  account,
  maxAccounts = 5,
}) => {
  const nextState = normalizeGoogleStateV2(state);
  const normalized = normalizeGoogleAccount(account);
  if (!normalized.email) throw new Error("Account email is required");
  const existingIdx = nextState.accounts.findIndex((item) => item.id === normalized.id);

  if (normalized.personal) {
    const personalExists = nextState.accounts.some(
      (item, idx) => item.personal && idx !== existingIdx,
    );
    if (personalExists) {
      throw new Error("Only one personal account is allowed");
    }
  }

  if (existingIdx >= 0) {
    nextState.accounts[existingIdx] = normalized;
    return { state: nextState, account: normalized };
  }

  if (nextState.accounts.length >= maxAccounts) {
    throw new Error(`Maximum ${maxAccounts} Google accounts allowed`);
  }

  nextState.accounts.push(normalized);
  return { state: nextState, account: normalized };
};

const removeGoogleAccount = ({ state, accountId }) => {
  const nextState = normalizeGoogleStateV2(state);
  const removed = getGoogleAccountById(nextState, accountId);
  if (!removed) return { state: nextState, account: null };
  nextState.accounts = nextState.accounts.filter((account) => account.id !== accountId);
  return { state: nextState, account: removed };
};

module.exports = {
  kGoogleStateVersion,
  kDefaultGoogleClient,
  kDefaultGoogleScopes,
  createGoogleAccountId,
  createEmptyGoogleState,
  readGoogleState,
  writeGoogleState,
  listGoogleAccounts,
  getGoogleAccountById,
  getGoogleAccountByEmailAndClient,
  upsertGoogleAccount,
  removeGoogleAccount,
  hasPersonalGoogleAccount,
};
