export function bindModalEscapeKey(onClose: () => void): () => void {
  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      onClose();
    }
  }

  document.addEventListener("keydown", onKeyDown);
  return () => document.removeEventListener("keydown", onKeyDown);
}

export function lockBodyScroll(): () => void {
  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  return () => {
    document.body.style.overflow = previousOverflow;
  };
}

export function bindModalLifecycle(onClose: () => void): () => void {
  const unbindEscape = bindModalEscapeKey(onClose);
  const unlockScroll = lockBodyScroll();

  return () => {
    unbindEscape();
    unlockScroll();
  };
}
