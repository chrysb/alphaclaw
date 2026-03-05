const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");
const { ensureSchema } = require("./schema");
const { getDailySummary } = require("./summary");
const { getSessionsList, getSessionDetail } = require("./sessions");
const { getSessionTimeSeries } = require("./timeseries");
const { kGlobalModelPricing } = require("./pricing");

let db = null;
let usageDbPath = "";

const ensureDb = () => {
  if (!db) throw new Error("Usage DB not initialized");
  return db;
};

const initUsageDb = ({ rootDir }) => {
  const dbDir = path.join(rootDir, "db");
  fs.mkdirSync(dbDir, { recursive: true });
  usageDbPath = path.join(dbDir, "usage.db");
  db = new DatabaseSync(usageDbPath);
  ensureSchema(db);
  return { path: usageDbPath };
};

module.exports = {
  initUsageDb,
  getDailySummary: (options = {}) => getDailySummary({ database: ensureDb(), ...options }),
  getSessionsList: (options = {}) => getSessionsList({ database: ensureDb(), ...options }),
  getSessionDetail: (options = {}) => getSessionDetail({ database: ensureDb(), ...options }),
  getSessionTimeSeries: (options = {}) =>
    getSessionTimeSeries({ database: ensureDb(), ...options }),
  kGlobalModelPricing,
};
