# Review Appendix - What I left out

## Other relevant findings

I considered these while ranking. Each one is covered by the fixes in each issue's section in the [REVIEW.md file](REVIEW.md), needs a precondition that the top three do not need, or has a lower impact on the worst event.

**Supply chain and build**

- Actions are pinned by tag ([build.yaml L20, L25](.github/workflows/build.yaml#L20)). A compromise of the action's own repository would run in the publish job. Pinning by commit SHA is a small change.
- `production` is the only tag. The images have no version tag, no digest and no signature, so a rollback needs a rebuild. `imagePullPolicy` is not set ([api.yaml L21](kubernetes/api.yaml#L21)), so with a mutable tag, nodes may keep different cached images.
- Base images use the `node:24-alpine` tag ([Dockerfile L1, L6](Dockerfile#L1)), and no `.dockerignore` is shown for `COPY . .` ([Dockerfile L3](Dockerfile#L3)). The final image runs as a non-root user ([Dockerfile L7](Dockerfile#L7)), which is correct.
- The API and the worker share one image, so a flaw in either reaches both ([api.yaml L21](kubernetes/api.yaml#L21), [worker.yaml L21](kubernetes/worker.yaml#L21)).
- ArgoCD applies any change on `main`, so a manifest change can grant new permissions, such as a new RBAC binding. The single review is the only gate ([ArgoCD automated sync](https://argo-cd.readthedocs.io/en/stable/user-guide/auto_sync/)).

**Runtime and identity**

- Pods do not set a seccomp profile or drop capabilities, and `automountServiceAccountToken` is not disabled ([api.yaml L24-L27](kubernetes/api.yaml#L24-L27)). 
- The database password is static and passed as an environment variable ([worker.yaml L22-L27](kubernetes/worker.yaml#L22-L27)). No rotation is shown. Environment variables are easy to expose through process listings and crash dumps.

**Data and logging**

- Audit retention is 30 days ([platform.ts L54](infra/platform.ts#L54)), which is short for an investigation that starts late. General Security Audit Log policies best practices are 90 days up to a year, similar to what something like [PCI-DSS](https://pcidssguide.com/what-are-the-pci-dss-log-retention-requirements/) establishes.
- The queue has no access policy in the files, and ArgoCD's own exposure and credentials are not shown.

**Network**

- The ingress shows no TLS section and no rate limit settings ([api.yaml L32-L53](kubernetes/api.yaml#L32-L53)).
- The database accepts every cluster node, so any pod that obtains the password can connect ([platform.ts L40](infra/platform.ts#L40)).

## Paths I considered and ruled out

- **Reading the bucket with the stolen CI credentials.** The publisher role only reaches the registry repository ([platform.ts L16-L20](infra/platform.ts#L16-L20)). The data risk comes from the image that the CI pushes.
- **Reaching the database from the internet.** The database is private ([platform.ts L39](infra/platform.ts#L39)). An attacker needs code inside a pod.
- **Using the worker's service account token without running application code.** The token and the environment variables exist only inside the pod. This weakness widens a foothold but its not an entry.
- **Broken tenant authorization in the API.** The README states that it works as described, so it is out of scope.

## What already works

- The bucket blocks public access, and the database is private and encrypted ([platform.ts L22-L42](infra/platform.ts#L22-L42)).
- The trust policy checks the token audience ([platform.ts L8](infra/platform.ts#L8)).
- The publisher role is limited to one registry repository ([platform.ts L16-L20](infra/platform.ts#L16-L20)).
- Pods run as non-root, with a read-only filesystem and no privilege escalation ([api.yaml L24-L27](kubernetes/api.yaml#L24-L27), [worker.yaml L28-L31](kubernetes/worker.yaml#L28-L31)).
- Bucket versioning and database point-in-time recovery limit how long a modification of data lasts ([platform.ts L25, L41](infra/platform.ts#L25)).