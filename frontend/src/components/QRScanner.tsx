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
    const scanner = new Html5QrcodeScanner(regionId, { fps: 10, qrbox: 250 }, false);
    scanner.render(onScanSuccess, onScanError);

    return () => {
      scanner.clear().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div id={regionId} />;
}
