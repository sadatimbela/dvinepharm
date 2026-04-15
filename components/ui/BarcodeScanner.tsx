'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, Loader2 } from 'lucide-react';

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function BarcodeScanner({ onScanSuccess, onScanError, onClose, isOpen }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsInitializing(true);
      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;

      const config = {
        fps: 20, /* locked max framerate to 20 for optimization */
        qrbox: { width: 250, height: 150 },
        aspectRatio: 1.0,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
        ],
      };

      html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          // Instant Audio Feedback
          try {
            const beep = new Audio('/beep.wav');
            beep.play().catch(e => console.log('Beep audio blocked:', e));
          } catch (e) {}
          
          onScanSuccess(decodedText);
          stopScanner();
        },
        (errorMessage) => {
          // Ignore routine scanned frames where no barcode is detected or internal canvas sizing errors
          if (typeof errorMessage === 'string' && (
            errorMessage.includes('NotFoundException') || 
            errorMessage.includes('IndexSizeError')
          )) return;
          if (onScanError) onScanError(errorMessage);
        }
      ).then(() => {
        setIsInitializing(false);
      }).catch(err => {
        console.error('Failed to start scanner', err);
        setIsInitializing(false);
      });

      return () => {
        stopScanner();
      };
    }
  }, [isOpen]);

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        onClose();
      } catch (err) {
        console.error('Failed to stop scanner', err);
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'scannerFadeIn 200ms ease forwards',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '500px',
          background: '#1e293b',
          borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          animation: 'scannerSlideUp 300ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '10px',
              background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Camera size={20} color="#fff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff' }}>Barcode Scanner</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                Point camera at barcode to scan
              </p>
            </div>
          </div>
          <button
            onClick={stopScanner}
            style={{
              padding: '8px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.05)',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.6)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.2)';
              e.currentTarget.style.color = '#ef4444';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scanner Body */}
        <div style={{ padding: '24px', position: 'relative', minHeight: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {isInitializing && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', zIndex: 10, borderRadius: '16px' }}>
              <Loader2 size={32} className="animate-spin" color="var(--accent)" />
            </div>
          )}
          
          <div id="reader" style={{
            width: '100%',
            overflow: 'hidden',
            borderRadius: '16px',
            background: '#0f172a',
            border: '1px solid rgba(255,255,255,0.05)',
          }} />
          
          <div style={{
            marginTop: '20px',
            textAlign: 'center',
            fontSize: '13px',
            color: 'rgba(255,255,255,0.4)',
            lineHeight: 1.5,
          }}>
            Tap the camera view to focus.<br/>
            Hold the product steady and ensure good lighting.
          </div>
        </div>

        {/* Custom Styles for html5-qrcode UI */}
        <style>{`
          #reader { border: none !important; }
          #reader__dashboard_section_csr button {
            background: var(--accent) !important;
            color: white !important;
            border: none !important;
            padding: 10px 20px !important;
            border-radius: 8px !important;
            font-weight: 600 !important;
            margin: 10px 0 !important;
            cursor: pointer !important;
            font-family: inherit !important;
          }
          #reader__dashboard_section_swap_link {
            color: var(--accent) !important;
            font-size: 13px !important;
            text-decoration: none !important;
          }
          #reader video {
            border-radius: 12px !important;
            object-fit: cover !important;
          }
          @keyframes scannerFadeIn { from { opacity: 0 } to { opacity: 1 } }
          @keyframes scannerSlideUp { from { opacity: 0; transform: translateY(20px) scale(0.95) } to { opacity: 1; transform: translateY(0) scale(1) } }
        `}</style>
      </div>
    </div>
  );
}
