const loadHashLocation = async () =>
  import("../../lib/public/js/hooks/use-hash-location.js");

describe("frontend/use-hash-location", () => {
  const originalWindow = global.window;

  afterEach(() => {
    global.window = originalWindow;
    vi.resetModules();
  });

  const setLocation = ({ hash = "", pathname = "/" } = {}) => {
    global.window = {
      location: {
        hash,
        pathname,
      },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
  };

  it("uses known direct app paths when there is no hash route", async () => {
    setLocation({ pathname: "/envars" });
    const { getHashRouterPath } = await loadHashLocation();

    expect(getHashRouterPath()).toBe("/envars");
  });

  it("keeps hash routes authoritative when both path forms exist", async () => {
    setLocation({ pathname: "/envars", hash: "#/models" });
    const { getHashRouterPath } = await loadHashLocation();

    expect(getHashRouterPath()).toBe("/models");
  });

  it("falls back to the default tab for non-app paths", async () => {
    setLocation({ pathname: "/setup.html" });
    const { getHashRouterPath } = await loadHashLocation();

    expect(getHashRouterPath()).toBe("/general");
  });
});
