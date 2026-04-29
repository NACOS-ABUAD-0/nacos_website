// /frontend/src/components/FaceCapture.tsx

/**
 * FaceCapture — reusable camera capture component.
 *
 * Props:
 *   onCapture(dataUrls)  — called with array of base64 data URLs
 *   captureCount         — how many frames to capture (default 1)
 *   instruction          — custom instruction text shown above the camera
 *   onCancel             — called when user clicks Cancel
 */

import React, { useCallback, useEffect, useRef, useState } from "react";

interface FaceCaptureProps {
  onCapture: (dataUrls: string[]) => void;
  captureCount?: number;
  instruction?: string;
  onCancel: () => void;
}

type CameraState =
  | "idle"
  | "requesting"
  | "ready"
  | "countdown"
  | "capturing"
  | "done"
  | "error";

const COUNTDOWN_FROM = 3;
const INTER_FRAME_MS = 800; // gap between multi-frame captures

export const FaceCapture: React.FC<FaceCaptureProps> = ({
  onCapture,
  captureCount = 1,
  instruction = "Position your face in the frame, then click Capture.",
  onCancel,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [countdown, setCountdown] = useState(COUNTDOWN_FROM);
  const [capturedCount, setCapturedCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  // ── Start camera ───────────────────────────────────────────────────────────

  const startCamera = useCallback(async () => {
    setCameraState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraState("ready");
    } catch (err: unknown) {
      const msg =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Camera access denied. Please allow camera access and try again."
          : "Could not access camera. Please check your device settings.";
      setErrorMsg(msg);
      setCameraState("error");
    }
  }, []);

  // ── Stop camera ────────────────────────────────────────────────────────────

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // ── Capture frame from canvas ──────────────────────────────────────────────

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.92);
  }, []);

  // ── Countdown + multi-frame capture sequence ───────────────────────────────

  const startCapture = useCallback(() => {
    if (cameraState !== "ready") return;
    setCameraState("countdown");
    setCountdown(COUNTDOWN_FROM);

    let tick = COUNTDOWN_FROM;
    const timer = setInterval(() => {
      tick -= 1;
      setCountdown(tick);
      if (tick === 0) {
        clearInterval(timer);
        runCaptures();
      }
    }, 1000);
  }, [cameraState]); // eslint-disable-line react-hooks/exhaustive-deps

  const runCaptures = useCallback(async () => {
    setCameraState("capturing");
    const frames: string[] = [];

    for (let i = 0; i < captureCount; i++) {
      const frame = captureFrame();
      if (frame) {
        frames.push(frame);
        setCapturedCount(i + 1);
      }
      if (i < captureCount - 1) {
        await new Promise((r) => setTimeout(r, INTER_FRAME_MS));
      }
    }

    setCameraState("done");
    stopCamera();
    onCapture(frames);
  }, [captureCount, captureFrame, onCapture, stopCamera]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Instruction */}
      <div className="text-center">
        <p className="text-sm text-gray-600">{instruction}</p>
        {cameraState === "ready" && (
          <p className="text-xs text-amber-600 mt-1 font-medium">
            💡 Ensure good lighting and only your face is visible
          </p>
        )}
      </div>

      {/* Camera viewport */}
      <div className="relative rounded-2xl overflow-hidden bg-gray-900 shadow-lg"
           style={{ width: 320, height: 240 }}>

        {/* Video feed */}
        <video
          ref={videoRef}
          muted
          playsInline
          className="w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }} /* mirror for selfie UX */
        />

        {/* Face outline guide */}
        {(cameraState === "ready" || cameraState === "countdown") && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="rounded-full border-4 border-green-400 border-dashed opacity-70"
              style={{ width: 160, height: 200 }}
            />
          </div>
        )}

        {/* Countdown overlay */}
        {cameraState === "countdown" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="text-white text-6xl font-bold drop-shadow-lg">
              {countdown}
            </span>
          </div>
        )}

        {/* Capturing overlay */}
        {cameraState === "capturing" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 gap-2">
            <div className="w-8 h-8 border-4 border-green-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-white text-sm font-medium">
              {captureCount > 1
                ? `Capturing ${capturedCount}/${captureCount}…`
                : "Capturing…"}
            </span>
          </div>
        )}

        {/* Done overlay */}
        {cameraState === "done" && (
          <div className="absolute inset-0 flex items-center justify-center bg-green-900/70">
            <div className="text-center text-white">
              <div className="text-4xl mb-1">✓</div>
              <span className="text-sm font-medium">Done!</span>
            </div>
          </div>
        )}

        {/* Requesting overlay */}
        {cameraState === "requesting" && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center text-gray-400">
              <div className="w-8 h-8 border-4 border-gray-500 border-t-white rounded-full animate-spin mx-auto mb-2" />
              <span className="text-xs">Starting camera…</span>
            </div>
          </div>
        )}
      </div>

      {/* Hidden canvas used for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Error state */}
      {cameraState === "error" && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm max-w-xs text-center">
          {errorMsg}
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>

        {cameraState === "ready" && (
          <button
            type="button"
            onClick={startCapture}
            className="px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
          >
            {captureCount > 1 ? `Capture ${captureCount} Photos` : "Capture"}
          </button>
        )}

        {cameraState === "error" && (
          <button
            type="button"
            onClick={startCamera}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
};