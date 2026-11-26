export const handoffKey = "xingchen:travel";

export type TravelMode = "planet" | "home";

const DEPART_DURATION_MS = 380;

export function rememberArrival(path: string, mode: TravelMode = "planet") {
  try {
    sessionStorage.setItem(
      handoffKey,
      JSON.stringify({ path, mode, expires: Date.now() + 8000 }),
    );
  } catch {
    // Navigation still works when storage is unavailable.
  }
}

export function revealArrival() {
  delete document.documentElement.dataset.travelArrival;
  delete document.documentElement.dataset.travelDepart;
  delete document.documentElement.dataset.travelMode;
}

let departing = false;

const normalizePath = (p: string) => p.replace(/\/+$/, "") || "/";

export function navigateWithWarp(targetPath: string, mode: TravelMode = "home") {
  if (typeof window === "undefined") return;
  if (normalizePath(window.location.pathname) === normalizePath(targetPath)) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.location.assign(targetPath);
    return;
  }

  if (departing) return;
  departing = true;

  // Prefetch target document
  const hint = document.createElement("link");
  hint.rel = "prefetch";
  hint.href = targetPath;
  document.head.append(hint);

  document.documentElement.dataset.travelMode = mode;
  document.documentElement.dataset.travelDepart = "";
  window.dispatchEvent(new CustomEvent("xingchen:depart", { detail: { targetPath, mode } }));

  window.setTimeout(() => {
    rememberArrival(targetPath, mode);
    window.location.assign(targetPath);
  }, DEPART_DURATION_MS);
}
