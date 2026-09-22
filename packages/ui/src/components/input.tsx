import * as React from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { cn } from '../utils/cn';

/* ------------------------------------------------------------------------ */
/* Label + FormField                                                         */
/* ------------------------------------------------------------------------ */

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  /** Renders "(optional)" after the label. */
  optional?: boolean;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(({ className, required, optional, children, ...props }, ref) => (
  <label ref={ref} className={cn('block text-sm font-medium text-gray-800', className)} {...props}>
    {children}
    {required && (
      <span className="ml-0.5 text-danger-600" aria-hidden="true">
        *
      </span>
    )}
    {optional && <span className="ml-1 font-normal text-foreground-subtle">(optional)</span>}
  </label>
));
Label.displayName = 'Label';

export interface FieldA11yProps {
  id: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  'aria-required'?: boolean;
}

export interface FormFieldProps {
  label?: React.ReactNode;
  /** id of the control; auto-generated if omitted. */
  htmlFor?: string;
  helperText?: React.ReactNode;
  /** Error message. When set, replaces helper text and marks the control invalid. */
  error?: React.ReactNode;
  required?: boolean;
  optional?: boolean;
  className?: string;
  /** Hide the label visually (still read by screen readers). */
  hideLabel?: boolean;
  /** A control element, or a render function that receives the a11y props to spread onto it. */
  children: React.ReactNode | ((field: FieldA11yProps) => React.ReactNode);
}

/**
 * Label + control + helper/error text with the ids wired together.
 * Input/Textarea/Select already use this when you pass `label`; use it
 * directly for custom controls.
 */
export function FormField({ label, htmlFor, helperText, error, required, optional, className, hideLabel, children }: FormFieldProps) {
  const autoId = React.useId();
  const id = htmlFor ?? `field-${autoId}`;
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const describedBy = error ? errorId : helperText ? helpId : undefined;
  const a11y: FieldA11yProps = {
    id,
    'aria-describedby': describedBy,
    'aria-invalid': error ? true : undefined,
    'aria-required': required || undefined,
  };

  return (
    <div className={cn('w-full space-y-1', className)}>
      {label && (
        <Label htmlFor={id} required={required} optional={optional} className={hideLabel ? 'sr-only' : undefined}>
          {label}
        </Label>
      )}
      {typeof children === 'function' ? children(a11y) : children}
      {error ? (
        <p id={errorId} className="text-xs font-medium text-danger-700" role="alert">
          {error}
        </p>
      ) : helperText ? (
        <p id={helpId} className="text-xs text-foreground-subtle">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Shared control styles                                                     */
/* ------------------------------------------------------------------------ */

export const controlBase =
  'block w-full rounded-lg border border-border-strong bg-white text-sm text-gray-900 shadow-xs transition-colors ' +
  'placeholder:text-gray-400 hover:border-gray-400 ' +
  'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 ' +
  'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 disabled:hover:border-border-strong ' +
  'aria-[invalid=true]:border-danger-500 aria-[invalid=true]:focus:ring-danger-500/30';

const CONTROL_SIZES = {
  sm: 'h-10 sm:h-8 px-2.5 text-sm',
  md: 'h-11 sm:h-9 px-3',
};

interface FieldProps {
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  error?: React.ReactNode;
  optional?: boolean;
  hideLabel?: boolean;
  /** Class for the outer wrapper (className goes on the control). */
  containerClassName?: string;
}

/* ------------------------------------------------------------------------ */
/* Input                                                                     */
/* ------------------------------------------------------------------------ */

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>, FieldProps {
  size?: 'sm' | 'md';
  /** Icon inside the left edge (decorative). */
  leftIcon?: React.ReactNode;
  /** Element inside the right edge (e.g. unit "kg", a clear button). */
  rightElement?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, containerClassName, type = 'text', label, helperText, error, optional, hideLabel, id, required, size = 'md', leftIcon, rightElement, ...props }, ref) => {
    const control = (a11y: Partial<FieldA11yProps>) => (
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center text-gray-400 [&_svg]:h-4 [&_svg]:w-4">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          type={type}
          required={required}
          className={cn(controlBase, CONTROL_SIZES[size], leftIcon && 'pl-10', rightElement && 'pr-10', className)}
          {...a11y}
          {...props}
          id={a11y.id ?? id}
        />
        {rightElement && <span className="absolute inset-y-0 right-0 flex items-center pr-2 text-sm text-gray-500">{rightElement}</span>}
      </div>
    );
    if (!label && !helperText && !error) return control({ id });
    return (
      <FormField label={label} htmlFor={id} helperText={helperText} error={error} required={required} optional={optional} hideLabel={hideLabel} className={containerClassName}>
        {(a11y) => control(a11y)}
      </FormField>
    );
  },
);
Input.displayName = 'Input';

/* ------------------------------------------------------------------------ */
/* SearchInput                                                               */
/* ------------------------------------------------------------------------ */

export interface SearchInputProps extends Omit<InputProps, 'type' | 'leftIcon' | 'rightElement' | 'onChange' | 'value'> {
  value: string;
  onValueChange: (value: string) => void;
}

/** Search box with icon and a clear (×) button. Label defaults to a visually hidden "Search". */
export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ value, onValueChange, placeholder = 'Search…', label = 'Search', hideLabel = true, containerClassName, ...props }, ref) => (
    <Input
      ref={ref}
      type="search"
      inputMode="search"
      autoComplete="off"
      label={label}
      hideLabel={hideLabel}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      leftIcon={<Search />}
      containerClassName={cn('space-y-0', containerClassName)}
      className="[&::-webkit-search-cancel-button]:hidden"
      rightElement={
        value ? (
          <button
            type="button"
            onClick={() => onValueChange('')}
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        ) : undefined
      }
      {...props}
    />
  ),
);
SearchInput.displayName = 'SearchInput';

/* ------------------------------------------------------------------------ */
/* Textarea                                                                  */
/* ------------------------------------------------------------------------ */

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement>, FieldProps {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, containerClassName, label, helperText, error, optional, hideLabel, id, required, rows = 3, ...props }, ref) => {
    const control = (a11y: Partial<FieldA11yProps>) => (
      <textarea ref={ref} rows={rows} required={required} className={cn(controlBase, 'min-h-[4.5rem] px-3 py-2 leading-relaxed', className)} {...a11y} {...props} id={a11y.id ?? id} />
    );
    if (!label && !helperText && !error) return control({ id });
    return (
      <FormField label={label} htmlFor={id} helperText={helperText} error={error} required={required} optional={optional} hideLabel={hideLabel} className={containerClassName}>
        {(a11y) => control(a11y)}
      </FormField>
    );
  },
);
Textarea.displayName = 'Textarea';

/* ------------------------------------------------------------------------ */
/* Select (native — best on mobile and slow devices)                         */
/* ------------------------------------------------------------------------ */

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'>, FieldProps {
  size?: 'sm' | 'md';
  options?: SelectOption[];
  /** Adds a first empty option (value ""). */
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, containerClassName, label, helperText, error, optional, hideLabel, id, required, size = 'md', options, placeholder, children, ...props }, ref) => {
    const control = (a11y: Partial<FieldA11yProps>) => (
      <div className="relative">
        <select
          ref={ref}
          required={required}
          className={cn(controlBase, CONTROL_SIZES[size], 'appearance-none pr-9 sm:min-w-[10rem]', className)}
          {...a11y}
          {...props}
          id={a11y.id ?? id}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options?.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
      </div>
    );
    if (!label && !helperText && !error) return control({ id });
    return (
      <FormField label={label} htmlFor={id} helperText={helperText} error={error} required={required} optional={optional} hideLabel={hideLabel} className={containerClassName}>
        {(a11y) => control(a11y)}
      </FormField>
    );
  },
);
Select.displayName = 'Select';

/* ------------------------------------------------------------------------ */
/* Checkbox                                                                  */
/* ------------------------------------------------------------------------ */

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  containerClassName?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, containerClassName, label, description, error, id, ...props }, ref) => {
    const autoId = React.useId();
    const inputId = id ?? `cb-${autoId}`;
    const descId = description ? `${inputId}-desc` : undefined;
    const errId = error ? `${inputId}-err` : undefined;
    return (
      <div className={cn('flex items-start gap-3 py-1', containerClassName)}>
        <span className="flex h-5 shrink-0 items-center">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            aria-describedby={cn(descId, errId) || undefined}
            aria-invalid={error ? true : undefined}
            className={cn(
              'h-4 w-4 cursor-pointer rounded border-border-strong text-primary-600 accent-primary-600',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              className,
            )}
            {...props}
          />
        </span>
        {(label || description || error) && (
          <div className="min-w-0 text-sm">
            {label && (
              <label htmlFor={inputId} className="cursor-pointer font-medium text-gray-800">
                {label}
              </label>
            )}
            {description && (
              <p id={descId} className="text-foreground-subtle">
                {description}
              </p>
            )}
            {error && (
              <p id={errId} className="text-xs font-medium text-danger-700" role="alert">
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    );
  },
);
Checkbox.displayName = 'Checkbox';

/* ------------------------------------------------------------------------ */
/* Switch                                                                    */
/* ------------------------------------------------------------------------ */

export interface SwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: React.ReactNode;
  description?: React.ReactNode;
  size?: 'sm' | 'md';
  containerClassName?: string;
}

/** On/off toggle for settings that apply immediately. Use Checkbox inside forms that are submitted. */
export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onCheckedChange, label, description, size = 'md', className, containerClassName, id, disabled, ...props }, ref) => {
    const autoId = React.useId();
    const switchId = id ?? `sw-${autoId}`;
    const labelId = label ? `${switchId}-label` : undefined;
    const descId = description ? `${switchId}-desc` : undefined;
    const track = size === 'sm' ? 'h-5 w-9' : 'h-6 w-11';
    const thumb = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
    const shift = size === 'sm' ? 'translate-x-4' : 'translate-x-5';
    const button = (
      <button
        ref={ref}
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={descId}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          'relative inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          // enlarge the hit area on touch screens without changing the visual
          "before:absolute before:-inset-x-1 before:-inset-y-2.5 before:content-[''] sm:before:hidden",
          checked ? 'bg-primary-600' : 'bg-gray-300',
          track,
          className,
        )}
        {...props}
      >
        <span className={cn('pointer-events-none inline-block rounded-full bg-white shadow-xs ring-0 transition-transform', thumb, checked ? shift : 'translate-x-0')} />
      </button>
    );
    if (!label && !description) return button;
    return (
      <div className={cn('flex items-start justify-between gap-4', containerClassName)}>
        <div className="min-w-0 text-sm">
          {label && (
            <label id={labelId} htmlFor={switchId} className="font-medium text-gray-800">
              {label}
            </label>
          )}
          {description && (
            <p id={descId} className="text-foreground-subtle">
              {description}
            </p>
          )}
        </div>
        {button}
      </div>
    );
  },
);
Switch.displayName = 'Switch';

export { Input };
