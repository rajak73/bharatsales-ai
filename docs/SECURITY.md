# BharatSales AI - Security Specification

## Authentication

### Token-Based Auth
- JWT access tokens (short-lived: 15 minutes)
- Refresh tokens (longer-lived: 7 days, rotating)
- Secure HTTP-only cookies for web
- Bearer tokens for mobile/API

### Login Security
- Rate limiting: 5 attempts per 15 minutes
- Progressive delay after failures
- Account lockout after 10 failed attempts
- Login errors do NOT reveal if account exists
- Suspended tenant and inactive user blocked with support guidance

### Session Management
- Device records with fingerprinting
- Remote logout capability
- Logout all devices option
- Session list with device info
- Expired session cleanup

## Authorization

### Role-Based Access Control (RBAC)
- 11 predefined roles
- Feature permissions (module access)
- Action permissions (CRUD operations)
- Scope restrictions (hierarchy/territory/ownership)
- Field-level restrictions

### Tenant Isolation
- organization_id derived from authenticated token
- Client-supplied tenant IDs are IGNORED
- Every repository query scoped by tenant
- Tenant-scoped unique constraints
- Cross-tenant access tests in CI

## Data Protection

### Encryption
- TLS 1.3 for data in transit
- Encryption at rest via managed infrastructure
- Sensitive fields encrypted at application level
- Secrets stored outside source code (env/vault)

### PII Handling
- Precise location access logged
- Configurable retention policies
- PII access audit trail
- Data minimization principles

### File Security
- Signed upload URLs
- File type/size validation
- Malware/content scanning hooks
- Tenant-scoped file paths

## API Security

### Input Validation
- Zod/class validation on all inputs
- Request size limits
- Content-type enforcement
- SQL/NoSQL injection prevention

### Headers
- Helmet.js for secure headers
- CORS configuration
- CSRF protection where applicable
- Content Security Policy

### Rate Limiting
- Per-IP rate limiting
- Per-user rate limiting
- Per-tenant rate limiting
- Configurable limits per endpoint

## Privacy

### Location Data
- Collected ONLY during active work sessions
- Explicit disclosure to users
- Configurable retention
- Stopped after End Day
- Never used for non-work purposes

### Employee Transparency
- Clear explanation of what data is collected
- Purpose limitation
- AI/anomaly flags are advisory only
- No automatic disciplinary actions
- Distinguish verified facts from risk inferences

## Audit

### Audit Events
- Login success/failure
- Logout and token refresh
- Create/update operations
- Approval/rejection
- Cancellation/reversal
- Export operations
- Permission changes
- Tenant lifecycle changes
- Support impersonation

### Audit Record Contents
- Tenant ID
- Actor ID
- Action type
- Entity type and ID
- Before/after summary
- Timestamp (UTC)
- IP address
- Device/session info
- Correlation ID
- Reason/source

## OWASP Alignment
- Input validation
- Output encoding
- Authentication controls
- Session management
- Access control
- Cryptographic practices
- Error handling
- Logging
- File management
- API security
