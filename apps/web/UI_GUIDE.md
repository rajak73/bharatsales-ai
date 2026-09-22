# BharatSales UI Guide

How every screen in `apps/web` should look and behave. The components live in
`packages/ui/src` and are imported from `@bharatsales/ui`. The design tokens
live in `packages/ui/tailwind.config.js`, which is the Tailwind preset for this app.

> **Visual changes only.** When you restyle a page, do not change its API calls,
> data flow, route paths, role checks, `useCurrentUser()`, `RequireRole`,
> `ErrorState` + retry, or polling logic. Change only markup and classes.

---

## 1. Design direction — "Navy + Saffron", compact

This is a clean, professional, **dense** SaaS dashboard. Our users are
distributors, reps and managers on laptops and budget Android phones, often on slow 3G/4G.
They want to see a lot at once, so **there are no big empty areas**.

- **Navy frame, white work area.** The sidebar (and the marketing hero) is navy `navy-900`
  `#0B1F44`. Pages sit on `bg-background` `#F4F6FB` with white cards, a 1px `border-border`
  `#E3E8F2` and barely-visible `shadow-soft`. No gradients on buttons or backgrounds
  (the only exception is the subtle navy radial glow of `.gradient-hero` on the homepage),
  no glassmorphism, no `shadow-xl` in the dashboard.
- **Blue does the work.** `primary-600` `#1B4FD8` (hover `primary-700` `#163FAE`, tint
  `primary-100` `#DFE8FF`) is for primary buttons, links, focus rings, selected rows and active tabs.
- **Saffron is the ONE accent CTA per view.** `saffron-500` `#FF8A1F` (hover `saffron-600`
  `#E9760C`, soft `saffron-100` `#FFF1E3`) is for the single most important call to action on a
  screen — `<Button variant="accent">+ New order</Button>`, "Book a Demo" — plus the notification
  count, the sidebar active indicator and the 2nd chart series. Everything else stays blue/neutral.
  Text on a saffron fill is **navy**, never white (white on `#FF8A1F` fails contrast). For
  saffron-coloured text on white use `text-saffron-700` or darker.
- **Hierarchy through type, not colour.** Headings (`h1`–`h3`) automatically use the display
  face **Plus Jakarta Sans** (`font-display`); body copy is **Inter**. Use one `h1` per page
  (PageHeader) and `h2` for card titles. Numbers use `tabular-nums`.
- **Compact spacing.** See §1a. Default gaps are 12–16px, not 24–32px.
- **Accessible by default.** Text meets WCAG AA contrast, every control shows a visible focus ring,
  touch targets are 44px or larger on phones, and nothing depends on colour alone (status pills have text).

### 1a. Compact spacing rules (built into the components — match them in page code)

| Thing | Rule |
|---|---|
| Page container | `px-4 py-4` phone / `sm:px-5 sm:py-5` desktop — provided by the layout |
| Between page sections | 16px: `PageSection` (`space-y-4`) or `gap-4` |
| Inside a section / card grids | `gap-3` (12px) or `gap-4` (16px). Never `gap-6`/`gap-8` |
| Card padding | 16px (`CardBody`, `<Card padding="md">`, `.card`); 12px for dense widgets (`padding="sm"`) |
| Card header | `px-4 pt-3.5`, title 15px semibold display font |
| Table rows | ≈40px (`py-2`); `dense` ≈34px; header 11px uppercase |
| KPI StatCard | `p-3 sm:px-4 sm:py-3.5`, label 12–14px, value `text-xl sm:text-2xl` bold |
| Header bar | 56px (`h-14`), white, bottom border |
| Sidebar | 240px wide, nav items 34px on desktop (44px on phones) |
| Page title | `text-xl sm:text-2xl` bold display font, description directly under it (`mt-0.5`) |
| Forms | 12px between fields (`space-y-3` / `grid gap-3`); label→control 4px |
| Controls | Input/Select/Button md = 36px on desktop, 44px on phones; sm = 32px desktop |

When restyling a page, replace old roomy classes: `p-6`/`p-8` on cards → `p-4`;
`space-y-6`/`space-y-8`/`gap-6`/`gap-8` → `space-y-4`/`gap-4`; `mb-8`/`mt-8` → `mb-4`/`mt-4`;
`py-12`+ blocks → `py-8`; `text-3xl` page titles → PageHeader. Nothing should look cramped or
overlap — just no big empty areas.

---

## 2. Tokens (Tailwind classes)

| Purpose | Class | Value |
|---|---|---|
| Page background | `bg-background` | `#F4F6FB` |
| Table header / inset panel | `bg-surface-muted` | `#F7F9FC` |
| Card / surface | `bg-white` / `bg-surface` | `#fff` |
| Hover row / inset | `bg-surface-subtle` | `#EEF2F8` |
| Border (cards, dividers) | `border-border` | `#E3E8F2` |
| Border (inputs) | `border-border-strong` | `#CBD3E1` |
| Heading / body text | `text-gray-900` / `text-foreground` | `#0F172A` |
| Secondary text | `text-foreground-muted` | `#5B6478` (5.9:1) |
| Captions / meta | `text-foreground-subtle` | `#667085` (4.9:1, AA on white) |
| Primary (blue) | `primary-50…950` (`bg-primary-600`, hover `primary-700`, tint `primary-100`) | `#1B4FD8` / `#163FAE` / `#DFE8FF` |
| Navy (dark surfaces) | `navy-50…950`, `bg-navy` = `navy-900`; hover/active `navy-800`; deeper `navy-950`; text on navy `navy-200`, muted `navy-300` | `#0B1F44` / `#16336B` / `#071530` / `#C7D2E8` |
| Accent (one CTA per view) | `accent-*` = `saffron-*` (`bg-saffron-500`, hover `saffron-600`, soft `saffron-100`) | `#FF8A1F` / `#E9760C` / `#FFF1E3` |
| Success | `success-50…900` | emerald |
| Warning | `warning-50…900` | amber |
| Danger | `danger-50…900` | red |
| Info | `info-50…900` | sky |
| Shadows | `shadow-xs` (controls), `shadow-soft` (cards), `shadow-overlay` (menus, modals, toasts) | |
| Radius | `rounded-lg` (8px) controls/buttons, `rounded-xl` (12px) cards, `rounded-full` pills/avatars | |
| Fonts | `font-display` (Plus Jakarta Sans — h1–h3 get it automatically), `font-sans` (Inter) | |
| Z-index | `z-header` 30, `z-sidebar` 40, `z-overlay` 50, `z-toast` 60, `z-tooltip` 70 | |
| Content width | `max-w-page` (1440px), already applied by the dashboard layout | |
| Small text | `text-2xs` (11px): only for overlines and badge counts | |

`gray-*` now resolves to the **slate** palette, so older pages already use the
right neutrals. In new code, prefer the semantic tokens above over raw colours. Don't add
`blue-*`, `indigo-*`, `green-*` or `red-*` classes; use `primary`, `success` and `danger` instead.

**Type scale**

| Role | Classes |
|---|---|
| Page title (h1) | `font-display text-xl sm:text-2xl font-bold tracking-tight` (PageHeader) |
| Card title (h2) | `font-display text-[0.9375rem] font-semibold` (CardHeader / CardTitle) |
| Body | `text-sm text-gray-700` |
| Meta / helper | `text-xs` or `text-sm text-foreground-subtle` |
| KPI value | `font-display text-xl sm:text-2xl font-bold tabular-nums` (StatCard) |
| Table header | `text-2xs font-semibold uppercase tracking-wider text-foreground-subtle` (DataTable) |

Fonts: Plus Jakarta Sans 600/700/800 (headings) and Inter 400–700 (body), loaded from Google Fonts in
`index.html` with `display=swap`, falling back to the system UI font.

---

## 3. Page layout pattern

The dashboard layout (`pages/dashboard/layout.tsx`) already provides the sidebar,
the header, a skip link, `<main id="main-content">` and the page container
(`max-w-page`, compact gutters `px-4 py-4 sm:px-5 sm:py-5`). **Pages must not add their own outer
padding or max-width.**

Every page follows this order: **PageHeader → (StatGrid) → Toolbar → content Card / DataTable**

```tsx
import { PageHeader, PageSection, StatGrid, StatCard, Toolbar, SearchInput, Select,
         DataTable, Button, StatusPill, formatINR, formatDate } from '@bharatsales/ui';
import { Plus, ShoppingCart } from 'lucide-react';

<PageSection>
  <PageHeader
    title="Orders"
    description="Review and approve orders from your field team."
    actions={<Button variant="accent" leftIcon={<Plus />} onClick={openCreate}>New order</Button>}
  />

  <StatGrid columns={4}>
    <StatCard label="Pending review" value={formatNumber(pending)} icon={<ShoppingCart />} loading={loading} />
    …
  </StatGrid>

  <DataTable
    caption="Orders"
    itemLabel="orders"
    data={orders}
    columns={columns}
    loading={loading}
    error={loadError && <ErrorState title="Couldn't load orders" message={loadError} onRetry={fetchOrders} className="border-0" />}
    globalFilter={search}
    toolbar={
      <Toolbar>
        <SearchInput value={search} onValueChange={setSearch} placeholder="Search order no. or outlet" />
        <Select hideLabel label="Status" options={statusOptions} value={status} onChange={…} />
      </Toolbar>
    }
    onRowClick={(o) => setSelected(o)}
    selectedRowId={selected?.id}
    mobileLayout="cards"
  />
</PageSection>
```

Use a **Drawer** for detail views and forms longer than about 4 fields. Use a **Modal** for
short forms (1–4 fields) and confirmations. Don't use split-pane layouts that squeeze the
table.

---

## 4. Components

All components are exported from `@bharatsales/ui`. Icons come from `lucide-react`.

### Button / IconButton
```tsx
<Button>Save</Button>                                   // primary (default) — blue #1B4FD8
<Button variant="outline">Cancel</Button>               // secondary action next to a primary
<Button variant="secondary">Export</Button>             // neutral filled
<Button variant="ghost" size="sm">View all</Button>     // low-emphasis, toolbars/cards
<Button variant="danger">Delete product</Button>        // destructive (use inside ConfirmDialog)
<Button variant="accent" leftIcon={<Plus />}>New order</Button>  // THE saffron CTA — max one per view
<Button variant="link">Download invoice</Button>
<Button loading={saving}>Save changes</Button>          // spinner + disabled + aria-busy
<Button leftIcon={<Plus />}>Add outlet</Button>
<IconButton aria-label="Edit outlet" icon={<Pencil />} />   // aria-label is REQUIRED
```
- Props: `variant` (primary | secondary | outline | ghost | danger | accent | link; `destructive` is a legacy alias), `size` (sm | md | lg), `loading`, `leftIcon`, `rightIcon`, `fullWidth`, plus all `<button>` props. `type` defaults to `"button"`, so pass `type="submit"` in forms.
- Sizes are 44px on phones; on desktop lg = 40px, md = 36px, sm = 32px (same heights as Input/Select md/sm).
- **When to use `variant="accent"` (saffron, navy label):** only for the single most important
  "create / start" action on a screen — "+ New order", "Book a Demo", "Start day", "Plan beat".
  At most one per view; if a page has a header CTA, dialogs and cards on it use `primary`.
  Use `primary` (blue) for Save/Submit/Approve and every other main action, `outline` next to it for Cancel.
- For a link that should look like a button, use `className={buttonClassName({ variant: 'outline' })}` on `<Link>`.
- Put one primary button per view. In a button group the order is: Cancel (outline), then the primary on the right.

### Form controls
`Input`, `Textarea`, `Select`, `SearchInput`, `Checkbox`, `Switch`, `Label`, `FormField`
```tsx
<Input label="Outlet name" required value={name} onChange={…} error={errors.name} />
<Input label="GSTIN" optional helperText="15 characters, e.g. 29ABCDE1234F1Z5" />
<Input label="Credit limit" inputMode="decimal" leftIcon={<IndianRupee />} />
<Select label="Territory" placeholder="Select territory" options={[{ value: 'n', label: 'North' }]} />
<Textarea label="Reason" rows={3} />
<Checkbox label="Send WhatsApp confirmation" description="Outlet gets the order summary" />
<Switch label="Geofence check-in" description="Reps must be within 100 m" checked={on} onCheckedChange={setOn} />
<FormField label="Delivery date" error={err}>{(a11y) => <DatePicker {...a11y} />}</FormField>
```
- With `label`, `helperText` or `error`, the control is wrapped in a FormField and the label, helper text and error are wired up with `id` and `aria-describedby`. The field also gets `aria-invalid`, which turns its border red.
- Keep controls in one Toolbar the same size (default `md` next to `SearchInput`). `size="sm"` is for dense in-table filters.
- Use a Switch for settings that apply immediately. Use a Checkbox inside a submitted form.
- The legacy `.input-field` class is restyled to match. Replace it with `<Input>` when you touch a page.

### Card
```tsx
<Card>
  <CardHeader title="Top outlets" description="Last 30 days" actions={<Button variant="ghost" size="sm">View all</Button>} divided />
  <CardBody>…</CardBody>                 // padded; <CardBody flush> for edge-to-edge lists/tables
  <CardFooter><Button>Save</Button></CardFooter>
</Card>
<Card padding="md">simple content</Card>  // 16px; "sm" = 12px (dense widgets); "lg" = 16px phone / 20px desktop
<Card variant="muted">inset panel</Card>
```
`Card` has no padding by default, so the old `<Card className="p-6">` still works — but **change it to
`padding="md"` (16px)** when you touch the page; `p-6` is too roomy for the compact theme.
The legacy `CardContent` still works too. The `.card` CSS class is restyled to match.

### Badge / StatusPill
```tsx
<StatusPill status={order.status} />            // "Pending_Approval" → "Pending Approval", amber
<StatusPill status={payment.status} />          // Cleared → green, Bounced → red
<Badge tone="primary">Primary outlet</Badge>
<Badge tone="accent" variant="solid" size="sm">New</Badge>
getStatusTone('In Transit') // 'progress'
```
Always use `StatusPill` for workflow statuses. Never hand-pick status colours. See §6.

### StatCard / StatGrid (KPIs)
```tsx
<StatGrid columns={4}>
  <StatCard label="Revenue (MTD)" value={formatINR(revenue, { compact: true })} icon={<IndianRupee />}
            delta={{ value: 12.4, label: 'vs last month' }} loading={loading} />
  <StatCard label="Overdue" value={formatINR(overdue)} tone="danger" icon={<AlertTriangle />}
            delta={{ value: 8, positiveIsGood: false }} />
</StatGrid>
```
- Props: `label`, `value` (pre-formatted), `icon`, `tone`, `delta` { value (number = %, or a string), direction?, positiveIsGood?, label? }, `hint`, `loading` (shows a skeleton), `onClick` (makes the whole card a button).
- The grid is 2 columns on phones. Use compact ₹ (`₹4.5L`) in KPI tiles.

### DataTable
Props: `data`, `columns`, `getRowId?`, `loading`, `loadingRows`, `error` (node), `emptyState` (node),
`toolbar` (search and filter slot), `globalFilter` (text search across column `accessor`s),
`pagination` (`false` or `{ pageSize, pageSizeOptions }`, default 10 per page with a 10/25/50/100 picker), `initialSort`,
`onRowClick`, `selectedRowId`, `mobileLayout` ('scroll' | 'cards'), `caption`, `itemLabel`,
`bordered` (set it to false when the table is already inside a Card), `dense`, `footer`.

Column: `{ id, header, accessor?, cell?, sortable?, sortFn?, align?, width?, className?, hideBelow?: 'sm'|'md'|'lg', primary?, hideInCard?, searchable? }`
```tsx
const columns: DataTableColumn<Order>[] = [
  { id: 'no', header: 'Order', accessor: 'orderNumber', sortable: true, primary: true,
    cell: (o) => <span className="font-medium text-gray-900">{o.orderNumber}</span> },
  { id: 'date', header: 'Date', accessor: 'createdAt', sortable: true, cell: (o) => formatDate(o.createdAt), hideBelow: 'md' },
  { id: 'total', header: 'Amount', accessor: (o) => o.totals?.grandTotal ?? 0, align: 'right', sortable: true,
    cell: (o) => formatINR(o.totals?.grandTotal) },
  { id: 'status', header: 'Status', accessor: 'status', cell: (o) => <StatusPill status={o.status} /> },
];
```
- Always right-align money and quantities (`align: 'right'`).
- Put row actions in a last column, using `DropdownMenu` with an `IconButton` "⋯" trigger (`MoreHorizontal`). Call `e.stopPropagation()` in the trigger when the row is clickable.
- Use `mobileLayout="cards"` for tables people use on phones (orders, outlets, deliveries, payments).
- Pagination, sorting and search are client-side. If a page already filters on the server, pass the filtered data and leave `globalFilter` unset.

### Modal / ConfirmDialog / Drawer
```tsx
<Modal open={open} onClose={close} title="Add distributor" description="They'll get an invite by SMS."
       dismissible={!saving}
       footer={<><Button variant="outline" onClick={close}>Cancel</Button>
                 <Button type="submit" form="dist-form" loading={saving}>Add distributor</Button></>}>
  <form id="dist-form" onSubmit={handleSubmit} className="space-y-4">…</form>
</Modal>

<ConfirmDialog open={!!cancelId} onClose={() => setCancelId(null)} tone="danger"
  title="Cancel this order?" description="The outlet will be notified. This can't be undone."
  confirmLabel="Cancel order" cancelLabel="Keep order" onConfirm={() => handleCancel(cancelId!)}>
  <Textarea label="Reason" optional value={reason} onChange={…} />   {/* replaces window.prompt */}
</ConfirmDialog>

<Drawer open={!!selected} onClose={() => setSelected(null)} title={`Order ${selected?.orderNumber}`} size="lg" footer={…}>…</Drawer>
```
- All three render in a portal and trap focus. Esc and a backdrop click close them, the page behind is scroll-locked, and focus returns to the trigger when they close. They set `aria-modal`.
- Modal sizes are sm, md, lg and xl. On phones a Modal becomes a bottom sheet and a Drawer is full-width.
- Put `data-autofocus` on the field that should receive focus first.
- `ConfirmDialog.onConfirm` can return a promise, and the confirm button spins until it settles.
- Replace every `window.confirm`, `window.prompt` and hand-rolled `fixed inset-0` overlay with these components.

### Tabs
```tsx
<Tabs id="beats" aria-label="Beat views" value={tab} onValueChange={setTab}
      items={[{ value: 'today', label: 'Today', count: 4 }, { value: 'all', label: 'All beats' }]} />
<TabPanel tabsId="beats" value="today" active={tab === 'today'}>…</TabPanel>
```
`variant="pills"` gives a compact segmented filter. Tabs support arrow-key navigation and scroll horizontally on phones.

### PageHeader / Toolbar / PageSection
`PageHeader` props: `title`, `description`, `breadcrumbs` [{label, href?}], `actions`, `back` {href, label?}, `titleAddon`.
Breadcrumbs and back links use react-router, through the `UIProvider` link adapter in `main.tsx`.
`Toolbar` puts search on the left and filters on the right, and stacks on phones. `PageSection` sets the vertical rhythm.

### EmptyState / Skeleton / Spinner / LoadingState
```tsx
<EmptyState icon={<Store />} title="No outlets yet" description="Add your first outlet to start planning beats."
            action={<Button leftIcon={<Plus />}>Add outlet</Button>} />
<Skeleton className="h-4 w-32" />  <SkeletonText lines={3} />
<LoadingRegion label="Loading outlets"><Skeleton className="h-40" /></LoadingRegion>
<Spinner size="sm" />   <LoadingState label="Loading map…" />
```

### Toasts (these replace `alert()`)
```tsx
const toast = useToast();
toast.success('Order approved');
toast.error(getErrorMessage(err) ?? "Couldn't approve the order. Try again.");
toast.info({ title: 'Report is being generated', description: "We'll notify you when it's ready." });
```
The provider is already mounted in `main.tsx`, so `useToast()` works on every page, including public ones.

### Alert (inline, persistent)
```tsx
<Alert tone="danger" title="Couldn't approve order" onDismiss={() => setActionError('')}>{actionError}</Alert>
<Alert tone="warning">KYC documents pending. Orders above ₹50,000 need approval.</Alert>
```

### Avatar, Tooltip, DropdownMenu, Pagination
```tsx
<Avatar name="Rahul Sharma" src={photoUrl} size="sm" status="online" />
<Tooltip content="Last synced 5 min ago"><IconButton aria-label="Sync status" icon={<RefreshCw />} /></Tooltip>
<DropdownMenu
  trigger={(p) => <IconButton {...p} aria-label="Order actions" icon={<MoreHorizontal />} />}
  items={[{ label: 'View', icon: <Eye />, onSelect: view },
          { label: 'Download invoice', icon: <Download />, onSelect: download },
          { type: 'separator' },
          { label: 'Cancel order', icon: <X />, danger: true, onSelect: () => setCancelId(id) }]} />
<Pagination page={page} pageSize={20} totalItems={total} onPageChange={setPage} />  // for server-side paging
```
Tooltips only show on hover and focus. Never put essential information in them.

### Formatting helpers
```ts
formatINR(123456.5)                  // "₹1,23,456.50"
formatINR(2500)                      // "₹2,500"
formatINR(4520000, { compact: true }) // "₹45.2L"   (K, L, Cr)
formatNumber(1234567)                // "12,34,567"
formatPercent(12.345)                // "12.3%"
formatDate(order.createdAt)          // "22 Sept 2026"
formatDate(d, 'short')               // "22/09/2026"
formatDateTime(d)                    // "22 Sept 2026, 3:45 pm"
formatRelativeTime(d)                // "5 min ago"
getInitials('Rahul Kumar Sharma')    // "RS"
cn('px-4', cond && 'bg-primary-50')  // clsx + tailwind-merge
```
Never use `toLocaleString()` without a locale, `toFixed()` for money, or a hand-typed `₹${x}`.
Missing values render as "—".

---

## 5. Loading, empty and error states

| State | Pattern |
|---|---|
| First load of a list | `DataTable loading` (skeleton rows). Don't use a full-page spinner. |
| First load of KPIs | `StatCard loading` |
| Layout of a known shape loading | `Skeleton` blocks inside `LoadingRegion` |
| Unknown shape / map / chart | `LoadingState` |
| Button action in progress | `Button loading` (disables it, keeps the label, e.g. "Saving…") |
| Fetch failed | the existing `ErrorState` with `onRetry` (from `components/common/ErrorState`). Pass it to `DataTable error=` or render it in place of the section. |
| Action failed | `toast.error(message)`, or an `Alert tone="danger"` when the user must read or act on it |
| Nothing yet | `EmptyState`: say what's missing and give the next step (with an action button if the role can create one) |
| Search returned nothing | DataTable shows "No matches" automatically |

Background refreshes and polling must **not** blank the screen. Keep showing the old data
and show a spinner only on the first load.

---

## 6. Status colours

`StatusPill` maps statuses (case-insensitive, and `_`/`-` count as spaces) to one colour language:

| Tone | Meaning | Statuses |
|---|---|---|
| success (green) | done, or money received | Delivered, Paid, Cleared, Verified, Completed, Achieved, Active, Resolved, Received, On Track |
| warning (amber) | waiting on someone | Submitted, Pending, Pending Approval, Pending Verification, Hold Credit, Hold Stock, Partial, Partial Delivery, Short Delivery, At Risk, Trial, Invited, Queued, Processing, In Progress, Open, Unpaid, Return Initiated |
| info (sky) | approved or scheduled, moving forward | Approved, Sent, Scheduled |
| progress (violet) | physically on the way | Dispatched, In Transit, Out for Delivery |
| danger (red) | failed, stopped or overdue | Rejected, Cancelled, Bounced, Failed, Overdue, Past Due, Suspended, Refused, Damaged Delivery, Missed, Reversed, Expired |
| neutral (slate) | not started or archived | Draft, Inactive, Archived, Closed, anything unknown |

If a status is missing, add it to `STATUS_TONES` in `packages/ui/src/components/badge.tsx`.
Don't override the tone in a page.

---

## 7. Forms

1. Label every field, and put the label above the field. Mark required fields with `required` (red asterisk) and
   rarely-filled ones with `optional`.
2. **Validate inline.** Validate on blur and on submit, show the message under the field
   (`error="Enter a 10-digit mobile number"`) and focus the first invalid field.
   Don't only disable the submit button without saying why.
3. **While saving:** `<Button type="submit" loading={saving}>`, set `dismissible={!saving}` on the Modal or Drawer,
   and don't clear the form until the request succeeds.
4. **On success:** close the dialog, call `toast.success('Outlet added')` and refresh the list.
5. **On failure:** keep the user's input, and show `toast.error(getErrorMessage(err))` or an `Alert` at the top of the form.
6. Use the right keyboard on phones: `inputMode="numeric"` for quantities and PIN codes, `"decimal"` for ₹ amounts,
   `type="tel"` for mobile numbers, and `type="email"` for email addresses.
7. Use one column on phones and `grid sm:grid-cols-2 gap-3` on larger screens (12px between fields; `space-y-3` for stacked forms). Buttons go in the footer, with the primary on the right
   (on phones the buttons stack full-width with the primary on top).

---

## 8. Copy and tone

- **Short, plain Indian English.** Write "Add outlet", not "Click here to add a new outlet".
- **Buttons are verbs plus an object:** "Approve order", "Record payment", "Download invoice". Avoid "OK", "Yes" and "Submit".
- **Sentence case** everywhere ("Pending approvals", not "Pending Approvals"). Status pills are the
  exception, because they mirror API values.
- **Errors say what happened and what to do next:** "Couldn't load orders. Check your connection and try again."
  Don't show raw exceptions or "Error 500".
- **Confirmations name the consequence:** "Cancel this order? The outlet will be notified."
- **Empty states guide the user:** "No beats planned for today. Plan a beat to assign outlets to your reps."
- Use terms users know: outlet, beat, distributor, DSR, scheme, GST, GSTIN, FEFO, lakh and crore.
- Money is always `formatINR`: `₹1,23,456`, and compact `₹4.5L` or `₹3.2Cr` in KPIs. Dates look like `22 Sept 2026`, and times like `3:45 pm`.

---

## 9. Responsive rules

- **Design for 360px first**, then check at 768px (the sidebar becomes a rail or expands) and at 1280px or wider.
- Below `md` the sidebar is an off-canvas drawer opened from the header menu button. From `md` up it
  is fixed and can collapse to an icon rail (the preference is remembered per browser).
- The body must never scroll horizontally. Wide tables scroll inside their card, or use
  `mobileLayout="cards"`. Use `hideBelow` for low-priority columns.
- Touch targets are at least 44px on phones. The components handle this, so don't shrink them with `h-8` on mobile.
- PageHeader actions wrap under the title on phones. Keep at most 2 visible actions and move the rest into a
  `DropdownMenu`.
- Grids: KPIs use `StatGrid` (2 columns on phones, growing to `columns` from lg; `gap-3`). Content uses `grid gap-4 lg:grid-cols-3` with `lg:col-span-2` for the main column.
- Modals become bottom sheets on phones, and Drawers go full-width.
- Respect `prefers-reduced-motion` (handled globally). Keep animations under 250ms.

---

## 10. Page checklist

- [ ] PageHeader with a sentence-case title, a one-line description and at most one primary action (saffron `accent` only for the one main CTA)
- [ ] Compact spacing (§1a): no `p-6`/`p-8` cards, no `gap-6`/`space-y-6`+ between sections, no hard-coded old blue/orange hex
- [ ] No outer padding or max-width wrapper (the layout provides it)
- [ ] Lists use `DataTable` with loading, error (`ErrorState` + retry) and empty states
- [ ] Statuses use `StatusPill`, money uses `formatINR`, dates use `formatDate`
- [ ] No `alert()`, `window.confirm()`, `window.prompt()` or custom `fixed inset-0` overlays
- [ ] No `as any` icon casts (lucide icons type-check fine now)
- [ ] Icon-only buttons have an `aria-label` (use `IconButton`)
- [ ] Works at 360px with no horizontal page scroll
- [ ] Business logic, API calls, routes and role checks are unchanged

---

## Added after the page redesign pass

### ProgressBar
```tsx
<ProgressBar value={pct} label="Target achievement for Ravi" tone={toneForPercent(pct)} />       // ≥75 green, ≥50 amber, else red
<ProgressBar value={fill} label="Fill rate" tone="success" size="xs" showValue />                  // % text on the right
<ProgressBar value={used} max={limit} decorative size="xs" />                                       // numbers already shown as text
```
Use it for every target / achievement / fill-rate bar. Don't hand-build `role="progressbar"` divs.

### CheckList
```tsx
<CheckList label="Territories" items={[{ id, label }]} selected={ids} onToggle={(id, checked) => …} emptyText="No territories yet." />
```
A scrollable, filterable multi-select with a "N selected" count, for Drawer forms.

### Chart colours
Recharts and Leaflet need raw colours, so import `CHART_THEME`, `CHART_AXIS_TICK` and `CHART_TOOLTIP_STYLE` from `@bharatsales/ui`. Never hard-code hex in a page.

| Key | Value | Use |
|---|---|---|
| `CHART_THEME.series` | `#1B4FD8` | series 1 / single-series charts |
| `CHART_THEME.seriesAccent` | `#FF8A1F` | series 2 (e.g. target vs achieved) |
| `CHART_THEME.categorical` | `#1B4FD8, #FF8A1F, #0B1F44, #5B8DEF, #FFC285` | pie/stacked series in order |
| `CHART_THEME.navy` | `#0B1F44` | series 3 |
| `grid` / `axis` / `cursor` | `#E3E8F2` / `#667085` / `#EEF2F8` | chart chrome |

Keep chart cards compact: `CardHeader` + `CardBody` with a chart height of ~240–280px, not 400px.

### Field-rep statuses
`At Outlet` (success), `Traveling` (primary) and `On Break` (warning) are now in `STATUS_TONES`, so use `<StatusPill status={rep.status} />`.
