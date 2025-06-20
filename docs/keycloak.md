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

This cluster will have a single realm, "simple", which has several clients preconfigured: alice-swagger, bob-swagger, and charlie-swagger. They may need the cloudagent-admin service forwarding before the Swagger UIs can be accessed:

```sh
kubectl port-forward -n alice \
  svc/alice-veritable-cloudagent-admin 3000:3000

kubectl port-forward -n bob \
  svc/bob-veritable-cloudagent-admin 3001:3000

kubectl port-forward -n charlie \
  svc/charlie-veritable-cloudagent-admin 3002:3000
```
