module.exports = (config = {}) => {
  const isSelfHosted = process.env.RENOVATE_SELF_HOSTED === "true";

  if (!isSelfHosted) {
    console.log("Renovate is disabled when running via GitHub App.");
    return {
      enabled: false,
      onboarding: false,
    };
  }

  console.log("Renovate is running in self-hosted mode.");

  return {
    $schema: "https://docs.renovatebot.com/renovate-schema.json",
    onboarding: false,
    requireConfig: false,
    baseBranches: ["main"],
    extends: [":timezone(Europe/London)"],
    prHourlyLimit: 20,
    prConcurrentLimit: 20,
    recreateWhen: "always",
    flux: {
      managerFilePatterns: ["^clusters/.*\\.ya?ml$"],
    },
    packageRules: [
      {
        matchManagers: ["flux"],
        pinDigests: false,
      },
      {
        matchManagers: ["flux"],
        schedule: ["* 9,10,11,12,13,14,15,16,17 * * *"],
      },
      {
        matchManagers: ["flux"],
        matchPaths: ["^clusters/kind-cluster/.*\\.ya?ml$"],
        automerge: true,
        addLabels: ["automerge", "kind"],
        separateMajorMinor: true,
        separateMultipleMajor: true,
        separateMinorPatch: true,
        groupName: "flux - kind-cluster",
      },
      {
        matchManagers: ["flux"],
        matchPaths: ["^clusters/(?!kind-cluster/)[^/]+/.*\\.ya?ml$"],
        automerge: false,
        addLabels: ["production"],
        separateMajorMinor: true,
        separateMultipleMajor: true,
        separateMinorPatch: true,
        groupName: "flux - non-kind-cluster",
      },
      {
        matchManagers: ["github-actions"],
        labels: ["dependencies", "github-actions"],
        groupName: "GitHub Actions - updates",
        matchUpdateTypes: ["major"],
        matchPackageNames: ["actions/checkout", "actions/cache"],
        automerge: true,
        extends: ["schedule:automergeNonOfficeHours"],
        addLabels: ["automerge"],
      },
    ],
  };
};
