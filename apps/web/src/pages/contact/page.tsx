import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Download, Mail, MessageCircle } from 'lucide-react';
import { Alert, Button, Card, Input, Select, Textarea, buttonClassName } from '@bharatsales/ui';
import { ANDROID_APK_URL, CONTACT_EMAIL, Container, MarketingLayout, SectionHeading, WHATSAPP_DIGITS } from '../_public/marketing';

const INDUSTRY_OPTIONS = ['FMCG', 'Pharmaceutical', 'Consumer Goods', 'Paint & Building Materials', 'Agri Inputs', 'Other'].map((v) => ({
  value: v,
  label: v,
}));

const EMPTY_FORM = { firstName: '', lastName: '', email: '', company: '', industry: '', message: '' };

/** Enquiries are sent through a real channel (email app or WhatsApp) — there is no server-side contact inbox. */
const HAS_CHANNEL = !!(CONTACT_EMAIL || WHATSAPP_DIGITS);

function ContactItem({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <Card padding="md" className="flex gap-3">
      <span
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 [&_svg]:h-5 [&_svg]:w-5"
      >
        {icon}
      </span>
      <div className="min-w-0">
        <h2 className="font-display text-base font-bold text-navy-900">{title}</h2>
        <div className="mt-1 text-sm leading-relaxed text-foreground-muted">{children}</div>
      </div>
    </Card>
  );
}

function composeEnquiry(f: typeof EMPTY_FORM) {
  return [
    `Name: ${`${f.firstName} ${f.lastName}`.trim()}`,
    `Email: ${f.email}`,
    f.company && `Company: ${f.company}`,
    f.industry && `Industry: ${f.industry}`,
    f.message && `\n${f.message}`,
  ]
    .filter(Boolean)
    .join('\n');
}

function EnquiryForm() {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [opened, setOpened] = useState(false);

  const set = (key: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setFormData((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = composeEnquiry(formData);
    const url = CONTACT_EMAIL
      ? `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('BharatSales AI demo request')}&body=${encodeURIComponent(body)}`
      : `https://wa.me/${WHATSAPP_DIGITS}?text=${encodeURIComponent(`BharatSales AI demo request\n${body}`)}`;
    window.open(url, CONTACT_EMAIL ? '_self' : '_blank', 'noopener,noreferrer');
    setOpened(true);
  };

  const via = CONTACT_EMAIL ? 'your email app' : 'WhatsApp';

  return (
    <Card padding="lg" className="lg:col-span-3">
      <h2 className="font-display text-lg font-bold text-navy-900">Ask for a demo</h2>
      <p className="mt-1 text-sm text-foreground-muted">This opens {via} with your details filled in, ready to send.</p>

      {opened && (
        <Alert tone="info" className="mt-4" role="status" onDismiss={() => setOpened(false)}>
          Your message is ready in {via}. Press send there to reach us.
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="First name" required autoComplete="given-name" placeholder="Rahul" value={formData.firstName} onChange={set('firstName')} />
          <Input label="Last name" required autoComplete="family-name" placeholder="Sharma" value={formData.lastName} onChange={set('lastName')} />
        </div>
        <Input
          label="Work email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="rahul@company.com"
          value={formData.email}
          onChange={set('email')}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Company name" optional autoComplete="organization" placeholder="Your Company Pvt Ltd" value={formData.company} onChange={set('company')} />
          <Select label="Industry" optional placeholder="Select your industry" options={INDUSTRY_OPTIONS} value={formData.industry} onChange={set('industry')} />
        </div>
        <Textarea
          label="Message"
          optional
          rows={4}
          placeholder="How many reps and distributors do you have? What do you want to see?"
          value={formData.message}
          onChange={set('message')}
        />
        <Button type="submit" fullWidth size="lg">
          {CONTACT_EMAIL ? 'Write email' : 'Continue on WhatsApp'}
        </Button>
      </form>
    </Card>
  );
}

export default function ContactPage() {
  return (
    <MarketingLayout>
      <section className="border-b border-border bg-background py-8 sm:py-10">
        <Container>
          <SectionHeading
            as="h1"
            eyebrow="Contact"
            title="Get in touch"
            description="Ask for a demo, or create your organisation account and start setting up."
          />
        </Container>
      </section>

      <section className="bg-white py-8 sm:py-10">
        <Container className={HAS_CHANNEL ? 'grid gap-4 lg:grid-cols-5 lg:gap-6' : 'grid max-w-3xl gap-4'}>
          {HAS_CHANNEL && <EnquiryForm />}

          <div className={HAS_CHANNEL ? 'space-y-3 lg:col-span-2' : 'grid gap-3 sm:grid-cols-2'}>
            {CONTACT_EMAIL && (
              <ContactItem icon={<Mail />} title="Email">
                <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-primary-700 hover:underline">
                  {CONTACT_EMAIL}
                </a>
              </ContactItem>
            )}
            {WHATSAPP_DIGITS && (
              <ContactItem icon={<MessageCircle />} title="WhatsApp">
                <a href={`https://wa.me/${WHATSAPP_DIGITS}`} target="_blank" rel="noopener noreferrer" className="font-medium text-primary-700 hover:underline">
                  Chat with us
                </a>
              </ContactItem>
            )}
            <ContactItem icon={<Building2 />} title="Create your organisation">
              <p>Sign up with your company name and work email. The platform admin reviews each new organisation; once approved, you can sign in and add your team.</p>
              <Link to="/signup" className={buttonClassName({ variant: 'primary', size: 'sm', className: 'mt-2' })}>
                Create account
              </Link>
            </ContactItem>
            <ContactItem icon={<Download />} title="Android app">
              <p>The field app for reps and distributors. Sign in with an account your admin created.</p>
              <a href={ANDROID_APK_URL} className={buttonClassName({ variant: 'outline', size: 'sm', className: 'mt-2' })}>
                Download APK
              </a>
            </ContactItem>
          </div>
        </Container>
      </section>
    </MarketingLayout>
  );
}
