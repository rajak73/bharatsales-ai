import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireRole } from './components/routing/RequireRole';
import { ScrollToTop } from './components/routing/ScrollToTop';
import { Titled } from './components/routing/Titled';
import { PageLoader } from './components/routing/PageLoader';
import { rolesForRoute } from './components/layout/navConfig';

// ---------------------------------------------------------------------------
// Pages are lazy-loaded so each route ships as its own chunk.
// ---------------------------------------------------------------------------

// Public / marketing / auth
const HomePage = lazy(() => import('./pages/page'));
const ContactPage = lazy(() => import('./pages/contact/page'));
const DeviceVerifyPage = lazy(() => import('./pages/device-verify/page'));
const FeaturesPage = lazy(() => import('./pages/features/page'));
const ForcePasswordResetPage = lazy(() => import('./pages/force-password-reset/page'));
const ForgotPasswordPage = lazy(() => import('./pages/forgot-password/page'));
const IndustriesPage = lazy(() => import('./pages/industries/page'));
const InvitePage = lazy(() => import('./pages/invite/page'));
const LoginPage = lazy(() => import('./pages/login/page'));
const OnboardingPage = lazy(() => import('./pages/onboarding/page'));
const PricingPage = lazy(() => import('./pages/pricing/page'));
const PrivacyPage = lazy(() => import('./pages/privacy/page'));
const ResetPasswordPage = lazy(() => import('./pages/reset-password/page'));
const SignupPage = lazy(() => import('./pages/signup/page'));
const TermsPage = lazy(() => import('./pages/terms/page'));
const VerifyEmailPage = lazy(() => import('./pages/verify-email/page'));
const NotFoundPage = lazy(() => import('./pages/not-found/page'));

// Dashboard (layout routes + pages)
const DashboardLayout = lazy(() => import('./pages/dashboard/layout'));
const DashboardHome = lazy(() => import('./pages/dashboard/page'));
const AnalyticsPage = lazy(() => import('./pages/dashboard/analytics/page'));
const ApprovalsPage = lazy(() => import('./pages/dashboard/approvals/page'));
const BeatsPage = lazy(() => import('./pages/dashboard/beats/page'));
const CollectionsPage = lazy(() => import('./pages/dashboard/collections/page'));
const DeliveriesPage = lazy(() => import('./pages/dashboard/deliveries/page'));
const DistributorsPage = lazy(() => import('./pages/dashboard/distributors/page'));
const HierarchyPage = lazy(() => import('./pages/dashboard/hierarchy/page'));
const IncentivesPage = lazy(() => import('./pages/dashboard/incentives/page'));
const InventoryPage = lazy(() => import('./pages/dashboard/inventory/page'));
const LiveMapPage = lazy(() => import('./pages/dashboard/live-map/page'));
const NotificationsPage = lazy(() => import('./pages/dashboard/notifications/page'));
const OrdersPage = lazy(() => import('./pages/dashboard/orders/page'));
const Outlet360Page = lazy(() => import('./pages/dashboard/outlet-360/page'));
const OutletsPage = lazy(() => import('./pages/dashboard/outlets/page'));
const PerformancePage = lazy(() => import('./pages/dashboard/performance/page'));
const DashboardPricingPage = lazy(() => import('./pages/dashboard/pricing/page'));
const ProductsPage = lazy(() => import('./pages/dashboard/products/page'));
const ReportsPage = lazy(() => import('./pages/dashboard/reports/page'));
const DsrPage = lazy(() => import('./pages/dashboard/reports/dsr/page'));
const ReturnsPage = lazy(() => import('./pages/dashboard/returns/page'));
const RolesPage = lazy(() => import('./pages/dashboard/roles/page'));
const SalesPage = lazy(() => import('./pages/dashboard/sales/page'));
const SettingsPage = lazy(() => import('./pages/dashboard/settings/page'));
const TargetsPage = lazy(() => import('./pages/dashboard/targets/page'));
const TeamPage = lazy(() => import('./pages/dashboard/team/page'));

// Super Admin (platform) section
const SuperAdminLayout = lazy(() => import('./pages/dashboard/superadmin/layout'));
const SuperAdminHome = lazy(() => import('./pages/dashboard/superadmin/page'));
const SuperAdminAnalytics = lazy(() => import('./pages/dashboard/superadmin/analytics/page'));
const SuperAdminAudit = lazy(() => import('./pages/dashboard/superadmin/audit/page'));
const SuperAdminBilling = lazy(() => import('./pages/dashboard/superadmin/billing/page'));
const SuperAdminOrganizations = lazy(() => import('./pages/dashboard/superadmin/organizations/page'));
const SuperAdminSettings = lazy(() => import('./pages/dashboard/superadmin/settings/page'));
const SuperAdminSubscriptions = lazy(() => import('./pages/dashboard/superadmin/subscriptions/page'));
const SuperAdminSupport = lazy(() => import('./pages/dashboard/superadmin/support/page'));
const SuperAdminUsers = lazy(() => import('./pages/dashboard/superadmin/users/page'));

type Page = LazyExoticComponent<ComponentType>;

/** A public page with its document title. */
function publicPage(Page: Page, title?: string) {
  return (
    <Titled title={title}>
      <Page />
    </Titled>
  );
}

/**
 * A dashboard page guarded by the same role list the Sidebar uses for its
 * link (navConfig.ts), so typing a hidden page's URL redirects to /dashboard.
 */
function guarded(path: string, Page: Page, title: string) {
  return (
    <RequireRole roles={rolesForRoute(path)}>
      <Titled title={title}>
        <Page />
      </Titled>
    </RequireRole>
  );
}

/** Dashboard child routes: [path relative to /dashboard, component, title]. */
const DASHBOARD_ROUTES: [string, Page, string][] = [
  ['analytics', AnalyticsPage, 'Analytics'],
  ['approvals', ApprovalsPage, 'Approvals'],
  ['beats', BeatsPage, 'Beats'],
  ['collections', CollectionsPage, 'Payments'],
  ['deliveries', DeliveriesPage, 'Deliveries'],
  ['distributors', DistributorsPage, 'Distributors'],
  ['hierarchy', HierarchyPage, 'Hierarchy'],
  ['incentives', IncentivesPage, 'Incentives'],
  ['inventory', InventoryPage, 'Inventory'],
  ['live-map', LiveMapPage, 'Live Map'],
  ['notifications', NotificationsPage, 'Notifications'],
  ['orders', OrdersPage, 'Orders'],
  ['outlet-360', Outlet360Page, 'Outlet 360'],
  ['outlets', OutletsPage, 'Outlets'],
  ['performance', PerformancePage, 'Performance'],
  ['pricing', DashboardPricingPage, 'Pricing & Schemes'],
  ['products', ProductsPage, 'Products'],
  ['reports', ReportsPage, 'Reports'],
  ['reports/dsr', DsrPage, 'Daily Sales Report'],
  ['returns', ReturnsPage, 'Returns'],
  ['roles', RolesPage, 'Roles'],
  ['sales', SalesPage, 'Sales'],
  ['settings', SettingsPage, 'Settings'],
  ['targets', TargetsPage, 'Targets'],
  ['team', TeamPage, 'Team'],
];

/** Super Admin child routes (relative to /dashboard/superadmin). */
const SUPERADMIN_ROUTES: [string, Page, string][] = [
  ['analytics', SuperAdminAnalytics, 'Platform Analytics'],
  ['audit', SuperAdminAudit, 'Audit Logs'],
  ['billing', SuperAdminBilling, 'Billing'],
  ['organizations', SuperAdminOrganizations, 'Organizations'],
  ['settings', SuperAdminSettings, 'Platform Settings'],
  ['subscriptions', SuperAdminSubscriptions, 'Subscriptions'],
  ['support', SuperAdminSupport, 'Support'],
  ['users', SuperAdminUsers, 'Global Users'],
];

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader fullScreen />}>
        <Routes>
          <Route path="/" element={publicPage(HomePage)} />
          <Route path="/contact" element={publicPage(ContactPage, 'Contact')} />
          <Route path="/device-verify" element={publicPage(DeviceVerifyPage, 'Verify Device')} />
          <Route path="/features" element={publicPage(FeaturesPage, 'Features')} />
          <Route path="/force-password-reset" element={publicPage(ForcePasswordResetPage, 'Reset Password')} />
          <Route path="/forgot-password" element={publicPage(ForgotPasswordPage, 'Forgot Password')} />
          <Route path="/industries" element={publicPage(IndustriesPage, 'Industries')} />
          <Route path="/invite" element={publicPage(InvitePage, 'Accept Invite')} />
          <Route path="/login" element={publicPage(LoginPage, 'Sign In')} />
          <Route path="/onboarding" element={publicPage(OnboardingPage, 'Onboarding')} />
          <Route path="/pricing" element={publicPage(PricingPage, 'Pricing')} />
          <Route path="/privacy" element={publicPage(PrivacyPage, 'Privacy Policy')} />
          <Route path="/reset-password" element={publicPage(ResetPasswordPage, 'Reset Password')} />
          <Route path="/signup" element={publicPage(SignupPage, 'Sign Up')} />
          <Route path="/terms" element={publicPage(TermsPage, 'Terms of Service')} />
          <Route path="/verify-email" element={publicPage(VerifyEmailPage, 'Verify Email')} />

          {/* Dashboard layout: decodes the session once, provides useCurrentUser(),
              renders Sidebar + Header around an <Outlet/>. */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={guarded('/dashboard', DashboardHome, 'Dashboard')} />
            {DASHBOARD_ROUTES.map(([path, Page, title]) => (
              <Route key={path} path={path} element={guarded(`/dashboard/${path}`, Page, title)} />
            ))}

            {/* Platform section: Super Admin / platformAdmin only. */}
            <Route
              path="superadmin"
              element={
                <RequireRole roles={rolesForRoute('/dashboard/superadmin')}>
                  <SuperAdminLayout />
                </RequireRole>
              }
            >
              <Route index element={guarded('/dashboard/superadmin', SuperAdminHome, 'Platform Dashboard')} />
              {SUPERADMIN_ROUTES.map(([path, Page, title]) => (
                <Route
                  key={path}
                  path={path}
                  element={guarded(`/dashboard/superadmin/${path}`, Page, title)}
                />
              ))}
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>

          <Route path="*" element={publicPage(NotFoundPage, 'Page Not Found')} />
        </Routes>
      </Suspense>
    </>
  );
}
