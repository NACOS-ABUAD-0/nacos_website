// frontend/src/components/BackCameraScanner.tsx
//
// One-shot QR scanner for the event gate: opens the back camera straight away (no camera picker,
// no extra permission link), reads a single QR code, stops the camera and hands the code back.
// Mount it again to scan the next ticket.
import { useEffect, useId, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

interface BackCameraScannerProps {
  onScan: (decodedText: string) => void;
  onCancel: () => void;
}

export default function BackCameraScanner({ onScan, onCancel }: BackCameraScannerProps) {
  const regionId = `gate-scanner-${useId().replace(/:/g, "")}`;
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    const scanner = new Html5Qrcode(regionId, {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      verbose: false,
    });
    let handled = false;
    let cancelled = false;

    const stop = async () => {
      if (scanner.isScanning) await scanner.stop().catch(() => {});
      try { scanner.clear(); } catch { /* already cleared */ }
    };

    setError(null);
    setStarting(true);
    scanner
      .start(
        { facingMode: "environment" },
        {
          fps: 10,
          // Square box that fits narrow phone screens.
          qrbox: (width: number, height: number) => {
            const size = Math.floor(Math.min(width, height) * 0.7);
            return { width: size, height: size };
          },
        },
        (decodedText) => {
          if (handled) return;
          handled = true;
          stop().then(() => onScanRef.current(decodedText));
        },
        () => { /* no QR in this frame — keep looking */ }
      )
      .then(() => {
        if (cancelled) stop();
        else setStarting(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStarting(false);
        const message = String((err as Error)?.message ?? err);
        setError(
          /permission|notallowed/i.test(message)
            ? "Camera access was blocked. Allow camera access for this site in your browser settings, then try again."
            : /notfound|no camera|devices/i.test(message)
            ? "No camera was found on this device."
            : "The camera couldn't start. Close other apps using the camera and try again."
        );
      });

    return () => {
      cancelled = true;
      stop();
    };
  }, [regionId, attempt]);

  return (
    <div className="w-full">
      <div className="relative w-full max-w-md mx-auto overflow-hidden rounded-2xl bg-black aspect-square">
        <div id={regionId} className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover" />
        {starting && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/90 text-sm">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Starting camera…
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center text-white">
            <p className="text-sm">{error}</p>
            <button
              type="button"
              onClick={() => setAttempt((n) => n + 1)}
              className="bg-white text-gray-900 font-semibold text-sm px-5 py-2.5 rounded-xl"
            >
              Try again
            </button>
          </div>
        )}
      </div>
      {!error && !starting && (
        <p className="text-center text-sm text-gray-500 mt-3">Point the camera at the ticket's QR code</p>
      )}
      <div className="flex justify-center mt-3">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm font-semibold text-gray-600 px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
