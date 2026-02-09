'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Eraser, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * SignaturePad Component
 *
 * A canvas-based signature drawing component that supports:
 * - Mouse input (desktop)
 * - Touch input (phones/tablets)
 * - Pressure sensitivity (when available)
 * - RTL layout support for Arabic
 *
 * The signature is exported as base64 PNG data for storage.
 */

interface SignaturePadProps {
  /** Canvas width in pixels (default: 400) */
  width?: number;
  /** Canvas height in pixels (default: 250) */
  height?: number;
  /** Callback when signature is saved, receives base64 string */
  onSign: (signatureData: string) => void;
  /** Current locale for translations */
  locale: 'en' | 'ar';
  /** Whether the component is disabled */
  disabled?: boolean;
}

interface Point {
  x: number;
  y: number;
  pressure: number;
}

const translations = {
  en: {
    label: 'Your Signature',
    instruction: 'Draw your signature above using mouse or touch',
    clear: 'Clear',
    save: 'Save Signature',
    confirmClear: 'Clear signature?',
    confirmYes: 'Yes, clear',
    confirmNo: 'Cancel',
    empty: 'Please draw your signature before saving',
  },
  ar: {
    label: 'توقيعك',
    instruction: 'ارسم توقيعك أعلاه باستخدام الماوس أو اللمس',
    clear: 'مسح',
    save: 'حفظ التوقيع',
    confirmClear: 'مسح التوقيع؟',
    confirmYes: 'نعم، امسح',
    confirmNo: 'إلغاء',
    empty: 'يرجى رسم توقيعك قبل الحفظ',
  },
};

export function SignaturePad({
  width = 400,
  height = 250,
  onSign,
  locale,
  disabled = false,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store last point for smooth line drawing
  const lastPointRef = useRef<Point | null>(null);

  // Throttle drawing for performance
  const lastDrawTimeRef = useRef<number>(0);
  const DRAW_THROTTLE_MS = 8; // ~120fps max

  const isRtl = locale === 'ar';
  const t = translations[locale];

  // Stroke style configuration
  const STROKE_COLOR = '#2D2D2D'; // Charcoal
  const BASE_LINE_WIDTH = 2;
  const MAX_LINE_WIDTH = 5;

  /**
   * Initialize canvas with white background
   */
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;

    // Fill with white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Configure stroke style
    ctx.strokeStyle = STROKE_COLOR;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = BASE_LINE_WIDTH;
  }, [width, height]);

  // Initialize canvas on mount
  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  /**
   * Get point coordinates from mouse or touch event
   * Handles both mouse and touch input with pressure sensitivity
   */
  const getPointFromEvent = useCallback((
    e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent
  ): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX: number;
    let clientY: number;
    let pressure = 0.5; // Default pressure

    // Handle touch events
    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      const touch = e.touches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;

      // Get pressure from touch if available (Force Touch / 3D Touch)
      if ('force' in touch && typeof touch.force === 'number') {
        pressure = Math.max(0.1, Math.min(1, touch.force));
      }
    } else {
      // Handle mouse events
      clientX = e.clientX;
      clientY = e.clientY;

      // Use button pressure if available (some styluses)
      if ('pressure' in e && typeof e.pressure === 'number' && e.pressure > 0) {
        pressure = e.pressure;
      }
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
      pressure,
    };
  }, []);

  /**
   * Draw a smooth line between two points
   * Uses quadratic bezier curves for smooth strokes
   * Line width varies based on pressure
   */
  const drawLine = useCallback((from: Point, to: Point) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate line width based on average pressure
    const avgPressure = (from.pressure + to.pressure) / 2;
    const lineWidth = BASE_LINE_WIDTH + (MAX_LINE_WIDTH - BASE_LINE_WIDTH) * avgPressure;

    ctx.beginPath();
    ctx.strokeStyle = STROKE_COLOR;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Use quadratic bezier for smoother lines
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;

    ctx.moveTo(from.x, from.y);
    ctx.quadraticCurveTo(from.x, from.y, midX, midY);
    ctx.stroke();
  }, []);

  /**
   * Start drawing - handles both mouse and touch
   */
  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;

    e.preventDefault();
    setError(null);

    const point = getPointFromEvent(e);
    if (!point) return;

    setIsDrawing(true);
    setHasDrawn(true);
    lastPointRef.current = point;

    // Draw a dot for single tap/click
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, BASE_LINE_WIDTH / 2, 0, Math.PI * 2);
        ctx.fillStyle = STROKE_COLOR;
        ctx.fill();
      }
    }
  }, [disabled, getPointFromEvent]);

  /**
   * Continue drawing - handles both mouse and touch
   * Throttled for performance optimization
   */
  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled) return;

    e.preventDefault();

    // Throttle drawing for performance
    const now = Date.now();
    if (now - lastDrawTimeRef.current < DRAW_THROTTLE_MS) return;
    lastDrawTimeRef.current = now;

    const point = getPointFromEvent(e);
    if (!point) return;

    const lastPoint = lastPointRef.current;
    if (lastPoint) {
      drawLine(lastPoint, point);
    }

    lastPointRef.current = point;
  }, [isDrawing, disabled, getPointFromEvent, drawLine]);

  /**
   * Stop drawing - handles both mouse and touch
   */
  const stopDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();

    setIsDrawing(false);
    lastPointRef.current = null;
  }, [isDrawing]);

  /**
   * Handle mouse leaving canvas area
   */
  const handleMouseLeave = useCallback((e: React.MouseEvent) => {
    if (isDrawing) {
      stopDrawing(e);
    }
  }, [isDrawing, stopDrawing]);

  /**
   * Clear the signature canvas
   * Shows confirmation dialog first
   */
  const handleClear = useCallback(() => {
    if (!hasDrawn) return;
    setShowConfirmClear(true);
  }, [hasDrawn]);

  const confirmClear = useCallback(() => {
    initCanvas();
    setHasDrawn(false);
    setShowConfirmClear(false);
    setError(null);
    lastPointRef.current = null;
  }, [initCanvas]);

  const cancelClear = useCallback(() => {
    setShowConfirmClear(false);
  }, []);

  /**
   * Check if canvas has any drawing (not just white)
   */
  const isCanvasEmpty = useCallback((): boolean => {
    const canvas = canvasRef.current;
    if (!canvas) return true;

    const ctx = canvas.getContext('2d');
    if (!ctx) return true;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Check if any pixel is not white (255, 255, 255)
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // If any pixel is not white, canvas is not empty
      if (r !== 255 || g !== 255 || b !== 255) {
        return false;
      }
    }

    return true;
  }, []);

  /**
   * Save the signature and call onSign callback
   * Exports as base64 PNG with timestamp metadata
   */
  const handleSave = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check if there's actually a signature
    if (isCanvasEmpty()) {
      setError(t.empty);
      return;
    }

    // Export as base64 PNG
    const signatureBase64 = canvas.toDataURL('image/png');

    // Create signature data with timestamp
    const signatureData = JSON.stringify({
      signature: signatureBase64,
      timestamp: new Date().toISOString(),
      dimensions: { width: canvas.width, height: canvas.height },
    });

    // Call the callback with base64 signature
    onSign(signatureData);
  }, [onSign, isCanvasEmpty, t.empty]);

  /**
   * Export signature as PNG Blob (for email/documents)
   * This can be called externally if needed
   */
  const exportAsBlob = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current;
      if (!canvas || isCanvasEmpty()) {
        resolve(null);
        return;
      }

      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png');
    });
  }, [isCanvasEmpty]);

  // Expose exportAsBlob method via ref if needed
  useEffect(() => {
    // Store export function on canvas element for external access
    const canvas = canvasRef.current;
    if (canvas) {
      (canvas as HTMLCanvasElement & { exportAsBlob?: typeof exportAsBlob }).exportAsBlob = exportAsBlob;
    }
  }, [exportAsBlob]);

  return (
    <div className="space-y-4" ref={containerRef}>
      {/* Label */}
      <label
        className={`
          block text-booking-body font-medium text-[#2D2D2D]
          ${isRtl ? 'text-right' : 'text-left'}
        `}
      >
        {t.label}
      </label>

      {/* Canvas Container */}
      <div
        className={`
          relative border-2 rounded-lg overflow-hidden
          transition-all duration-200
          ${disabled
            ? 'border-[#E8E3DB] bg-gray-50 cursor-not-allowed'
            : error
              ? 'border-red-400 bg-red-50'
              : isDrawing
                ? 'border-[#C9A96E] shadow-lg shadow-[#C9A96E]/20'
                : 'border-[#E8E3DB] bg-white hover:border-[#C9A96E]/50'
          }
        `}
      >
        <canvas
          ref={canvasRef}
          className={`
            w-full touch-none
            ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-crosshair'}
          `}
          style={{
            height: `${height}px`,
            maxHeight: '300px',
          }}
          // Mouse events for desktop
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={handleMouseLeave}
          // Touch events for mobile/tablet
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          onTouchCancel={stopDrawing}
        />

        {/* Visual feedback overlay when drawing */}
        {isDrawing && (
          <div
            className="absolute inset-0 pointer-events-none border-2 border-[#C9A96E] rounded-lg animate-pulse"
            style={{ opacity: 0.3 }}
          />
        )}

        {/* Disabled overlay */}
        {disabled && (
          <div className="absolute inset-0 bg-gray-100/50 flex items-center justify-center">
            <span className="text-gray-500 text-sm">
              {isRtl ? 'معطل' : 'Disabled'}
            </span>
          </div>
        )}
      </div>

      {/* Instruction text */}
      <p
        className={`
          text-booking-body-sm text-[#8B7355]
          ${isRtl ? 'text-right' : 'text-left'}
        `}
      >
        {t.instruction}
      </p>

      {/* Error message */}
      {error && (
        <p
          role="alert"
          className={`
            text-booking-body-sm text-red-600 font-medium
            flex items-center gap-1.5
            ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}
          `}
        >
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </p>
      )}

      {/* Confirm Clear Dialog */}
      {showConfirmClear && (
        <div
          className={`
            p-4 rounded-lg border-2 border-amber-400 bg-amber-50
            flex items-center justify-between gap-4
            ${isRtl ? 'flex-row-reverse' : ''}
          `}
        >
          <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <span className="text-booking-body font-medium text-amber-800">
              {t.confirmClear}
            </span>
          </div>
          <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={cancelClear}
              className="text-[#6B6B6B] hover:text-[#2D2D2D]"
            >
              {t.confirmNo}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={confirmClear}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {t.confirmYes}
            </Button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!showConfirmClear && (
        <div className={`flex gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
          {/* Clear Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
            disabled={disabled || !hasDrawn}
            className={`
              flex-1 py-5
              border-[#E8E3DB] text-[#6B6B6B]
              hover:border-red-400 hover:text-red-600 hover:bg-red-50
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
              ${isRtl ? 'flex-row-reverse' : ''}
            `}
          >
            <Eraser className="w-4 h-4" />
            {t.clear}
          </Button>

          {/* Save Button */}
          <Button
            type="button"
            onClick={handleSave}
            disabled={disabled || !hasDrawn}
            className={`
              flex-1 py-5
              bg-[#C9A96E] hover:bg-[#B89355] text-white
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
              hover:shadow-lg hover:shadow-[#C9A96E]/30
              active:scale-[0.98]
              ${isRtl ? 'flex-row-reverse' : ''}
            `}
          >
            <Check className="w-4 h-4" />
            {t.save}
          </Button>
        </div>
      )}
    </div>
  );
}

export default SignaturePad;
