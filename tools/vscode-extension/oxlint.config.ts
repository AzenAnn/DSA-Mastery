import oxlint from "@mzwing/oxc-config";

export default oxlint({
  type: "app",
  ignores: ["dist/**", "out/**", "media/**"],
});
