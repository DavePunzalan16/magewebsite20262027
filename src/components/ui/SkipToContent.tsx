export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-[8px] focus:bg-primary focus:px-4 focus:py-2 focus:font-body focus:text-[14px] focus:font-bold focus:text-black"
    >
      Skip to main content
    </a>
  );
}
