/**
 * Keeps Android APKs smaller by shipping only arm64-v8a (modern phones).
 * Survives `expo prebuild --clean`.
 */
const {
  withGradleProperties,
  createRunOncePlugin,
} = require("@expo/config-plugins");

/** @type {import('@expo/config-plugins').ConfigPlugin} */
function withAndroidArm64Only(config) {
  return withGradleProperties(config, (config) => {
    const props = config.modResults;
    const key = "reactNativeArchitectures";
    const existing = props.find((p) => p.type === "property" && p.key === key);
    if (existing) {
      existing.value = "arm64-v8a";
    } else {
      props.push({ type: "property", key, value: "arm64-v8a" });
    }
    return config;
  });
}

module.exports = createRunOncePlugin(
  withAndroidArm64Only,
  "withAndroidArm64Only",
  "1.0.0",
);
