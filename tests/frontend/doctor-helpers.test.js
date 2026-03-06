const loadDoctorHelpers = async () =>
  import("../../lib/public/js/components/doctor/helpers.js");

describe("frontend/doctor helpers", () => {
  it("groups cards by status and counts priorities", async () => {
    const helpers = await loadDoctorHelpers();
    const cards = [
      { id: 1, priority: "P0", status: "open" },
      { id: 2, priority: "P1", status: "dismissed" },
      { id: 3, priority: "P2", status: "fixed" },
      { id: 4, priority: "P2", status: "open" },
    ];

    expect(helpers.buildDoctorPriorityCounts(cards)).toEqual({
      P0: 1,
      P1: 1,
      P2: 2,
    });
    expect(helpers.groupDoctorCardsByStatus(cards)).toEqual({
      open: [
        { id: 1, priority: "P0", status: "open" },
        { id: 4, priority: "P2", status: "open" },
      ],
      dismissed: [{ id: 2, priority: "P1", status: "dismissed" }],
      fixed: [{ id: 3, priority: "P2", status: "fixed" }],
    });
  });

  it("only shows the warning for stale Doctor states with meaningful changes", async () => {
    const helpers = await loadDoctorHelpers();

    expect(
      helpers.shouldShowDoctorWarning({
        needsInitialRun: true,
        stale: true,
        changeSummary: { hasMeaningfulChanges: true },
      }),
    ).toBe(false);
    expect(
      helpers.shouldShowDoctorWarning({
        needsInitialRun: false,
        stale: false,
        changeSummary: { hasMeaningfulChanges: true },
      }),
    ).toBe(false);
    expect(
      helpers.shouldShowDoctorWarning({
        needsInitialRun: false,
        stale: true,
        changeSummary: { hasMeaningfulChanges: false },
      }),
    ).toBe(false);
    expect(
      helpers.shouldShowDoctorWarning(
        {
          needsInitialRun: false,
          stale: true,
          changeSummary: { hasMeaningfulChanges: true },
        },
        Date.now() + 1000,
      ),
    ).toBe(false);
    expect(
      helpers.shouldShowDoctorWarning({
        needsInitialRun: false,
        stale: true,
        changeSummary: { hasMeaningfulChanges: true },
      }),
    ).toBe(true);
    expect(
      helpers.getDoctorWarningMessage({
        needsInitialRun: false,
        stale: true,
        changeSummary: { changedFilesCount: 3 },
      }),
    ).toBe("Drift Doctor has not been run in the last week and 3 files changed since the last review.");
  });

  it("formats categories and run filter options", async () => {
    const helpers = await loadDoctorHelpers();

    expect(helpers.formatDoctorCategory("token_efficiency")).toBe("Token Efficiency");
    expect(helpers.getDoctorCategoryTone("token_efficiency")).toBe("info");
    expect(helpers.getDoctorCategoryTone("redundancy")).toBe("accent");
    expect(helpers.getDoctorCategoryTone("workspace_state")).toBe("secondary");
    expect(
      helpers.buildDoctorRunMarkers({
        status: "completed",
        cardCount: 0,
        priorityCounts: { P0: 0, P1: 0, P2: 0 },
      }),
    ).toEqual([{ tone: "success", count: 0, label: "No findings" }]);
    expect(
      helpers.buildDoctorRunMarkers({
        status: "completed",
        cardCount: 3,
        priorityCounts: { P0: 2, P1: 1, P2: 0 },
      }),
    ).toEqual([
      { tone: "danger", count: 0, label: "P0" },
      { tone: "warning", count: 0, label: "P1" },
    ]);
    expect(
      helpers.buildDoctorRunMarkers({
        status: "running",
      }),
    ).toEqual([{ tone: "cyan", count: 0, label: "Running" }]);
    expect(helpers.getDoctorRunPillDetail({ status: "failed" })).toBe("Failed");
    expect(helpers.getDoctorRunPillDetail({ status: "completed", cardCount: 0 })).toBe(
      "No findings",
    );
    expect(helpers.getDoctorChangeLabel({ changedFilesCount: 0 })).toBe(
      "No changes since last run",
    );
    expect(helpers.getDoctorChangeLabel({ changedFilesCount: 2 })).toBe(
      "2 changes since last run",
    );
    expect(helpers.getDoctorChangeLabel({ changedFilesCount: 1 })).toBe(
      "1 change since last run",
    );
    expect(helpers.getDoctorStatusTone("fixed")).toBe("success");
    expect(helpers.buildDoctorStatusFilterOptions()).toEqual([
      { value: "open", label: "Open" },
      { value: "dismissed", label: "Dismissed" },
      { value: "fixed", label: "Fixed" },
    ]);
  });
});
