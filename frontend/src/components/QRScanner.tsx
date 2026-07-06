// frontend/src/components/QRScanner.tsx
import { useEffect, useId } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
}

export default function QRScanner({ onScanSuccess, onScanError }: QRScannerProps) {
  const regionId = `qr-reader-${useId()}`;

  useEffect(() => {
    // Function form so the scan box shrinks to fit narrow phone screens
    // instead of a fixed 250px box that can exceed the available width.
    const qrbox = (viewfinderWidth: number, viewfinderHeight: number) => {
      const size = Math.min(viewfinderWidth, viewfinderHeight, 250) * 0.8;
      return { width: size, height: size };
    };
    const scanner = new Html5QrcodeScanner(regionId, { fps: 10, qrbox }, false);
    scanner.render(onScanSuccess, onScanError);

    return () => {
      scanner.clear().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div id={regionId} />;
}
