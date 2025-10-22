# scripts/bootstrap_policies.py
import os, weaviate
from weaviate.classes.init import Auth
from weaviate.classes.config import Configure
from dotenv import load_dotenv

load_dotenv()

client = weaviate.connect_to_weaviate_cloud(
    cluster_url=os.environ["WEAVIATE_URL"],
    auth_credentials=Auth.api_key(os.environ["WEAVIATE_API_KEY"]),
)

if client.collections.exists("Policies"):
    client.collections.delete("Policies")

policies = client.collections.create(
    name="Policies",
    # vectorizer_config=Configure.Vectorizer.text2vec_weaviate(),
    vector_config=Configure.Vectors.text2vec_weaviate()
)

docs = [
    # === HR & PII Policies ===
    {
        "title": "Employee Salary Access",
        "section": "HR-1.1",
        "text": "Only HR and Admin roles may access employee salary information. Managers may view salary bands for their direct reports only during performance review cycles. All access requires valid business justification.",
        "tags": ["hr", "pii", "salary", "sensitive"],
        "roles_allowed": ["HR", "Admin"],
        "roles_conditional": ["Manager"],
        "requires_approval": False
    },
    {
        "title": "Performance Review Access",
        "section": "HR-1.2",
        "text": "HR may access all performance reviews. Managers may access reviews for direct reports. Employees may access their own reviews. Cross-team access requires HR approval.",
        "tags": ["hr", "performance", "reviews"],
        "roles_allowed": ["HR", "Manager", "Employee"],
        "requires_approval": False
    },
    {
        "title": "PII Export Restrictions",
        "section": "HR-2.1",
        "text": "Exporting personally identifiable information (PII) including SSN, DOB, home address requires explicit manager approval, documented business need, and automatic audit logging with requestor identity, purpose, and export timestamp.",
        "tags": ["pii", "export", "audit", "sensitive"],
        "roles_allowed": ["HR", "Legal"],
        "requires_approval": True,
        "approval_level": "Manager"
    },

    # === Developer Database Access ===
    {
        "title": "Production Database Read Access",
        "section": "DEV-1.1",
        "text": "Senior Engineers and above may request read-only access to production databases for debugging. Access is granted for 24 hours and requires ticket number. All queries are logged and monitored.",
        "tags": ["database", "production", "readonly", "engineering"],
        "roles_allowed": ["Senior Engineer", "Staff Engineer", "Engineering Manager", "DBA"],
        "requires_approval": True,
        "approval_level": "Engineering Manager",
        "time_limited": "24h"
    },
    {
        "title": "Production Database Write Access",
        "section": "DEV-1.2",
        "text": "Write access to production databases requires VP of Engineering approval and must be performed during scheduled maintenance windows. DBA must be present. All write operations require change management ticket and rollback plan.",
        "tags": ["database", "production", "write", "critical"],
        "roles_allowed": ["DBA", "Staff Engineer"],
        "requires_approval": True,
        "approval_level": "VP Engineering",
        "requires_change_ticket": True
    },
    {
        "title": "Development Database Access",
        "section": "DEV-1.3",
        "text": "All engineers have full access to development and staging databases. No approval required. Data must not contain real customer PII.",
        "tags": ["database", "development", "staging", "engineering"],
        "roles_allowed": ["Engineer", "Senior Engineer", "Staff Engineer"],
        "requires_approval": False
    },
    {
        "title": "Database Credential Rotation",
        "section": "DEV-1.4",
        "text": "Database credentials must be rotated every 90 days. Shared credentials are prohibited. Each engineer must use individual credentials with proper access controls.",
        "tags": ["database", "credentials", "security"],
        "roles_allowed": ["DBA", "Security"],
        "applies_to": "all"
    },

    # === Infrastructure & Cloud Access ===
    {
        "title": "AWS Production Account Access",
        "section": "DEV-2.1",
        "text": "Access to AWS production accounts requires Security and DevOps approval. Access is role-based with least-privilege principle. All actions are logged via CloudTrail.",
        "tags": ["aws", "cloud", "production", "infrastructure"],
        "roles_allowed": ["DevOps", "SRE", "Staff Engineer"],
        "requires_approval": True,
        "approval_level": "DevOps Lead + Security"
    },
    {
        "title": "Kubernetes Production Access",
        "section": "DEV-2.2",
        "text": "kubectl access to production clusters limited to SRE and DevOps teams. Engineers may request temporary read-only access for incident response with on-call approval.",
        "tags": ["kubernetes", "production", "infrastructure"],
        "roles_allowed": ["SRE", "DevOps"],
        "roles_conditional": ["Senior Engineer"],
        "requires_approval": True,
        "approval_level": "On-Call SRE"
    },
    {
        "title": "Deployment Permissions",
        "section": "DEV-2.3",
        "text": "Production deployments require peer code review, passing CI/CD tests, and Engineering Manager approval. Hotfixes during incidents may bypass approval with post-incident review required.",
        "tags": ["deployment", "production", "cicd"],
        "roles_allowed": ["Senior Engineer", "Staff Engineer", "Engineering Manager"],
        "requires_approval": True,
        "approval_level": "Engineering Manager"
    },

    # === IP Whitelisting & Network Access ===
    {
        "title": "VPN IP Whitelisting",
        "section": "SEC-1.1",
        "text": "Engineers must connect via company VPN to access internal systems. Personal IP whitelisting requires Security approval, valid business justification (e.g., remote work from fixed location), and 90-day renewal.",
        "tags": ["network", "vpn", "ip-whitelist", "security"],
        "roles_allowed": ["All Employees"],
        "requires_approval": True,
        "approval_level": "Security Team",
        "renewal_period": "90 days"
    },
    {
        "title": "Third-Party IP Whitelisting",
        "section": "SEC-1.2",
        "text": "Whitelisting third-party vendor IPs requires Security and Legal approval. Vendor must provide static IPs, sign BAA/NDA, and access is monitored. Access expires upon contract termination.",
        "tags": ["network", "vendor", "ip-whitelist", "security"],
        "roles_allowed": ["Security", "IT Admin"],
        "requires_approval": True,
        "approval_level": "Security + Legal"
    },

    # === User Access Management ===
    {
        "title": "User Role Modification",
        "section": "SEC-2.1",
        "text": "Modifying user roles or permissions requires approval from user's manager and IT Admin. Privilege escalation (e.g., granting admin rights) requires additional Security review.",
        "tags": ["user-management", "permissions", "security"],
        "roles_allowed": ["IT Admin", "HR"],
        "requires_approval": True,
        "approval_level": "Manager + IT Admin"
    },
    {
        "title": "Admin Access Grant",
        "section": "SEC-2.2",
        "text": "Granting system administrator access requires CTO approval, documented business need, security training completion, and 6-month access review. Admin actions are logged and audited quarterly.",
        "tags": ["admin", "privileged-access", "security"],
        "roles_allowed": ["IT Admin", "Security"],
        "requires_approval": True,
        "approval_level": "CTO",
        "requires_training": True
    },
    {
        "title": "User Account Deactivation",
        "section": "SEC-2.3",
        "text": "IT Admin and HR may deactivate user accounts. Immediate deactivation for terminated employees. Contractors require manager confirmation. All access tokens must be revoked within 1 hour.",
        "tags": ["user-management", "deactivation", "offboarding"],
        "roles_allowed": ["IT Admin", "HR"],
        "requires_approval": False,
        "sla": "1 hour"
    },

    # === API & Secrets Management ===
    {
        "title": "API Key Generation",
        "section": "DEV-3.1",
        "text": "Engineers may generate API keys for development environments. Production API keys require DevOps approval and must be stored in secrets manager (never in code). Keys expire after 1 year.",
        "tags": ["api", "credentials", "security"],
        "roles_allowed": ["Engineer", "Senior Engineer"],
        "requires_approval": False,
        "roles_conditional": ["Production requires DevOps approval"]
    },
    {
        "title": "Secrets Manager Access",
        "section": "DEV-3.2",
        "text": "Access to secrets manager (Vault, AWS Secrets Manager) requires DevOps approval. Read-only access for senior engineers. Write access limited to DevOps and SRE teams.",
        "tags": ["secrets", "credentials", "vault"],
        "roles_allowed": ["DevOps", "SRE"],
        "roles_conditional": ["Senior Engineer (read-only)"],
        "requires_approval": True
    },

    # === Code Repository Access ===
    {
        "title": "GitHub Repository Access",
        "section": "DEV-4.1",
        "text": "All engineers have access to non-sensitive repositories. Access to security-sensitive repos (infrastructure, auth services) requires Security approval and signed NDA.",
        "tags": ["git", "repository", "code-access"],
        "roles_allowed": ["Engineer", "Senior Engineer"],
        "requires_approval": False,
        "sensitive_repos_approval": "Security Team"
    },
    {
        "title": "Repository Admin Rights",
        "section": "DEV-4.2",
        "text": "Repository admin rights (force push, delete branches, modify settings) limited to Engineering Managers and Staff Engineers. Requires Git security training completion.",
        "tags": ["git", "admin", "repository"],
        "roles_allowed": ["Engineering Manager", "Staff Engineer"],
        "requires_training": True
    },

    # === Logging & Monitoring Access ===
    {
        "title": "Production Logs Access",
        "section": "DEV-5.1",
        "text": "Senior engineers may access production logs via logging platform (Datadog, Splunk) for debugging. PII in logs is masked. Log exports require Engineering Manager approval.",
        "tags": ["logs", "monitoring", "production"],
        "roles_allowed": ["Senior Engineer", "Staff Engineer", "SRE"],
        "requires_approval": False,
        "export_requires_approval": True
    },
    {
        "title": "Audit Log Access",
        "section": "DEV-5.2",
        "text": "Security and Compliance teams have full access to audit logs. Other teams require Security approval with documented reason. Audit logs cannot be modified or deleted.",
        "tags": ["audit", "logs", "compliance"],
        "roles_allowed": ["Security", "Compliance", "Legal"],
        "immutable": True
    },

    # === Financial & Business Data ===
    {
        "title": "Financial Reports Access",
        "section": "FIN-1.1",
        "text": "Finance team may access all financial reports. Quarterly reports may be shared with executives. Detailed revenue data requires CFO approval for non-finance personnel.",
        "tags": ["finance", "reports", "sensitive"],
        "roles_allowed": ["Finance", "CFO", "CEO"],
        "roles_conditional": ["Executive (quarterly only)"],
        "requires_approval": True
    },
    {
        "title": "Customer Revenue Data",
        "section": "FIN-1.2",
        "text": "Account Executives may view revenue data for their assigned accounts only. Cross-account or aggregate revenue analysis requires Sales VP approval.",
        "tags": ["finance", "revenue", "sales"],
        "roles_allowed": ["Finance", "Sales VP"],
        "roles_conditional": ["Account Executive (own accounts)"],
        "requires_approval": True
    },

    # === General & Audit ===
    {
        "title": "Comprehensive Audit Logging",
        "section": "AUD-1.1",
        "text": "All data access decisions must be logged with timestamp, user identity, role, requested resource, decision (allow/deny), policy reference, and approval chain. Logs retained for 7 years.",
        "tags": ["audit", "logging", "compliance"],
        "applies_to": "all",
        "retention": "7 years"
    },
    {
        "title": "Company Directory Access",
        "section": "GEN-1.1",
        "text": "Company directory (names, emails, departments, office locations) accessible to all employees. Phone numbers and personal information excluded. External access prohibited.",
        "tags": ["public", "directory", "general"],
        "roles_allowed": ["All Employees"],
        "requires_approval": False
    },
    {
        "title": "Emergency Access Override",
        "section": "SEC-3.1",
        "text": "During P0 incidents, on-call engineers may request emergency access override for production systems. Override granted by on-call SRE, logged immediately, reviewed within 24 hours. Misuse results in disciplinary action.",
        "tags": ["emergency", "incident", "override"],
        "roles_allowed": ["On-Call Engineer", "SRE"],
        "requires_approval": True,
        "approval_level": "On-Call SRE",
        "review_sla": "24 hours"
    }
]

with policies.batch.dynamic() as batch:
    for d in docs:
        batch.add_object(properties=d)

print(f"✅ Loaded {policies.aggregate.over_all(total_count=True).total_count} policies")
client.close()
