const fs = require("fs");
const os = require("os");
const path = require("path");
const {
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
  getGoogleAccountByEmail,
  upsertGoogleAccount,
  removeGoogleAccount,
  hasPersonalGoogleAccount,
  getGmailPushConfig,
  setGmailPushConfig,
  getAccountGmailWatch,
  setAccountGmailWatch,
  listWatchEnabledAccounts,
  generatePushToken,
  allocateServePort,
} = require("../../lib/server/google-state");

const createRecordingFs = (initialFiles = {}) => {
  const files = new Map(
    Object.entries(initialFiles).map(([filePath, contents]) => [
      filePath,
      String(contents),
    ]),
  );
  const writes = [];
  return {
    files,
    writes,
    existsSync: (filePath) => files.has(filePath),
    readFileSync: (filePath) => {
      if (!files.has(filePath)) throw new Error(`ENOENT: ${filePath}`);
      return files.get(filePath);
    },
    writeFileSync: (filePath, contents) => {
      files.set(filePath, String(contents));
      writes.push(filePath);
    },
  };
};

const baseAccount = (overrides = {}) => ({
  id: "acct-1",
  email: "ops@example.com",
  client: "default",
  personal: false,
  services: ["gmail:read"],
  authenticated: true,
  gmailWatch: {},
  ...overrides,
});

let tmpDirs = [];
afterEach(() => {
  for (const dir of tmpDirs) fs.rmSync(dir, { recursive: true, force: true });
  tmpDirs = [];
});

describe("server/google-state basics", () => {
  it("creates an empty state with the current version", () => {
    expect(createEmptyGoogleState()).toEqual({
      version: kGoogleStateVersion,
      accounts: [],
      gmailPush: { token: "", topics: {} },
    });
  });

  it("generates hex account ids and base64url push tokens", () => {
    expect(createGoogleAccountId()).toMatch(/^[0-9a-f]{8}$/);
    expect(generatePushToken()).toMatch(/^[A-Za-z0-9_-]{32}$/);
  });
});

describe("server/google-state readGoogleState", () => {
  it("returns an empty state when the file does not exist", () => {
    const mockFs = createRecordingFs();
    expect(readGoogleState({ fs: mockFs, statePath: "/tmp/none.json" })).toEqual(
      createEmptyGoogleState(),
    );
    expect(mockFs.writes).toEqual([]);
  });

  it("returns an empty state when the file has malformed JSON", () => {
    const statePath = "/tmp/state.json";
    const mockFs = createRecordingFs({ [statePath]: "{oops" });
    expect(readGoogleState({ fs: mockFs, statePath })).toEqual(
      createEmptyGoogleState(),
    );
  });

  it("reads an already-normalized v2 state without rewriting it", () => {
    const statePath = "/tmp/state.json";
    const mockFs = createRecordingFs();
    const written = writeGoogleState({
      fs: mockFs,
      statePath,
      state: { version: 2, accounts: [baseAccount()], gmailPush: { token: "t" } },
    });
    mockFs.writes.length = 0;
    const read = readGoogleState({ fs: mockFs, statePath });
    expect(read).toEqual(written);
    expect(mockFs.writes).toEqual([]);
  });

  it("rewrites v2 state that requires normalization", () => {
    const statePath = "/tmp/state.json";
    const mockFs = createRecordingFs({
      [statePath]: JSON.stringify({
        version: 2,
        accounts: [
          {
            id: "acct-1",
            email: "  ops@example.com  ",
            services: "not-an-array",
            gmailWatch: { enabled: true, port: "18801", pid: "42", expiration: "abc" },
          },
        ],
        gmailPush: { token: 42, topics: "nope" },
      }),
    });
    const read = readGoogleState({ fs: mockFs, statePath });
    expect(mockFs.writes).toEqual([statePath]);
    expect(read.accounts[0]).toEqual({
      id: "acct-1",
      email: "ops@example.com",
      client: kDefaultGoogleClient,
      personal: false,
      services: [...kDefaultGoogleScopes],
      authenticated: false,
      gmailWatch: {
        enabled: true,
        port: 18801,
        expiration: null,
        lastPushAt: null,
        pid: 42,
      },
    });
    expect(read.gmailPush).toEqual({ token: "42", topics: {} });
  });

  it("migrates a v1 state that has an email", () => {
    const statePath = "/tmp/state.json";
    const mockFs = createRecordingFs({
      [statePath]: JSON.stringify({
        email: "legacy@example.com",
        services: ["gmail:read", "gmail:read", ""],
        authenticated: true,
      }),
    });
    const migrated = readGoogleState({ fs: mockFs, statePath });
    expect(migrated.version).toBe(kGoogleStateVersion);
    expect(migrated.accounts).toHaveLength(1);
    expect(migrated.accounts[0]).toMatchObject({
      email: "legacy@example.com",
      client: kDefaultGoogleClient,
      personal: false,
      services: ["gmail:read"],
      authenticated: true,
    });
    expect(mockFs.writes).toEqual([statePath]);
  });

  it("migrates a v1 state without an email to an empty account list", () => {
    const statePath = "/tmp/state.json";
    const mockFs = createRecordingFs({ [statePath]: JSON.stringify({}) });
    const migrated = readGoogleState({ fs: mockFs, statePath });
    expect(migrated.accounts).toEqual([]);
    expect(migrated.gmailPush).toEqual({ token: "", topics: {} });
  });

  it("treats a JSON null file as a v1 migration with defaults", () => {
    const statePath = "/tmp/state.json";
    const mockFs = createRecordingFs({ [statePath]: "null" });
    const migrated = readGoogleState({ fs: mockFs, statePath });
    expect(migrated).toEqual({
      version: kGoogleStateVersion,
      accounts: [],
      gmailPush: { token: "", topics: {} },
    });
  });

  it("round-trips state via the real filesystem", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "alphaclaw-gstate-"));
    tmpDirs.push(dir);
    const statePath = path.join(dir, "state.json");
    writeGoogleState({
      fs,
      statePath,
      state: {
        version: 2,
        accounts: [baseAccount({ personal: true, email: "me@gmail.com" })],
        gmailPush: { token: "tok", topics: { default: "projects/p/topics/t" } },
      },
    });
    const read = readGoogleState({ fs, statePath });
    expect(read.accounts[0].personal).toBe(true);
    expect(read.gmailPush.topics.default).toBe("projects/p/topics/t");
  });
});

describe("server/google-state normalization", () => {
  it("defaults scopes when services are missing or empty", () => {
    const missing = writeGoogleState({
      fs: createRecordingFs(),
      statePath: "/tmp/a.json",
      state: { version: 2, accounts: [baseAccount({ services: undefined })] },
    });
    expect(missing.accounts[0].services).toEqual([...kDefaultGoogleScopes]);
    const empties = writeGoogleState({
      fs: createRecordingFs(),
      statePath: "/tmp/b.json",
      state: { version: 2, accounts: [baseAccount({ services: ["", "  "] })] },
    });
    expect(empties.accounts[0].services).toEqual([...kDefaultGoogleScopes]);
  });

  it("infers personal accounts from client and email heuristics", () => {
    const normalize = (account) =>
      writeGoogleState({
        fs: createRecordingFs(),
        statePath: "/tmp/p.json",
        state: { version: 2, accounts: [account] },
      }).accounts[0];
    expect(normalize(baseAccount({ personal: true }))).toMatchObject({
      personal: true,
    });
    expect(
      normalize(baseAccount({ personal: undefined, client: "personal" })),
    ).toMatchObject({ personal: true });
    expect(
      normalize(baseAccount({ personal: undefined, email: "me@GMAIL.com" })),
    ).toMatchObject({ personal: true });
    expect(
      normalize(baseAccount({ personal: undefined, email: "me@googlemail.com" })),
    ).toMatchObject({ personal: true });
    expect(
      normalize(baseAccount({ personal: undefined, email: "me@corp.com" })),
    ).toMatchObject({ personal: false });
  });

  it("generates ids for accounts that are missing one", () => {
    const normalized = writeGoogleState({
      fs: createRecordingFs(),
      statePath: "/tmp/id.json",
      state: { version: 2, accounts: [baseAccount({ id: "" })] },
    });
    expect(normalized.accounts[0].id).toMatch(/^[0-9a-f]{8}$/);
  });

  it("normalizes gmail watch fields", () => {
    expect(getAccountGmailWatch()).toEqual({
      enabled: false,
      port: null,
      expiration: null,
      lastPushAt: null,
      pid: null,
    });
    expect(
      getAccountGmailWatch({
        gmailWatch: {
          enabled: false,
          port: 18801,
          pid: 42,
          expiration: 123,
          lastPushAt: 456,
        },
      }),
    ).toEqual({
      enabled: false,
      port: null,
      expiration: 123,
      lastPushAt: 456,
      pid: null,
    });
    expect(
      getAccountGmailWatch({
        gmailWatch: { enabled: true, port: "18802", pid: "9", lastPushAt: "-5" },
      }),
    ).toEqual({
      enabled: true,
      port: 18802,
      expiration: null,
      lastPushAt: null,
      pid: 9,
    });
  });

  it("normalizes gmail push config", () => {
    expect(getGmailPushConfig({})).toEqual({ token: "", topics: {} });
    expect(
      getGmailPushConfig({
        gmailPush: {
          token: "  tok  ",
          topics: {
            default: " projects/p/topics/t ",
            "": "projects/p/topics/x",
            work: "",
          },
        },
      }),
    ).toEqual({ token: "tok", topics: { default: "projects/p/topics/t" } });
    expect(getGmailPushConfig({ gmailPush: { topics: "junk" } })).toEqual({
      token: "",
      topics: {},
    });
  });
});

describe("server/google-state account queries", () => {
  const state = {
    version: 2,
    accounts: [
      baseAccount(),
      baseAccount({ id: "acct-2", email: "Two@Example.com", client: "work" }),
    ],
    gmailPush: { token: "", topics: {} },
  };

  it("lists accounts as a copy", () => {
    const listed = listGoogleAccounts(state);
    expect(listed).toHaveLength(2);
    listed.pop();
    expect(state.accounts).toHaveLength(2);
    expect(listGoogleAccounts()).toEqual([]);
  });

  it("finds accounts by id", () => {
    expect(getGoogleAccountById(state, "acct-2")?.email).toBe("Two@Example.com");
    expect(getGoogleAccountById(state, "missing")).toBeNull();
    expect(getGoogleAccountById()).toBeNull();
  });

  it("finds accounts by email and client", () => {
    expect(
      getGoogleAccountByEmailAndClient(state, "Two@Example.com", "work")?.id,
    ).toBe("acct-2");
    expect(
      getGoogleAccountByEmailAndClient(state, "Two@Example.com", "default"),
    ).toBeNull();
    expect(getGoogleAccountByEmailAndClient()).toBeNull();
  });

  it("finds accounts by email case-insensitively", () => {
    expect(getGoogleAccountByEmail(state, "two@example.COM")?.id).toBe("acct-2");
    expect(getGoogleAccountByEmail(state, "")).toBeNull();
    expect(getGoogleAccountByEmail(state, "nobody@example.com")).toBeNull();
    expect(getGoogleAccountByEmail()).toBeNull();
  });

  it("detects personal accounts", () => {
    expect(hasPersonalGoogleAccount(state)).toBe(false);
    expect(
      hasPersonalGoogleAccount({ accounts: [{ personal: true }] }),
    ).toBe(true);
    expect(hasPersonalGoogleAccount()).toBe(false);
  });
});

describe("server/google-state mutations", () => {
  it("merges gmail push config updates", () => {
    const initial = {
      version: 2,
      accounts: [],
      gmailPush: { token: "old", topics: { default: "projects/p/topics/a" } },
    };
    const updated = setGmailPushConfig({
      state: initial,
      config: { token: "new", topics: { work: "projects/p/topics/b" } },
    });
    expect(updated.gmailPush).toEqual({
      token: "new",
      topics: {
        default: "projects/p/topics/a",
        work: "projects/p/topics/b",
      },
    });
    expect(updated.state.gmailPush).toBe(updated.gmailPush);
    const defaults = setGmailPushConfig({});
    expect(defaults.gmailPush).toEqual({ token: "", topics: {} });
  });

  it("updates gmail watch state for a known account", () => {
    const state = {
      version: 2,
      accounts: [baseAccount({ gmailWatch: { enabled: true, port: 18801 } })],
      gmailPush: {},
    };
    const updated = setAccountGmailWatch({
      state,
      accountId: "acct-1",
      watch: { expiration: 999, pid: 42 },
    });
    expect(updated.account.gmailWatch).toEqual({
      enabled: true,
      port: 18801,
      expiration: 999,
      lastPushAt: null,
      pid: 42,
    });
    expect(updated.state.accounts[0]).toBe(updated.account);
  });

  it("ignores gmail watch updates for blank or unknown account ids", () => {
    expect(setAccountGmailWatch({ state: {}, accountId: "  " }).account).toBeNull();
    expect(
      setAccountGmailWatch({ state: {}, accountId: "missing" }).account,
    ).toBeNull();
    expect(setAccountGmailWatch({}).account).toBeNull();
  });

  it("lists watch-enabled accounts", () => {
    const state = {
      accounts: [
        baseAccount({ gmailWatch: { enabled: true, port: 18801 } }),
        baseAccount({ id: "acct-2", gmailWatch: { enabled: false } }),
        baseAccount({ id: "acct-3" }),
      ],
    };
    expect(listWatchEnabledAccounts(state).map((a) => a.id)).toEqual(["acct-1"]);
    expect(listWatchEnabledAccounts()).toEqual([]);
  });
});

describe("server/google-state allocateServePort", () => {
  it("returns the first free port", () => {
    expect(allocateServePort({ state: { accounts: [] } })).toBe(18801);
    expect(
      allocateServePort({
        state: {
          accounts: [
            { gmailWatch: { port: 18801 } },
            { gmailWatch: { port: 18802 } },
            {},
          ],
        },
      }),
    ).toBe(18803);
  });

  it("returns null when all ports are used", () => {
    expect(
      allocateServePort({
        state: {
          accounts: [
            { gmailWatch: { port: 20001 } },
            { gmailWatch: { port: 20002 } },
          ],
        },
        basePort: 20001,
        maxAccounts: 2,
      }),
    ).toBeNull();
    expect(allocateServePort({ state: {}, maxAccounts: 0 })).toBeNull();
    expect(allocateServePort({})).toBe(18801);
  });
});

describe("server/google-state upsert/remove", () => {
  it("requires an email", () => {
    expect(() =>
      upsertGoogleAccount({ state: {}, account: baseAccount({ email: "" }) }),
    ).toThrow("Account email is required");
  });

  it("allows only one personal account", () => {
    const withPersonal = upsertGoogleAccount({
      state: createEmptyGoogleState(),
      account: baseAccount({ id: "p1", personal: true }),
    }).state;
    expect(() =>
      upsertGoogleAccount({
        state: withPersonal,
        account: baseAccount({ id: "p2", email: "two@example.com", personal: true }),
      }),
    ).toThrow("Only one personal account is allowed");
    const updated = upsertGoogleAccount({
      state: withPersonal,
      account: baseAccount({ id: "p1", email: "new@example.com", personal: true }),
    });
    expect(updated.account.email).toBe("new@example.com");
    expect(updated.state.accounts).toHaveLength(1);
  });

  it("replaces an existing account by id", () => {
    const state = {
      version: 2,
      accounts: [baseAccount()],
      gmailPush: {},
    };
    const updated = upsertGoogleAccount({
      state,
      account: baseAccount({ email: "changed@example.com" }),
    });
    expect(updated.state.accounts).toHaveLength(1);
    expect(updated.state.accounts[0].email).toBe("changed@example.com");
  });

  it("enforces the max account limit", () => {
    const state = {
      version: 2,
      accounts: [baseAccount(), baseAccount({ id: "acct-2", email: "b@x.com" })],
      gmailPush: {},
    };
    expect(() =>
      upsertGoogleAccount({
        state,
        account: baseAccount({ id: "acct-3", email: "c@x.com" }),
        maxAccounts: 2,
      }),
    ).toThrow("Maximum 2 Google accounts allowed");
    const added = upsertGoogleAccount({
      state,
      account: baseAccount({ id: "acct-3", email: "c@x.com" }),
      maxAccounts: 3,
    });
    expect(added.state.accounts).toHaveLength(3);
  });

  it("removes accounts by id", () => {
    const state = {
      version: 2,
      accounts: [baseAccount(), baseAccount({ id: "acct-2", email: "b@x.com" })],
      gmailPush: {},
    };
    const removed = removeGoogleAccount({ state, accountId: "acct-1" });
    expect(removed.account?.id).toBe("acct-1");
    expect(removed.state.accounts.map((a) => a.id)).toEqual(["acct-2"]);
    const missing = removeGoogleAccount({ state, accountId: "nope" });
    expect(missing.account).toBeNull();
    expect(missing.state.accounts).toHaveLength(2);
  });
});
