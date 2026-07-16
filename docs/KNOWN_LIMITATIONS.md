# BharatSales AI - Known Limitations

## Current Limitations (v1.0)

### Field PWA
- Field PWA is not yet built (planned for Phase 2)
- Offline sync UI not yet available
- Mobile app install prompt not yet implemented

### AI Features
- AI recommendations use rule-based fallback (no external AI provider configured)
- Demand forecasting uses simple historical average
- Manager Copilot shows "AI provider not configured" state

### Integrations
- Maps: Using placeholder (Leaflet/OSM integration pending)
- Tally/ERP: Provider interface created, no live connection
- WhatsApp: Provider interface created, requires approved provider
- SMS/OTP: Provider interface created, requires credentials
- Payment/UPI: Provider interface created, requires provider

### Advanced Features
- Full accounting ledger replacement (explicitly deferred)
- Payroll and HRMS integration (explicitly deferred)
- Government e-invoice/e-way bill (requires certified integration)
- IoT/cold-chain sensors (explicitly deferred)
- Retail consumer marketplace (explicitly deferred)

### Performance
- Load testing for 10,000 concurrent users not yet performed
- MongoDB sharding not yet configured (single replica set)
- Redis cluster mode not yet enabled
- CDN for static assets not yet configured

### Browser Support
- Field PWA requires modern browser with service worker support
- IE11 not supported
- Safari 14+ required for PWA features

## Technical Debt

1. **Authentication**: Demo mode uses simplified auth. Production requires:
   - Proper password hashing with bcrypt
   - Token blacklist for logout
   - Device fingerprinting

2. **Database**: 
   - Some collections lack full validation schemas
   - Migration scripts needed for production deployments
   - Index optimization pending load testing

3. **Testing**:
   - Unit test coverage < target (80%)
   - E2E tests for PWA pending
   - Load/performance tests pending

4. **Monitoring**:
   - APM tool not yet integrated
   - Log aggregation not configured
   - Alert rules not yet defined

## Planned Improvements

### Phase 2
- Complete Field PWA with offline support
- Beat planning UI with map editor
- Visit management with photo capture

### Phase 3
- Full order fulfillment workflow
- Inventory ledger with all movement types
- Dispatch and delivery tracking

### Phase 4
- Complete finance module
- Scheduled reports
- Advanced analytics

### Phase 5
- Super Admin console
- Subscription management
- AI provider integrations
- Third-party integrations

### Phase 6
- Security audit and penetration testing
- Performance optimization
- Production hardening
- Monitoring and alerting
