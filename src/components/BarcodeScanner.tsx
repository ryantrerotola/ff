"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function startScanning() {
      // Check if BarcodeDetector is available
      if (!("BarcodeDetector" in window)) {
        setError("Camera barcode scanning is not supported in this browser. Enter the code manually below.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setScanning(true);

        const BarcodeDetectorCtor = (window as unknown as Record<string, unknown>).BarcodeDetector as new (opts: { formats: string[] }) => { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> };
        const detector = new BarcodeDetectorCtor({
          formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39"],
        });

        const detect = async () => {
          if (cancelled || !videoRef.current) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const code = barcodes[0]?.rawValue;
              if (code) {
                onScan(code);
                return;
              }
            }
          } catch {
            // Detection frame failed, retry
          }
          if (!cancelled) {
            requestAnimationFrame(detect);
          }
        };

        detect();
      } catch {
        setError("Could not access camera. Enter the barcode manually below.");
      }
    }

    startScanning();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [onScan, stopCamera]);

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Scan Barcode
          </h3>
          <button
            onClick={() => { stopCamera(); onClose(); }}
            className="rounded-md p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {scanning && (
          <div className="relative mb-4 overflow-hidden rounded-lg bg-black">
            <video
              ref={videoRef}
              className="w-full"
              playsInline
              muted
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-0.5 w-3/4 bg-red-500 opacity-75 animate-pulse" />
            </div>
            <p className="absolute bottom-2 left-0 right-0 text-center text-xs text-white/80">
              Point camera at barcode
            </p>
          </div>
        )}

        {error && (
          <p className="mb-4 text-sm text-amber-600 dark:text-amber-400">{error}</p>
        )}

        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Enter UPC / barcode number..."
            className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <button
            type="submit"
            disabled={!manualCode.trim()}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            Look Up
          </button>
        </form>
      </div>
    </div>
  );
}
