interface Props {
  onTrigger: () => void;
}

/**
 * The 10x10-pixel invisible button in the top-right corner.
 *
 * Demo-safety hatch — if a judge says "run that again", click here and the
 * orchestrator resets its mock-data store, then replays the canned Karp
 * scenario. No need to perfectly speak the script twice.
 */
export function KarpSecretButton({ onTrigger }: Props) {
  return (
    <button
      type="button"
      onClick={onTrigger}
      aria-label="replay canned demo (hidden)"
      title="Replay Karp scenario"
      className="fixed right-0 top-0 z-50 size-3 cursor-default opacity-0"
    />
  );
}
