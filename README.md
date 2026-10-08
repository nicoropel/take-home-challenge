# Atlas Document Processing Platform

## Your task

Review this system as if it were approaching production. Identify security risks, then present the three issues you would address first in priority order.

For each issue, explain:

- the affected asset;
- a plausible failure or attack path;
- the likely impact; and
- the next action you recommend.

You may inspect any file, use any tools, and ask the interviewer factual questions. You are not expected to produce code changes or find every issue.

## Business context

Atlas is a multi-tenant service. Customers upload confidential business documents through its API. The API stores each document in object storage and submits a processing job. A worker retrieves the document, extracts data, and records the result in a relational database.

Unauthorized access to or modification of another customer's documents is the highest-impact event. Several hours of downtime would be serious but recoverable. The documents are confidential, but the service does not handle payment-card or healthcare data.

External customers use the public API. Employees use an operations endpoint to retry failed jobs. Some pull requests are submitted from repository forks by external contributors.

## Technology orientation

The system uses named commercial products, but detailed product knowledge is not required:

- **GitHub Actions** is the continuous-integration service. Workflow jobs execute repository-defined commands. A job with `id-token: write` can request a signed identity token; the cloud trust policy determines which job identities may exchange that token for short-lived cloud credentials.
- **ECR** is a container-image registry. An image tag is a changeable name pointing to an image; a digest identifies immutable image content.
- **Argo CD** is a deployment reconciler. It makes the Kubernetes cluster match the manifests in a Git repository and can deploy changes automatically.
- **EKS/Kubernetes** runs containerized workloads. Service accounts identify workloads. RBAC controls Kubernetes API access, while cloud IAM policies control access to cloud services.
- **Cloudflare** is the intended public edge. It terminates customer connections and forwards requests to the origin load balancer.
- **S3, SQS, and RDS** provide object storage, a job queue, and a relational database respectively.

## Repository map

```text
README.md
architecture.md
.github/workflows/build.yaml
Dockerfile
infra/platform.ts
kubernetes/api.yaml
kubernetes/worker.yaml
scripts/build.sh
```

The diagram and repository describe all security controls relevant to this review. There are no additional admission policies, network policies, or edge-to-origin controls unless shown.

## Deployment behavior

- The `main` branch is protected and requires one approving review.
- CI builds the application image and writes it to the registry.
- Argo CD automatically applies the Kubernetes manifests from `main`.
- The production manifests intentionally use the `production` image tag so a newly published image under that tag is rolled out within five minutes.
- The edge proxy removes any client-supplied `X-Edge-Authenticated` header and sets it to `true` after employee authentication.
- The `/ops/reprocess` route trusts that header. Other API routes use the application's customer authentication and tenant authorization.

## Scope

Review the architecture and supplied configuration. Application implementation details beyond the behavior described above are out of scope.
