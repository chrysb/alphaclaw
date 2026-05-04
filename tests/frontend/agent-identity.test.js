import { sanitizeAgentEmoji } from "../../lib/public/js/lib/agent-identity.js";

describe("frontend/agent-identity", () => {
  describe("sanitizeAgentEmoji", () => {
    it("returns the trimmed glyph for a single emoji", () => {
      expect(sanitizeAgentEmoji("✨")).toBe("✨");
      expect(sanitizeAgentEmoji("  🌙  ")).toBe("🌙");
    });

    it("accepts ZWJ sequences", () => {
      expect(sanitizeAgentEmoji("👨‍👩‍👧‍👦")).toBe("👨‍👩‍👧‍👦");
    });

    it("rejects shortcode strings like :sparkles:", () => {
      expect(sanitizeAgentEmoji(":sparkles:")).toBe("");
      expect(sanitizeAgentEmoji(":crescent_moon:")).toBe("");
    });

    it("rejects plain ASCII text", () => {
      expect(sanitizeAgentEmoji("abc")).toBe("");
      expect(sanitizeAgentEmoji("Vee")).toBe("");
    });

    it("returns an empty string for nullish or empty input", () => {
      expect(sanitizeAgentEmoji(null)).toBe("");
      expect(sanitizeAgentEmoji(undefined)).toBe("");
      expect(sanitizeAgentEmoji("")).toBe("");
      expect(sanitizeAgentEmoji("   ")).toBe("");
    });
  });
});
