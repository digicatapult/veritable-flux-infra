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
      managerFilePatterns: ["**/*.yaml", "**/*.yml"],
      labels: ["dependencies", "flux"],
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
        separateMajorMinor: true,
        separateMultipleMajor: true,
        separateMinorPatch: false,
        separateMultiple: true,
        groupName: "flux - kind-cluster",
        automerge: true,
        addLabels: ["automerge", "kind"],
      },
      {
        matchManagers: ["flux"],
        matchPaths: ["^clusters/veritable-prod/.*\\.ya?ml$"],
        separateMajorMinor: true,
        separateMultipleMajor: true,
        separateMinorPatch: false,
        separateMultiple: true,
        groupName: "flux - veritable-prod",
        automerge: false,
        addLabels: ["production"],
      },
      {
        matchManagers: ["flux"],
        matchPaths: ["^clusters/.*\\.ya?ml$"],
        separateMultiple: true,
        groupName: null,
      },
      {
        matchManagers: ["github-actions"],
        labels: ["dependencies", "github-actions"],
      },
      {
        matchManagers: ["github-actions"],
        matchUpdateTypes: ["major", "minor", "patch"],
        matchPackageNames: ["actions/checkout", "actions/cache"],
        automerge: true,
        extends: ["schedule:automergeNonOfficeHours"],
        addLabels: ["automerge"],
      },
    ],
  };
};
