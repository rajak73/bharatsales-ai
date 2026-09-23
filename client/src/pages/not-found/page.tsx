import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import { buttonClassName } from '@bharatsales/ui';
import { BrandLogo } from '../_public/brand';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-4 sm:px-5 lg:px-6">
          <BrandLogo />
        </div>
      </header>
      <main id="main-content" className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center">
        <span aria-hidden="true" className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600">
          <Compass className="h-6 w-6" />
        </span>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-700">Error 404</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">Page not found</h1>
        <p className="mt-2 max-w-md text-sm text-foreground-muted sm:text-base">
          The page you&apos;re looking for doesn&apos;t exist or has moved. Check the address, or head back to a page you know.
        </p>
        <div className="mt-6 flex w-full max-w-xs flex-col gap-2 sm:max-w-none sm:flex-row sm:justify-center">
          <Link to="/dashboard" className={buttonClassName({ variant: 'outline' })}>
            Go to dashboard
          </Link>
          <Link to="/" className={buttonClassName({ className: 'gap-2' })}>
            <ArrowLeft aria-hidden="true" /> Go home
          </Link>
        </div>
        <p className="mt-6 text-sm text-foreground-subtle">
          Need help?{' '}
          <Link to="/contact" className="font-medium text-primary-700 hover:underline">
            Contact us
          </Link>
        </p>
      </main>
    </div>
  );
}
