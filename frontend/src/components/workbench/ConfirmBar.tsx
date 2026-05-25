export function ConfirmBar({
  checked,
  onCheck,
  label,
}: {
  checked: boolean;
  onCheck: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 rounded border-slate-300 text-bridge-700"
        checked={checked}
        onChange={(e) => onCheck(e.target.checked)}
      />
      <span className="text-sm leading-6 text-slate-800">{label}</span>
    </label>
  );
}
