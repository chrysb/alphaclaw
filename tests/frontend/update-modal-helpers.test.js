const loadUpdateModalHelpers = async () =>
  import("../../lib/public/js/components/update-modal-helpers.js");

describe("frontend/update-modal-helpers", () => {
  it("closes the update modal after a successful update", async () => {
    const { createUpdateModalSubmitHandler } = await loadUpdateModalHelpers();
    const onClose = vi.fn();
    const result = { ok: true, restarting: true };
    const onUpdate = vi.fn().mockResolvedValue(result);

    const handler = createUpdateModalSubmitHandler({
      onClose,
      onUpdate,
    });

    await expect(handler()).resolves.toEqual(result);
    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("keeps the update modal open when the update fails", async () => {
    const { createUpdateModalSubmitHandler } = await loadUpdateModalHelpers();
    const onClose = vi.fn();
    const result = { ok: false, error: "nope" };
    const onUpdate = vi.fn().mockResolvedValue(result);

    const handler = createUpdateModalSubmitHandler({
      onClose,
      onUpdate,
    });

    await expect(handler()).resolves.toEqual(result);
    expect(onClose).not.toHaveBeenCalled();
  });
});
