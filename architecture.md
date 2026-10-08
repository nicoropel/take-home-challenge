# Architecture

Arrows show allowed connections. The dashed boxes are trust or administrative boundaries.

```mermaid
flowchart LR
  customer[Customer]
  employee[Employee]
  contributor[External contributor]

  subgraph delivery[Software delivery boundary]
    repo[Source repository]
    ci[CI job]
    registry[Container registry]
    gitops[Deployment reconciler]
    repo -->|workflow commands| ci
    ci -->|push image| registry
    repo -->|production manifests| gitops
  end

  subgraph public[Public network]
    edge[Authenticated edge proxy]
    origin[Public origin load balancer]
  end

  subgraph cluster[Production cluster]
    ingress[Ingress controller]
    api[API workload]
    worker[Worker workload]
    ops["Operations service<br/>cluster-internal"]
    ingress --> api
    ingress --> ops
  end

  subgraph data[Production data boundary]
    objects[(Tenant document bucket)]
    queue[(Job queue)]
    database[(Relational database)]
  end

  customer -->|HTTPS| edge
  employee -->|HTTPS + employee authentication| edge
  edge -->|adds trusted header| origin
  origin --> ingress
  contributor -->|fork pull request| repo
  registry -->|production-tagged image| cluster
  gitops -->|automatic reconciliation| cluster
  api -->|documents| objects
  api -->|new job| queue
  worker -->|consume job| queue
  worker -->|read document| objects
  worker -->|write result| database
```

The load balancer has a public DNS name in addition to the customer-facing edge hostname. The operations Service is `ClusterIP` and therefore not directly reachable from outside the cluster; its HTTP route is exposed through the same ingress and origin as the API.
