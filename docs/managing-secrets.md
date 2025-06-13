# Managing Secrets

Secrets for the application are stored under version control as SOPs-encrypted Kubernetes secrets. Keys for decrypting these secrets will be loaded into a cluster on creation and should never be retained on any other device. Public certificates (keys) corresponding to the decryption key are then stored in this repository under [./certs](./repository-structure.md#certs) and can be used to encrypt new secrets for a deployed application.


## Creating new secrets

To create new secrets you will need to have [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/) and [Mozilla SOPs](https://github.com/mozilla/sops) installed. On MacOS, these can both be installed using [Homebrew](https://brew.sh/).

To create a new secret you first need to generate the secret locally using `kubectl`, and then encrypt it with SOPs. As an example, we will create a `kubernetes.io/dockerconfigjson` secret to connect to a Docker registry and encrypt it for the `kind-cluster` deployment.

We can create a secret with the following:

```sh
mkdir -p ./clusters/kind-cluster/secrets && \
kubectl create secret generic $NAME \
--namespace=$NAMESPACE \
--from-literal=$KEY=$VALUE \
--dry-run=client \
--output=yaml > ./clusters/kind-cluster/secrets/$NAME.unc.yaml
```

Replacing tags with appropriate values:

* `$NAME` is the name of the secret to create
* `$NAMESPACE` is the Kubernetes namespace to use
* `$KEY` is the name of the key for the key-value pair
* `$VALUE` is the value, the secret itself

This will generate a secret at the path `./clusters/kind-cluster/secrets/$NAME.unc.yaml`:

```yaml
apiVersion: v1
data:
  .testdata: dGVzdGRhdGEwMDE=¬
kind: Secret
metadata:
  creationTimestamp: null
  name: test-secret
  namespace: default
type: Opaque
```

We now have to encrypt the secret with SOPs. This can be done using the script `./scripts/encrypt-secrets.sh`, with the cluster name as an argument:

```sh
./scripts/encrypt-secrets.sh kind-cluster
```

This will ensure that any unencrypted secrets in the cluster-specific `./secrets` directory are encrypted with all public keys needed for that cluster.
