import { useCallback, useEffect, useRef, useState } from "react";

export type CameraDevice = {
  deviceId: string;
  label: string;
};

/**
 * Owns the lifecycle of a camera preview; lets the client choose among multiple
 * attached webcams and start/stop a stream.
 */
export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const mediaDevices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = mediaDevices
      .filter((device) => device.kind === "videoinput")
      .map((device, index) => ({
        deviceId: device.deviceId,
        label: device.label || `Camera ${index + 1}`,
      }));
    setDevices(videoInputs);
    if (!selectedDeviceId && videoInputs.length > 0) {
      setSelectedDeviceId(videoInputs[0].deviceId);
    }
  }, [selectedDeviceId]);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    setActive(false);
  }, []);

  const start = useCallback(
    async (deviceId?: string) => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("This browser does not support webcam access.");
        return;
      }

      const id = deviceId ?? selectedDeviceId;
      setError(null);
      setLoading(true);
      stop();

      try {
        const tryStream = async (constraints: MediaStreamConstraints) => {
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play().catch(() => undefined);
          }
          setActive(true);
        };

        if (id) {
          try {
            await tryStream({
              video: { deviceId: { exact: id } },
              audio: false,
            });
            return;
          } catch (exactError) {
            // Some browsers reject exact device constraints even when the device is
            // available; fall back to the generic environment camera to avoid the
            // black-stream case.
          }
        }

        await tryStream({
          video: { facingMode: "environment" },
          audio: false,
        });
      } catch (e) {
        setError((e as Error).message || "Unable to access the selected webcam.");
        setActive(false);
      } finally {
        setLoading(false);
      }
    },
    [selectedDeviceId, stop],
  );

  useEffect(() => {
    refreshDevices().catch(() => undefined);
    navigator.mediaDevices?.addEventListener?.("devicechange", refreshDevices);
    return () => {
      navigator.mediaDevices?.removeEventListener?.("devicechange", refreshDevices);
    };
  }, [refreshDevices]);

  useEffect(() => () => stop(), [stop]);

  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!active || !video || !stream) return;
    video.srcObject = stream;
    void video.play().catch(() => undefined);
  }, [active]);

  return {
    videoRef,
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    active,
    error,
    loading,
    start,
    stop,
    refreshDevices,
  };
}
