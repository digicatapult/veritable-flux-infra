# Migrating to Flux Operator

This guide migrates a cluster bootstrapped with `gotk-components.yaml` and
`gotk-sync.yaml` to a Flux Operator-managed `FluxInstance`. The migration keeps
the existing controllers and root Git sync online until Flux Operator has taken
ownership, so it does not require downtime.

The `flux-instance` Helm chart is optional. It is a convenience chart that
renders a `FluxInstance` named `flux`; a direct manifest is likely more preferable
when the instance needs only one static configuration.

## Prerequisites

- The existing `GitRepository/flux-system` and `Kustomization/flux-system` are
  Ready.
- The Flux Operator is installed through the existing root Git sync and its
  `HelmRelease` is Ready.
- The initial `FluxInstance` exactly matches the existing controller set,
  repository URL, Git reference, sync path, authentication, and relevant
  cluster options.

Do not remove `gotk-components.yaml` or `gotk-sync.yaml` before the
`FluxInstance` is Ready. They provide the bootstrap reconciliation that installs
the operator and applies the FluxInstance.

If port-forwarding a standalone flux-operator (viz. flux-web on localhost:9080),
the Flux Status dashboard will also indicate whether the FluxInstance is running
and in a healthy state.

## Migration

1. Keep the conventional Flux bootstrap running and use it to install Flux
   Operator in `flux-system`.
2. Add a dedicated Flux `Kustomization` for the FluxInstance manifest. Its path
   must be outside the root bootstrap path and it must depend on the
   Kustomization that installs Flux Operator.
3. Add a health check for the Flux Operator `HelmRelease` to the operator's
   Kustomization. This prevents the FluxInstance manifest being applied before
   the FluxInstance CRD exists.
4. Add one `FluxInstance` named `flux` in `flux-system`. Its `spec.sync`
   generates the conventional upstream-named `GitRepository/flux-system` and
   `Kustomization/flux-system`, allowing the operator to adopt those resources.
5. Wait for the Flux Operator HelmRelease, FluxInstance Kustomization,
   `FluxInstance/flux`, generated root GitRepository, and generated root
   Kustomization to all report Ready.
6. Test a fresh bootstrap from the committed state. The cluster must become
   healthy without manually applying the FluxInstance.
7. In a separate Git change, remove `gotk-components.yaml`, `gotk-sync.yaml`,
   and any Kustomization that only applies those legacy files.
8. Verify the FluxInstance and application reconciliations again.

The Flux Operator owns controller distribution upgrades within
`spec.distribution.version`. Use a major range such as `"2.x"` for automatic
minor and patch upgrades. A dependency bot should propose changes to a new
major range for review rather than changing the major version automatically.

## Recovery

Before retiring `gotk-*`, recovery is safe and local: keep the conventional
bootstrap resources, fix or remove the FluxInstance Kustomization, and let the
existing bootstrap resume reconciliation.

If the FluxInstance fails because its kind is unknown, it was applied before
Flux Operator installed the CRD. Move the manifest outside the root bootstrap
path and make its Kustomization depend on a health-checked Flux Operator
Kustomization.

If the FluxInstance is not Ready, retain `gotk-*` and compare its controller
set, source URL, Git ref, path, credentials, and cluster options with the
legacy manifests. Do not retire the legacy resources until it is Ready.

After retiring `gotk-*`, restore them from Git and bootstrap conventional Flux
again only if the operator-managed controllers or root sync become unhealthy.

## Kind clusters

The Kind cluster applies Flux Operator from
`clusters/kind-cluster/base/flux-operator` and waits for its HelmRelease in
`flux-operator-sync`. The dependent `flux-instance-sync` Kustomization applies
`clusters/kind-cluster/flux/flux-instance.yaml`.

The FluxInstance synchronizes `clusters/kind-cluster/base` from `main`. Its
`FluxInstance.spec.sync` is the replacement for the deleted Kind
`gotk-sync.yaml`; change its `ref` when testing a different Git branch.

For a healthy Kind migration, verify:

```sh
kubectl wait helmrelease flux-operator -n flux-system --for=condition=ready --timeout=10m
kubectl wait kustomization flux-instance-sync -n flux-system --for=condition=ready --timeout=10m
kubectl wait fluxinstance flux -n flux-system --for=condition=ready --timeout=10m
kubectl wait gitrepository flux-system -n flux-system --for=condition=ready --timeout=10m
kubectl wait kustomization flux-system -n flux-system --for=condition=ready --timeout=10m
kubectl get fluxreport flux -n flux-system
```

`scripts/install-flux.sh` is deliberately still a conventional bootstrap tool:
it creates the initial root source and Kustomization needed to install Flux
Operator. Once `FluxInstance/flux` is Ready, re-running the script detects
operator ownership and makes no changes.
