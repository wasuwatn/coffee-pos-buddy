import { domToBlob } from "modern-screenshot";

// Capture a DOM node as a PNG and hand it to the user (native share sheet on
// phones, plain download elsewhere). Shared by the receipt and history-detail
// bills. The caller owns UI concerns (loading state, success/error toasts);
// this throws so the caller can react — including a DOMException `AbortError`
// when the user dismisses the share sheet, which is not a real failure.
// Returns which path was taken so the caller can, e.g., only toast "saved" on
// the download fallback (the share sheet gives its own feedback).
export async function saveNodeAsImage(
  node: HTMLElement,
  filename: string,
): Promise<"shared" | "downloaded"> {
  // Capture a hidden clone pinned to a generous fixed width instead of the
  // live node. modern-screenshot can't read the Google Fonts stylesheet's
  // CSSOM (it's cross-origin without a matching `crossorigin` attribute),
  // so its custom @font-face embedding silently fails and the capture
  // falls back to a wider generic font — on a narrow phone viewport that's
  // enough to wrap labels that fit on one line on screen. Extra width
  // removes the ambiguity regardless of which font actually gets embedded.
  // The clone must stay clipped via a zero-size `overflow: hidden` wrapper,
  // not shoved off-screen with a huge negative offset — the latter makes
  // modern-screenshot render an empty canvas.
  const clone = node.cloneNode(true) as HTMLElement;
  clone.style.width = "400px";
  const captureHost = document.createElement("div");
  captureHost.style.position = "absolute";
  captureHost.style.top = "0";
  captureHost.style.left = "0";
  captureHost.style.width = "0";
  captureHost.style.height = "0";
  captureHost.style.overflow = "hidden";
  captureHost.appendChild(clone);
  document.body.appendChild(captureHost);
  try {
    const blob = await domToBlob(clone, { scale: 2, backgroundColor: "#ffffff" });
    const file = new File([blob], filename, { type: "image/png" });

    // Prefer the native share sheet on phones — it offers "Save Image" to
    // Photos as well as sending to chat apps. Fall back to a plain download.
    if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: filename });
      return "shared";
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return "downloaded";
  } finally {
    captureHost.remove();
  }
}
