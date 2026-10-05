export function Disclaimer({ text }: { text?: string }) {
  return (
    <p className="disclaimer">
      {text ??
        "Illustrative demonstration data. Synthetic callers, contacts, and decisions are used for this concept demo and are not connected to real Rogers systems."}
    </p>
  );
}
