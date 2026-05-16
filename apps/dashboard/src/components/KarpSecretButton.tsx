interface Props {
  onKarp: () => void;
  onRecovery: () => void;
}

/**
 * Two invisible 12×12 hatches, top-right corner.
 *
 *   - Outer (top-right corner, 0,0):        replays the canned Karp scenario.
 *   - Inner (just left of it, 16px in):    replays the "recovery" scenario —
 *     same transcript, but Madera 503's so Claude must autonomously re-plan
 *     to Mayfield Bakery. The Sequoia/Greycroft "Systems of Action" demo.
 *
 * Judges never see these. They're entirely for the operator standing on stage
 * with three precise pixel targets memorised.
 */
export function KarpSecretButton({ onKarp, onRecovery }: Props) {
  return (
    <>
      <button
        type="button"
        onClick={onKarp}
        aria-label="replay canned demo (hidden)"
        title="Replay Karp scenario"
        className="fixed right-0 top-0 z-50 size-3 cursor-default opacity-0"
      />
      <button
        type="button"
        onClick={onRecovery}
        aria-label="replay recovery demo (hidden)"
        title="Replay recovery scenario (Madera 503 → Mayfield)"
        className="fixed right-4 top-0 z-50 size-3 cursor-default opacity-0"
      />
    </>
  );
}
