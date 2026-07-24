import { useCallback, useEffect, useRef, useState } from "react";

/**
 * getUserMedia camera access for the web scanner (Phase 5). Kept minimal here —
 * the OpenCV/TFLite scanning pipeline lands with the Scanner feature; this just
 * owns the video stream lifecycle so the Scanner screen has a real preview.
 */
export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setActive(true);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setActive(false);
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { videoRef, active, error, start, stop };
}
