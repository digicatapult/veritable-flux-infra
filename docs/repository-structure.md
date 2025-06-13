# Repository structure

This repository has the following structure:

```
├── certs
│   └── veritable-prod
├── clusters
│   ├── kind-cluster
│   │   ├── persona  # alice, bob, and charlie
│   │   │   └── veritable-cloudagent
│   │   ├── base
│   │   │   └── flux-system
│   │   ├── keycloak
│   │   ├── monitoring
│   │   │   ├── configs
│   │   │   │   └── dashboards
│   │   │   └── kube-prometheus-stack
│   │   ├── monitoring-configs
│   │   └── nginx
│   └── veritable-prod
│       ├── persona  # alice, bob, charlie, dave, and eve
│       │   ├── cloudagent
│       │   ├── nginx
│       │   └── ui
│       ├── base
│       │   └── flux-system
│       ├── cert-manager
│       │   ├── issuer
│       ├── keycloak
│       │   ├── keycloak
│       │   └── nginx
│       ├── monitoring
│       │   ├── dashboards
│       │   ├── kube-prometheus-stack
│       │   └── nginx
│       ├── podmonitors
│       └── secrets
├── docs
└── scripts
```


## Certs

The `certs` directory contains the public PGP certificates (keys) used to encrypt new secrets, i.e. as organised by the environments in which the corresponding private keys are deployed.


## Clusters

This directory contains cluster-specific configuration details and deployment "kustomizations". These are broken down by environment, e.g. `kind-cluster` for development and `veritable-prod` for production. For more environment-specific information, see [here](./cluster-information.md)


### Base

The `base` directories contain flux-system components and enables developers to include secrets and install and synchronise applications from kustomizations residing elsewhere.


### Personas

Each persona directory, e.g. `alice` and `bob`, contains the Veritable cloudagent and UI configuration, typically in the form of distinct YAML files for the kustomization, release (e.g. HelmRelease), and values.


### Secrets

This directory holds the SOPs-encrypted secrets, which are loaded into the cluster and decrypted from within it. See [Managing Secrets](./managing-secrets) for instructions on how to create new secrets for an environment.


## Docs

This folder contains documentation for the repository.


## Scripts

Within `scripts`, there are several that can be used to respectively initialise a Kind cluster, install FluxCD to it, and encrypt secrets for use by any given cluster.
