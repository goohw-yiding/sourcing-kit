"use client";
import { useRef, useState, useEffect, useCallback } from "react";
import { X, Camera, QrCode } from "lucide-react";

interface QRScannerProps {
  onResult: (text: string) => void;
  onClose: () => void;
  hint?: string;
}

export function QRScanner({ onResult, onClose, hint }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setScanning(true);
      }
    } catch {
      setError("카메라 권한이 필요합니다. 브라우저 주소창 왼쪽의 🔒 아이콘을 눌러 카메라 허용을 선택하세요.");
    }
  }, []);

  // BarcodeDetector로 QR 스캔
  useEffect(() => {
    if (!scanning) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const BarcodeDetectorAPI = (window as any).BarcodeDetector;
    if (!BarcodeDetectorAPI) {
      // BarcodeDetector 미지원 → 수동 입력 안내
      setError("이 브라우저는 자동 QR 인식을 지원하지 않습니다. Chrome 최신 버전을 사용해 주세요.");
      return;
    }

    const detector = new BarcodeDetectorAPI({ formats: ["qr_code", "code_128", "ean_13", "ean_8"] });
    let running = true;

    const tick = async () => {
      if (!running || !videoRef.current || videoRef.current.readyState < 2) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      try {
        const barcodes = await detector.detect(videoRef.current);
        if (barcodes.length > 0) {
          running = false;
          stopCamera();
          onResult(barcodes[0].rawValue);
          return;
        }
      } catch { /* ignore */ }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { running = false; cancelAnimationFrame(rafRef.current); };
  }, [scanning, onResult, stopCamera]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 pt-14 pb-3 bg-black/80">
        <div className="flex items-center gap-2 text-white">
          <QrCode className="w-5 h-5" />
          <span className="font-semibold">{hint || "QR 코드 스캔"}</span>
        </div>
        <button onClick={() => { stopCamera(); onClose(); }} className="text-white p-2">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* 카메라 뷰 */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* QR 가이드 오버레이 */}
        {scanning && !error && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-64 h-64">
              {/* 모서리 가이드라인 */}
              <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-white rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-white rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-white rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-white rounded-br-lg" />
              {/* 스캔 라인 애니메이션 */}
              <div className="absolute inset-x-0 top-1/2 h-0.5 bg-orange-400 opacity-80 animate-pulse" />
            </div>
            <p className="absolute bottom-32 text-white text-sm text-center px-8">
              QR코드를 네모 안에 맞춰주세요
            </p>
          </div>
        )}
      </div>

      {/* 오류 메시지 */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 px-6 text-center gap-4">
          <Camera className="w-12 h-12 text-gray-400" />
          <p className="text-white text-sm leading-relaxed">{error}</p>
          <button
            onClick={startCamera}
            className="bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold"
          >
            다시 시도
          </button>
          <button
            onClick={() => { stopCamera(); onClose(); }}
            className="text-gray-400 text-sm"
          >
            닫기
          </button>
        </div>
      )}
    </div>
  );
}
