interface Props {
  onKarp: () => void;
  onRecovery: () => void;
  onProactive: () => void;
}

/**
 * Three invisible 12×12 hatches, top-right corner.
 *
 *   - Outer (top-right corner, 0px):          replays the canned Karp scenario.
 *   - Middle (16px to the left):              replays the "recovery" scenario —
 *     same transcript, but Madera 503's so Claude must autonomously re-plan
 *     to Mayfield Bakery. The Sequoia/Greycroft "Systems of Action" demo.
 *   - Inner (32px to the left):               fires the "proactive" scenario —
 *     Maestro wakes up unprompted because the PMS clock says the Karps are
 *     30 minutes out and Suite 12 is still dirty. Greycroft "Autopilot, not
 *     Copilot" thesis dramatised.
 *
 * Judges never see these. They're entirely for the operator standing on stage
 * with three precise pixel targets memorised. tabIndex/aria-hidden keep them
 * out of the keyboard focus order so a curious judge can't tab into the demo
 * controls by accident.
 */
export function KarpSecretButton({ onKarp, onRecovery, onProactive }: Props) {
  return (
    <>
      <button
        type="button"
        onClick={onKarp}
        tabIndex={-1}
        aria-hidden
        title="(hidden) replay Karp scenario"
        className="fixed right-0 top-0 z-50 size-3 cursor-default opacity-0"
      />
      <button
        type="button"
        onClick={onRecovery}
        tabIndex={-1}
        aria-hidden
        title="(hidden) replay recovery scenario (Madera 503 → Mayfield)"
        className="fixed right-4 top-0 z-50 size-3 cursor-default opacity-0"
      />
      <button
        type="button"
        onClick={onProactive}
        tabIndex={-1}
        aria-hidden
        title="(hidden) fire proactive scenario (PMS clock advance)"
        className="fixed right-8 top-0 z-50 size-3 cursor-default opacity-0"
      />
    </>
  );
}
