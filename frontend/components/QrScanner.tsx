'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { Notice } from '@/components/ui'
import { es } from '@/lib/strings'

/**
 * Reads a QR code with the phone's camera.
 *
 * Everything happens in the browser. The video never leaves the device, no
 * frame is uploaded, and nothing is stored — the same promise the permit
 * screen makes when it *draws* a QR. `jsqr` is a single function that turns
 * pixels into text; it makes no network calls of its own.
 *
 * The camera is a convenience with a guaranteed fallback. A cracked lens, a
 * refused permission, a browser that will not open a camera on an insecure
 * connection — none of those may stop a guard letting a visitor in, so the
 * typed field beside this is always available and always works.
 *
 * **The camera must be released.** A page that keeps a rear camera open leaves
 * a light on the back of a guard's phone all shift. Every exit from this
 * component stops the tracks.
 */

/** Ten looks per second. Enough to feel instant, cheap enough for a phone battery. */
const SCAN_INTERVAL_MS = 100

/** The frame is shrunk before decoding: a QR does not need a full-size image. */
const MAX_SCAN_WIDTH = 640

export function QrScanner({
  onFound,
  onStop,
}: {
  /** Called once, with the text the code contains. The camera stops first. */
  onFound: (text: string) => void
  onStop: () => void
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  /** Guards against firing twice while the last frame is still in flight. */
  const doneRef = useRef(false)

  const [error, setError] = useState<string | null>(null)

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    let cancelled = false

    async function start() {
      const media = navigator.mediaDevices
      if (!media?.getUserMedia) {
        setError(es.gate.cameraFailed)
        return
      }

      try {
        // The rear camera, which is the one pointing at the visitor's phone.
        const stream = await media.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        })

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        streamRef.current = stream
        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        await video.play()
        tick()
      } catch (cause) {
        if (cancelled) return
        // A refused permission is worth its own sentence: the guard can fix
        // that themselves, and "something failed" would not tell them how.
        const denied =
          typeof cause === 'object' &&
          cause !== null &&
          (cause as { name?: string }).name === 'NotAllowedError'
        setError(denied ? es.gate.cameraDenied : es.gate.cameraFailed)
      }
    }

    function tick() {
      if (cancelled || doneRef.current) return

      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas?.getContext('2d', { willReadFrequently: true })

      if (video && canvas && context && video.readyState === video.HAVE_ENOUGH_DATA) {
        const scale = Math.min(1, MAX_SCAN_WIDTH / (video.videoWidth || MAX_SCAN_WIDTH))
        canvas.width = Math.max(1, Math.round(video.videoWidth * scale))
        canvas.height = Math.max(1, Math.round(video.videoHeight * scale))
        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        const frame = context.getImageData(0, 0, canvas.width, canvas.height)
        const found = jsQR(frame.data, frame.width, frame.height, {
          inversionAttempts: 'dontInvert',
        })

        if (found?.data) {
          doneRef.current = true
          stop()
          onFound(found.data)
          return
        }
      }

      timer = setTimeout(tick, SCAN_INTERVAL_MS)
    }

    void start()

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
      stop()
    }
  }, [onFound, stop])

  if (error) {
    return (
      <div className="space-y-3">
        <Notice kind="error">{error}</Notice>
        <button
          type="button"
          onClick={onStop}
          className="h-11 w-full rounded-lg border border-[var(--color-line)] text-base font-medium"
        >
          {es.gate.scanStop}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl bg-black">
        <video
          ref={videoRef}
          playsInline
          muted
          aria-label={es.gate.cameraLive}
          className="block max-h-[60vh] w-full object-cover"
        />
      </div>
      <canvas ref={canvasRef} className="hidden" />
      <p aria-live="polite" className="text-sm text-[var(--color-ink-soft)]">
        {es.gate.cameraLive}
      </p>
      <button
        type="button"
        onClick={onStop}
        className="h-11 w-full rounded-lg border border-[var(--color-line)] text-base font-medium"
      >
        {es.gate.scanStop}
      </button>
    </div>
  )
}
