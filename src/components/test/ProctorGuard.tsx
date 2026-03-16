"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface ProctorGuardProps {
  attemptId: string | null;
  enabled: boolean;
}

// Make stream accessible globally so test page can use it
if (typeof window !== "undefined") {
  (window as any).__proctorStream = (window as any).__proctorStream || null;
}

export function ProctorGuard({ attemptId, enabled }: ProctorGuardProps) {
  const isGlobal = attemptId === "global";
  const leftAt = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFrameRef = useRef<string | null>(null);
  const [screenSharing, setScreenSharing] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [denied, setDenied] = useState(false);

  // Send screenshot to server
  const sendCapture = useCallback(
    async (image: string) => {
      if (!attemptId || isGlobal) return;
      try {
        await fetch("/api/screen-capture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ attemptId, image }),
        });
      } catch {}
    },
    [attemptId]
  );

  // Capture frame from stream - works even in background via ImageCapture API
  const captureScreen = useCallback(async () => {
    if (!streamRef.current || !attemptId) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track || track.readyState !== "live") return;

    try {
      // Method 1: ImageCapture API (works in background tabs)
      if ("ImageCapture" in window) {
        const imageCapture = new (window as any).ImageCapture(track);
        const bitmap = await imageCapture.grabFrame();
        const canvas = document.createElement("canvas");
        canvas.width = 1280;
        canvas.height = 720;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
          const image = canvas.toDataURL("image/png", 0.5);
          lastFrameRef.current = image;
          await sendCapture(image);
          bitmap.close();
          return;
        }
        bitmap.close();
      }
    } catch {}

    // Method 2: Video element fallback
    try {
      const video = document.createElement("video");
      video.srcObject = streamRef.current;
      video.muted = true;
      await video.play();

      const canvas = document.createElement("canvas");
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const image = canvas.toDataURL("image/png", 0.5);
        lastFrameRef.current = image;
        await sendCapture(image);
      }
      video.pause();
      video.srcObject = null;
    } catch {}
  }, [attemptId, sendCapture]);

  // Keep capturing latest frame every 3 seconds into memory (for instant send on violation)
  const keepLatestFrame = useCallback(async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track || track.readyState !== "live") return;

    try {
      if ("ImageCapture" in window) {
        const imageCapture = new (window as any).ImageCapture(track);
        const bitmap = await imageCapture.grabFrame();
        const canvas = document.createElement("canvas");
        canvas.width = 1280;
        canvas.height = 720;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
          lastFrameRef.current = canvas.toDataURL("image/png", 0.5);
        }
        bitmap.close();
      }
    } catch {}
  }, []);

  const reportViolation = useCallback(
    async (type: string, detail?: string, duration?: number) => {
      if (!attemptId || !enabled || isGlobal) return;
      try {
        await fetch("/api/violations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ attemptId, type, detail, duration }),
        });
      } catch {}
    },
    [attemptId, enabled, isGlobal]
  );

  // Request screen sharing
  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: 1280, height: 720, frameRate: 1 },
        audio: false,
      });

      streamRef.current = stream;
      if (typeof window !== "undefined") (window as any).__proctorStream = stream;
      setScreenSharing(true);
      setShowPermissionModal(false);

      stream.getVideoTracks()[0].addEventListener("ended", () => {
        setScreenSharing(false);
        streamRef.current = null;
        if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
        reportViolation("SCREEN_SHARE_STOPPED", "Ekran paylaşması dayandırıldı");
        setShowPermissionModal(true);
      });

      // Immediate first capture
      captureScreen();

      // Periodic: send to server every 15s, keep frame in memory every 3s
      captureIntervalRef.current = setInterval(() => {
        captureScreen();
      }, 15000);

      // Keep latest frame in memory more frequently for instant violation captures
      const frameInterval = setInterval(keepLatestFrame, 3000);
      const origCleanup = captureIntervalRef.current;
      captureIntervalRef.current = setInterval(() => {
        captureScreen();
      }, 15000);
      // Store both intervals for cleanup
      const cleanup = () => {
        clearInterval(origCleanup!);
        clearInterval(frameInterval);
        clearInterval(captureIntervalRef.current!);
      };
      stream.getVideoTracks()[0].addEventListener("ended", cleanup);
    } catch {
      setDenied(true);
      reportViolation("SCREEN_SHARE_DENIED", "Ekran paylaşması rədd edildi");
    }
  }, [captureScreen, keepLatestFrame, reportViolation]);

  // Show permission modal on start
  useEffect(() => {
    if (enabled) {
      // Check if already sharing (from global instance)
      if (typeof window !== "undefined" && (window as any).__proctorStream) {
        const existing = (window as any).__proctorStream as MediaStream;
        const track = existing.getVideoTracks()[0];
        if (track && track.readyState === "live") {
          streamRef.current = existing;
          setScreenSharing(true);
          return;
        }
      }
      setShowPermissionModal(true);
    }
    return () => {
      // Only cleanup if NOT global (global stays active across pages)
      if (!isGlobal) {
        if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
      }
    };
  }, [enabled, isGlobal]);

  // Tab/window monitoring
  useEffect(() => {
    if (!enabled || !attemptId) return;

    // When student is ABOUT TO leave - capture immediately before tab hides
    const handleBeforeHide = () => {
      leftAt.current = Date.now();

      // Immediately capture what's on screen right now
      if (streamRef.current) {
        const track = streamRef.current.getVideoTracks()[0];
        if (track && track.readyState === "live" && "ImageCapture" in window) {
          try {
            const imageCapture = new (window as any).ImageCapture(track);
            imageCapture.grabFrame().then((bitmap: ImageBitmap) => {
              const canvas = document.createElement("canvas");
              canvas.width = 1280;
              canvas.height = 720;
              const ctx = canvas.getContext("2d");
              if (ctx) {
                ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
                const image = canvas.toDataURL("image/png", 0.5);
                // Use sendBeacon for reliability during page hide
                fetch("/api/screen-capture", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ attemptId, image }),
                  keepalive: true,
                }).catch(() => {});
              }
              bitmap.close();
            }).catch(() => {
              if (lastFrameRef.current) {
                fetch("/api/screen-capture", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ attemptId, image: lastFrameRef.current }),
                  keepalive: true,
                }).catch(() => {});
              }
            });
          } catch {
            if (lastFrameRef.current) {
              fetch("/api/screen-capture", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ attemptId, image: lastFrameRef.current }),
                keepalive: true,
              }).catch(() => {});
            }
          }
        }
      }
    };

    // When student returns - capture what they see and report
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleBeforeHide();
      } else if (leftAt.current) {
        const duration = Math.round((Date.now() - leftAt.current) / 1000);
        leftAt.current = null;
        reportViolation("TAB_SWITCH", `${duration}s başqa tab-da`, duration);

        // Capture screen on return (shows what they came back to)
        setTimeout(() => captureScreen(), 500);
      }
    };

    const handleBlur = () => {
      if (!document.hidden) {
        handleBeforeHide();
      }
    };

    const handleFocus = () => {
      if (leftAt.current && !document.hidden) {
        const duration = Math.round((Date.now() - leftAt.current) / 1000);
        leftAt.current = null;
        if (duration >= 2) {
          reportViolation("WINDOW_BLUR", `${duration}s pəncərədən çıxıb`, duration);
          setTimeout(() => captureScreen(), 500);
        }
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName !== "TEXTAREA") {
        e.preventDefault();
        reportViolation("COPY_PASTE", "Kopyalama cəhdi");
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName !== "TEXTAREA") {
        e.preventDefault();
        reportViolation("COPY_PASTE", "Yapışdırma cəhdi");
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      reportViolation("RIGHT_CLICK", "Sağ klik cəhdi");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [enabled, attemptId, reportViolation, captureScreen]);

  if (!enabled) return null;

  return (
    <>
      {/* Screen share permission modal */}
      {showPermissionModal && !screenSharing && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70">
          <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-2xl">
            <div className="mb-4 text-5xl">🖥️</div>
            <h2 className="mb-3 text-xl font-bold text-gray-900">
              Ekran Paylaşması Tələb Olunur
            </h2>
            <p className="mb-2 text-sm text-gray-600">
              Test zamanı ekranınız nəzarət olunur. Testə başlamaq üçün ekranınızı paylaşmalısınız.
            </p>
            <p className="mb-6 text-xs text-gray-500">
              Açılan pəncərədə <b>&quot;Bütün Ekran&quot;</b> seçin və <b>&quot;Paylaş&quot;</b> basın.
            </p>
            {denied && (
              <p className="mb-4 text-sm font-medium text-red-600">
                Ekran paylaşması rədd edildi. Yenidən cəhd edin.
              </p>
            )}
            <button
              onClick={() => { setDenied(false); startScreenShare(); }}
              className="w-full rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700"
            >
              Ekranımı Paylaş
            </button>
          </div>
        </div>
      )}

      {/* Minimal indicator - student doesn't see monitoring activity */}
      {screenSharing && (
        <div className="fixed left-4 top-4 z-50 flex items-center gap-1.5 rounded-full bg-gray-600/50 px-2 py-0.5 text-[9px] text-white/60">
          <span className="h-1 w-1 rounded-full bg-green-400"></span>
          aktiv
        </div>
      )}
    </>
  );
}
