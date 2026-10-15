# Proposals

Proposed versions of the files that change for the three issues in [REVIEW.md](../REVIEW.md). 

Each proposed file keeps the path of the file it replaces, so it can be compared with the original:

```text
diff -u kubernetes/api.yaml proposals/kubernetes/api.yaml
```

The provided files are not changed. Nothing here has been applied to a cluster or a cloud account, and the workflows have not been run.

## Deploy path: option A

The review chose option A for the image tag:

- The `production` tag is mutable. Immutability is off in `infra/platform.ts`, because the tag is re-pointed on every publish.
- Only the publish job pushes `production`. It runs on `main`, after the `production-publish` environment is approved, and it checks that the commit tag and the `production` tag resolve to the same digest.
- The image is signed by digest. The Kyverno policy verifies the signature on the digest that the tag resolves to, and rewrites the tag to that digest at admission (`mutateDigest`). The trust comes from the signature, not from immutability.
- The manifests use `imagePullPolicy: Always`, so a pod that starts again pulls the current `production` image.

Option B, committing the digest to `main`, is not implemented. It would need a bot exception to the one-approval rule, which is a new trust point and is not in the files.

### Residual gap: a re-pointed tag does not roll out by itself

The Deployment spec does not change when the `production` tag is re-pointed. Argo CD sees no diff, and Kubernetes does not replace running pods. Running pods keep the old image until something restarts them. `imagePullPolicy: Always` only applies when a pod is created.

The files do not show a mechanism that restarts the pods. The five-minute rollout in the README is therefore not supported by this proposal. Closing the gap needs one of:

1. A restart step in the publish job, such as `kubectl rollout restart`, with cluster credentials for the publish job. This is a new trust point and must be added to the review.
2. Option B: CI commits the digest to `main`, so Argo CD sees a manifest change. This is also a new trust point.


## Files

| Proposed file | Replaces | Related Finding | Change |
|---|---|---|---|
| `.github/workflows/build.yaml` | same path | 1 | Pull requests build and test with no cloud access. The trigger is `pull_request`. |
| `.github/workflows/publish.yaml` | none (new) | 1 | Runs on push to `main` only. The publish job uses the `production-publish` environment, pushes the commit tag and the `production` tag, and signs and attests by digest. |
| `scripts/build.sh` | same path | 1 | Image name and tag come from variables, so the PR and publish workflows can use it. |
| `infra/platform.ts` | same path | 1, 2, 3 | Trust policy limited to the environment. Tag immutability off. S3 data events on. Origin limited to edge address ranges. |
| `kubernetes/api.yaml` | same path | 2 | Image has a tag. The API does not mount its service account token. The `/ops/reprocess` route is unchanged. |
| `kubernetes/worker.yaml` | same path | 1, 2 | Image has a tag. The cluster-wide ClusterRole is replaced by a namespaced Role limited to named Secrets, with `get` only. The token stays mounted. |
| `kubernetes/policies/verify-images.yaml` | none (new) | 1 | Kyverno policy that verifies the signature and attestation of `atlas-api` images, for tag and digest references. |
| `Dockerfile` | same path | none of the above but potentially an entrypoint for RCE | Adds multi stage build with pinned sha256 digests on images. Uses distroless for runtime. |
| `.dockerignore` | none (new) | none | Adds dockerignore files to avoid uploading sensitive information to the deamon. |

Not in this folder: `architecture.md`, which is unchanged. The root `README.md`, `REVIEW.md` and `APPENDIX.md` are updated to match these files.

The admission policy is written for Kyverno. I did not write OPA or Rego policies because I couldn't test properly.


## Not tested in this revision

- The Kyverno policy has not been run with the Kyverno CLI. The matching of tag references and the rewrite to a digest are expected behavior, not observed behavior.
- The commit SHAs for the actions have not been checked against the upstream repositories. `actions/attest-build-provenance` is still pinned by tag.
- `platform.ts` is not compiled. The Cloudflare address list is a placeholder.
- The workflows have not been run. The `production-publish` environment must be limited to `main` in the repository settings. That setting is not in these files.
