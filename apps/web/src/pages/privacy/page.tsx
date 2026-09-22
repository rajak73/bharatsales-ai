import { LegalPage, type LegalSection } from '../_public/legal';

const SECTIONS: LegalSection[] = [
  {
    id: 'information-we-collect',
    title: 'Information we collect',
    body: <p>We collect information you provide directly, including company details, user accounts, product catalogs, outlet information, and transaction data necessary to provide our field sales automation services.</p>,
  },
  {
    id: 'location-data',
    title: 'Location data',
    body: <p>With clear disclosure and consent, we collect GPS location data during active work sessions only. Location is used solely for visit verification, route optimization, and team tracking during working hours. Tracking stops automatically after End Day.</p>,
  },
  {
    id: 'how-we-use',
    title: 'How we use information',
    body: <p>We use collected information to provide, maintain, and improve our services; generate reports and analytics; ensure security and prevent fraud; and comply with legal obligations.</p>,
  },
  {
    id: 'data-security',
    title: 'Data security',
    body: <p>We implement bank-grade encryption, tenant isolation, access controls, and regular security audits. All data is stored in Indian data centers with encrypted backups.</p>,
  },
  {
    id: 'data-retention',
    title: 'Data retention',
    body: <p>Data is retained according to your organization&apos;s configured retention policies. Archived tenant data is kept in read-only mode for the configured period.</p>,
  },
  {
    id: 'your-rights',
    title: 'Your rights',
    body: <p>You have the right to access, correct, export, and delete your data. Contact your organization administrator or our support team for assistance.</p>,
  },
  {
    id: 'contact',
    title: 'Contact us',
    body: (
      <p>
        For privacy-related inquiries, contact us at{' '}
        <a href="mailto:privacy@bharatsales.ai" className="font-medium text-primary-700 hover:underline">
          privacy@bharatsales.ai
        </a>
        .
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return <LegalPage title="Privacy Policy" updated="14 July 2026" sections={SECTIONS} />;
}
