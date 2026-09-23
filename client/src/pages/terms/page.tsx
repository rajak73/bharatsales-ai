import { LegalPage, type LegalSection } from '../_public/legal';

const SECTIONS: LegalSection[] = [
  {
    id: 'acceptance',
    title: 'Acceptance of terms',
    body: <p>By accessing or using BharatSales AI, you agree to be bound by these Terms of Service. If you are using our services on behalf of an organization, you represent that you have authority to bind that organization.</p>,
  },
  {
    id: 'service',
    title: 'Service description',
    body: <p>BharatSales AI provides a multi-tenant SaaS platform for field sales automation, distributor management, and analytics. The service includes web dashboards, mobile applications, APIs, and related documentation.</p>,
  },
  {
    id: 'accounts',
    title: 'User accounts',
    body: <p>You are responsible for maintaining the security of your account credentials. Each user account is personal and must not be shared. You must notify us immediately of any unauthorized access.</p>,
  },
  {
    id: 'acceptable-use',
    title: 'Acceptable use',
    body: <p>You agree not to misuse the service, attempt to access data outside your authorized scope, reverse-engineer the platform, or use the service for any illegal purpose.</p>,
  },
  {
    id: 'data-ownership',
    title: 'Data ownership',
    body: <p>You retain all rights to your data. We process your data solely to provide the service and as instructed by you. We do not sell or share your data with third parties except as required for service delivery.</p>,
  },
  {
    id: 'availability',
    title: 'Service availability',
    body: <p>We target 99.9% monthly availability but do not guarantee uninterrupted access. Planned maintenance will be communicated in advance.</p>,
  },
  {
    id: 'liability',
    title: 'Limitation of liability',
    body: <p>To the maximum extent permitted by law, BharatSales AI shall not be liable for indirect, incidental, or consequential damages arising from use of the service.</p>,
  },
  {
    id: 'governing-law',
    title: 'Governing law',
    body: <p>These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Hyderabad, Telangana.</p>,
  },
  {
    id: 'contact',
    title: 'Contact',
    body: (
      <p>
        For questions about these terms, contact{' '}
        <a href="mailto:legal@bharatsales.ai" className="font-medium text-primary-700 hover:underline">
          legal@bharatsales.ai
        </a>
        .
      </p>
    ),
  },
];

export default function TermsPage() {
  return <LegalPage title="Terms of Service" updated="14 July 2026" sections={SECTIONS} />;
}
