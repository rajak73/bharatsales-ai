import * as React from 'react';

export interface UILinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

type LinkComponent = React.ComponentType<UILinkProps>;

const DefaultLink: LinkComponent = React.forwardRef<HTMLAnchorElement, UILinkProps>((props, ref) => <a ref={ref} {...props} />) as unknown as LinkComponent;

const LinkContext = React.createContext<LinkComponent>(DefaultLink);

/**
 * Lets UI components (breadcrumbs, dropdown/menu links, pagination) render the
 * app's router link without depending on react-router. apps/web passes an
 * adapter that maps `href` → react-router `<Link to>`.
 */
export function LinkProvider({ component, children }: { component: LinkComponent; children: React.ReactNode }) {
  return <LinkContext.Provider value={component}>{children}</LinkContext.Provider>;
}

/** Router-aware link used inside @bharatsales/ui components. */
export function UILink(props: UILinkProps) {
  const Comp = React.useContext(LinkContext);
  return <Comp {...props} />;
}
