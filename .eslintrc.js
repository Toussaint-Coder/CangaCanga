module.exports = {
  root: true,
  extends: ["expo"],
  ignorePatterns: ["/dist/*", "/node_modules/*", "supabase/*", "scripts/*"],
  rules: {
    "import/no-unresolved": "off",
  },
};
