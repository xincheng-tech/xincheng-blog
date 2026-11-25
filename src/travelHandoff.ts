export const handoffKey = "xingchen:travel";

export function rememberArrival(path: string) {
  try {
    sessionStorage.setItem(handoffKey, JSON.stringify({ path, expires: Date.now() + 8000 }));
  } catch {
    // Navigation still works when storage is unavailable.
  }
}

export function revealArrival() {
  delete document.documentElement.dataset.travelArrival;
}
