# Keycloak

Authentication for Veritable is managed using [`Keycloak`](https://www.keycloak.org/).


## Kind cluster

> Note that to avoid collisions with application logic, the Kind cluster has its Keycloak deployment configured to use the `/auth2` relative HTTP path. Keep this in mind when debugging issues across the different environments.

After following the instructions in the [getting started](./getting-started.md) guide on creating the Kind cluster, you should now be able to access the admin console for Keycloak at http://localhost:3080/auth2/.

The default username is "user" and its password can be retrieved with the following:

```sh
kubectl -n keycloak get secret keycloak \
  -o jsonpath='{.data.admin-password}' | base64 -d && echo
```

This cluster will have a single realm, "simple", with several clients: alice-swagger, bob-swagger, and charlie-swagger.

Alice is already configured to use the Veritable UI, which has its Swagger interface available at http://localhost:3080/swagger.

To forward the veritable-cloudagent UI:

```sh
kubectl port-forward -n alice \
  svc/alice-veritable-cloudagent-admin 3000:3000
```

A Swagger console for the Alice's Veritable Cloud Agent would then be available at http://localhost:3000/swagger.
