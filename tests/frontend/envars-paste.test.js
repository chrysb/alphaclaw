const loadEnvarsPaste = async () =>
  import("../../lib/public/js/components/envars-paste.js");

describe("frontend/envars paste", () => {
  it("parses KEY=VALUE pasted into the key field", async () => {
    const { classifyEnvVarPaste } = await loadEnvarsPaste();

    expect(classifyEnvVarPaste("OPENAI_API_KEY=secret", "key")).toEqual({
      mode: "pair",
      pairs: [{ key: "OPENAI_API_KEY", value: "secret" }],
    });
  });

  it("extracts VALUE without replacing the key when pasted into the value field", async () => {
    const { classifyEnvVarPaste } = await loadEnvarsPaste();

    expect(classifyEnvVarPaste("OPENAI_API_KEY=secret", "val")).toEqual({
      mode: "value",
      pairs: [{ key: "OPENAI_API_KEY", value: "secret" }],
    });
  });

  it("imports multiple assignments from either field", async () => {
    const { classifyEnvVarPaste } = await loadEnvarsPaste();
    const pasted = "OPENAI_API_KEY=one\nGEMINI_API_KEY='two'";
    const expected = {
      mode: "bulk",
      pairs: [
        { key: "OPENAI_API_KEY", value: "one" },
        { key: "GEMINI_API_KEY", value: "two" },
      ],
    };

    expect(classifyEnvVarPaste(pasted, "key")).toEqual(expected);
    expect(classifyEnvVarPaste(pasted, "val")).toEqual(expected);
  });
});
