// A Google Cloud project ID always contains a letter (e.g. `my-gcp-project`); a
// bare all-digits string is the project *number*, which the Pub/Sub and Gmail
// APIs reject. Catch that common mix-up before saving.
export const looksLikeProjectNumber = (value) =>
  /^\d+$/.test(String(value || "").trim());
