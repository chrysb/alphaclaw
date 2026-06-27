const loadSecretInput = async () =>
  import("../../lib/public/js/components/secret-input.js");

describe("frontend/secret-input", () => {
  it("uses a neutral mask instead of the secret while hidden", async () => {
    const { getSecretInputValue, kSecretInputMask } = await loadSecretInput();

    expect(
      getSecretInputValue({
        isSecret: true,
        visible: false,
        editingMasked: false,
        value: "sk-real-value",
      }),
    ).toBe(kSecretInputMask);
  });

  it("only returns the secret value after explicit reveal", async () => {
    const { getSecretInputValue } = await loadSecretInput();

    expect(
      getSecretInputValue({
        isSecret: true,
        visible: true,
        value: "sk-real-value",
      }),
    ).toBe("sk-real-value");
  });

  it("uses the replacement draft while editing a hidden secret", async () => {
    const { getSecretInputValue } = await loadSecretInput();

    expect(
      getSecretInputValue({
        isSecret: true,
        visible: false,
        editingMasked: true,
        value: "sk-old-value",
        draftValue: "sk-new-value",
      }),
    ).toBe("sk-new-value");
  });

  it("leaves non-secret text unchanged", async () => {
    const { getSecretInputValue } = await loadSecretInput();

    expect(
      getSecretInputValue({
        isSecret: false,
        value: "plain-value",
      }),
    ).toBe("plain-value");
  });
});
