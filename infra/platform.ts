// Condensed Pulumi-style infrastructure. Unrelated availability settings are omitted.

const imagePublisherTrust = {
  Effect: 'Allow',
  Principal: { Federated: 'ci-identity-provider' },
  Action: 'sts:AssumeRoleWithWebIdentity',
  Condition: {
    StringEquals: { audience: 'cloud-token-service' },
    StringLike: {
      // subject format: repo:<organization>/<repository>:<workflow context>
      subject: 'repo:atlas-company/platform-*:*',
    },
  },
};

const imagePublisherPermissions = {
  Effect: 'Allow',
  Action: ['registry:GetAuthorizationToken', 'registry:UploadImage', 'registry:PutImage'],
  Resource: 'arn:cloud:registry:us-west-2:111122223333:repository/atlas-api',
};

const tenantDocuments = new ObjectBucket('tenant-documents', {
  publicAccessBlocked: true,
  encryption: 'provider-managed',
  versioning: true,
  accessLogging: false,
  auditDataEvents: false,
});

// This role is assumed by the API's Kubernetes service account.
const apiWorkloadPermissions = {
  Effect: 'Allow',
  Action: ['object-storage:ListBucket', 'object-storage:GetObject', 'object-storage:PutObject'],
  Resource: [tenantDocuments.arn, `${tenantDocuments.arn}/*`],
};

const productionDatabase = new RelationalDatabase('atlas', {
  encrypted: true,
  publiclyAccessible: false,
  allowedSources: ['production-cluster-nodes'],
  backups: { retentionDays: 14, pointInTimeRecovery: true },
});

const publicOrigin = new LoadBalancer('atlas-origin', {
  internetFacing: true,
  inbound: [{ protocol: 'HTTPS', source: '0.0.0.0/0' }],
  target: 'production-ingress-controller',
});

const clusterAudit = new AuditConfiguration('production', {
  kubernetesApiAuditLog: true,
  cloudManagementEvents: true,
  objectStorageDataEvents: false,
  retentionDays: 30,
});
