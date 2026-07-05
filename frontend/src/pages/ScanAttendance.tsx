// frontend/src/pages/ScanAttendance.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import QRScanner from '../components/QRScanner';
import { useScanAttendance } from '../lib/hooks/useClassAttendance';

type ResultState =
  | { kind: 'recorded'; courseCode: string }
  | { kind: 'closed' }
  | { kind: 'invalid' }
  | null;

export default function ScanAttendance() {
  const [result, setResult] = useState<ResultState>(null);
  const scanMutation = useScanAttendance();

  const handleScanSuccess = (token: string) => {
    if (scanMutation.isPending) return;
    scanMutation.mutate(token, {
      onSuccess: (data) => setResult({ kind: 'recorded', courseCode: data.course_code }),
      onError: (err: any) => {
        const status = err?.response?.status;
        setResult(status === 400 ? { kind: 'closed' } : { kind: 'invalid' });
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F7FA] px-4 py-12">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1 text-center">Class Attendance</h1>
        <p className="text-sm text-gray-500 mb-6 text-center">
          Scan the QR code your lecturer is displaying.
        </p>

        {!result ? (
          <QRScanner onScanSuccess={handleScanSuccess} />
        ) : result.kind === 'recorded' ? (
          <div className="flex flex-col items-center text-center py-6">
            <CheckCircle className="w-14 h-14 text-green-600 mb-3" />
            <p className="font-semibold text-gray-900">Marked present for {result.courseCode}</p>
          </div>
        ) : result.kind === 'closed' ? (
          <div className="flex flex-col items-center text-center py-6">
            <AlertCircle className="w-14 h-14 text-amber-500 mb-3" />
            <p className="font-semibold text-gray-900">This session has been closed.</p>
            <p className="text-sm text-gray-500 mt-1">Ask your lecturer for a new QR code.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center py-6">
            <XCircle className="w-14 h-14 text-red-500 mb-3" />
            <p className="font-semibold text-gray-900">Invalid QR code.</p>
          </div>
        )}

        {result && (
          <button
            onClick={() => setResult(null)}
            className="mt-4 w-full text-sm text-[#006E3A] font-semibold hover:underline"
          >
            Scan another code
          </button>
        )}

        <Link to="/dashboard" className="block mt-6 text-center text-sm text-gray-500 hover:underline">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
