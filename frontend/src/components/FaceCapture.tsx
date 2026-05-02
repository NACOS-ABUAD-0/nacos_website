// /frontend/src/components/FaceCapture.tsx

/**
 * FaceCapture — reusable camera capture component.
 *
 * Fix: removed manual video.play() call; autoPlay on the <video> element
 * handles playback once the srcObject is set, eliminating the AbortError
 * that occurred when play() raced with the browser's internal load request.
 * A mounted-ref guard prevents state updates after unmount.
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
const INTER_FRAME_MS = 800;

export const FaceCapture: React.FC<FaceCaptureProps> = ({
  onCapture,
  captureCount = 1,
  instruction = "Position your face in the frame, then click Capture.",
  onCancel,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef(true); // ← guard: prevents setState after unmount

  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [countdown, setCountdown] = useState(COUNTDOWN_FROM);
  const [capturedCount, setCapturedCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  // ── Teardown ───────────────────────────────────────────────────────────────

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    // Detach srcObject so the browser releases the device immediately
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // ── Start camera ───────────────────────────────────────────────────────────

  const startCamera = useCallback(async () => {
    if (!mountedRef.current) return;
    setCameraState("requesting");

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: false,
      });
    } catch (err: unknown) {
      if (!mountedRef.current) return; // component gone while awaiting
      const msg =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Camera access denied. Please allow camera access and try again."
          : "Could not access camera. Please check your device settings.";
      setErrorMsg(msg);
      setCameraState("error");
      return;
    }

    if (!mountedRef.current) {
      // Unmounted while getUserMedia was resolving — release the stream
      stream.getTracks().forEach((t) => t.stop());
      return;
    }

    streamRef.current = stream;

    if (videoRef.current) {
      // Assign stream; the `autoPlay` attribute triggers playback automatically.
      // Do NOT call .play() here — that causes the AbortError.
      videoRef.current.srcObject = stream;
    }

    setCameraState("ready");
  }, []);

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    startCamera();
    return () => {
      mountedRef.current = false;
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // ── Capture a single frame ─────────────────────────────────────────────────

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Mirror horizontally to match the CSS mirror transform on the preview
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    return canvas.toDataURL("image/jpeg", 0.92);
  }, []);

  // ── Countdown → capture sequence ───────────────────────────────────────────

  const runCaptures = useCallback(async () => {
    if (!mountedRef.current) return;
    setCameraState("capturing");
    const frames: string[] = [];

    for (let i = 0; i < captureCount; i++) {
      const frame = captureFrame();
      if (frame) {
        frames.push(frame);
        if (mountedRef.current) setCapturedCount(i + 1);
      }
      if (i < captureCount - 1) {
        await new Promise<void>((r) => setTimeout(r, INTER_FRAME_MS));
      }
    }

    if (!mountedRef.current) return;
    setCameraState("done");
    stopCamera();
    onCapture(frames);
  }, [captureCount, captureFrame, onCapture, stopCamera]);

  const startCapture = useCallback(() => {
    if (cameraState !== "ready") return;
    setCameraState("countdown");
    setCountdown(COUNTDOWN_FROM);

    let tick = COUNTDOWN_FROM;
    const timer = setInterval(() => {
      tick -= 1;
      if (mountedRef.current) setCountdown(tick);
      if (tick === 0) {
        clearInterval(timer);
        runCaptures();
      }
    }, 1000);
  }, [cameraState, runCaptures]);

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
      <div
        className="relative rounded-2xl overflow-hidden bg-gray-900 shadow-lg"
        style={{ width: 320, height: 240 }}
      >
        {/*
          KEY CHANGE: autoPlay + playsInline + muted
          - autoPlay   → browser starts playback as soon as srcObject is ready,
                         with no manual .play() call that could race/abort.
          - playsInline → required on iOS to prevent full-screen takeover.
          - muted       → required for autoPlay to work without user gesture.
        */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }}
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

      {/* Hidden canvas — used only for frame capture */}
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