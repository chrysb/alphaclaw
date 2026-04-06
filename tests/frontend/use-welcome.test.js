describe("frontend/use-welcome", () => {
  it("reuses an applied import when only the target repo changes", async () => {
    const { getImportReuseState, kImportStepId } = await import(
      "../../lib/public/js/components/welcome/use-welcome.js"
    );

    expect(kImportStepId).toBe("import");
    expect(
      getImportReuseState({
        githubFlow: "import",
        importApplied: true,
        sourceRepo: "My-Org/Source-Repo",
        importedSourceRepo: "my-org/source-repo",
      }),
    ).toEqual({
      sourceImportAlreadyApplied: true,
      sourceRepoChangedAfterImport: false,
    });
  });

  it("flags a changed source repo after the import has already been applied", async () => {
    const { getImportReuseState } = await import(
      "../../lib/public/js/components/welcome/use-welcome.js"
    );

    expect(
      getImportReuseState({
        githubFlow: "import",
        importApplied: true,
        sourceRepo: "my-org/other-source",
        importedSourceRepo: "my-org/source-repo",
      }),
    ).toEqual({
      sourceImportAlreadyApplied: true,
      sourceRepoChangedAfterImport: true,
    });
  });
});
