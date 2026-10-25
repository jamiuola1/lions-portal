export function Field({ id, label, type = "text", autoComplete, hint }: { id: string; label: string; type?: string; autoComplete?: string; hint?: string }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold">{label}</label>
      <input id={id} name={id} type={type} required autoComplete={autoComplete} aria-describedby={hint ? `${id}-hint` : undefined}
        className="mt-1 w-full rounded border border-lions-line px-3 py-3 text-base" />
      {hint && <p id={`${id}-hint`} className="mt-1 text-xs">{hint}</p>}
    </div>
  );
}
export const Notice = ({ error }: { error?: string }) =>
  error ? <p role="alert" className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">{error}</p> : null;
export const NotConfigured = () => (
  <p className="rounded border border-lions-line bg-lions-mist p-4 text-sm">Accounts are not connected yet. Add the Supabase keys from .env.example to turn on sign-in.</p>
);
