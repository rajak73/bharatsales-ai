import * as React from 'react';
import { LinkProvider, type UILinkProps } from './link';
import { ToastProvider } from './toast';

export interface UIProviderProps {
  /** Router link adapter: ({ href, ...rest }) => <Link to={href} {...rest} />. */
  linkComponent?: React.ComponentType<UILinkProps>;
  children: React.ReactNode;
}

/** Mount once at the app root: router-aware links + toasts. */
export function UIProvider({ linkComponent, children }: UIProviderProps) {
  const content = <ToastProvider>{children}</ToastProvider>;
  return linkComponent ? <LinkProvider component={linkComponent}>{content}</LinkProvider> : content;
}
