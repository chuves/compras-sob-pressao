import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface LocationState {
  flashMessage?: string;
}

/**
 * Shows a one-off success message passed via router navigation state
 * (`navigate(path, { state: { flashMessage: "..." } })`), then auto-hides
 * it and scrubs the state so it doesn't reappear on refresh/back-navigation.
 */
export function FlashMessage() {
  const location = useLocation();
  const navigate = useNavigate();
  // Captured once, at mount: the state gets scrubbed right after, so this
  // instance's own copy is what drives the timer below (not a live read).
  const [initialMessage] = useState(
    () => (location.state as LocationState | null)?.flashMessage ?? null,
  );
  const [message, setMessage] = useState(initialMessage);

  useEffect(() => {
    if (!initialMessage) return;
    navigate(location.pathname, { replace: true, state: {} });
    const timer = setTimeout(() => setMessage(null), 3000);
    return () => clearTimeout(timer);
    // Runs once for whichever message this instance mounted with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!message) return null;

  return (
    <div
      role="status"
      className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
    >
      <span aria-hidden="true">✓</span>
      {message}
    </div>
  );
}
