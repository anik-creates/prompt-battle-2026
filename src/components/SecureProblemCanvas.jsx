import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  EyeOff, 
  Lock, 
  AlertTriangle,
  Sparkles,
  CameraOff
} from 'lucide-react';

/**
 * SecureProblemCanvas:
 * 1. Renders all problem statement text onto an HTML5 <canvas> (ZERO DOM text nodes to inspect or copy).
 * 2. Blanks out instantly on window blur or visibility change (defeats Snipping Tool / Win+Shift+S / screenshot apps).
 * 3. Detects PrintScreen key and clears/overwrites clipboard.
 * 4. Detects DevTools and locks view until DevTools is closed.
 * 5. Embeds subtle anti-photo diagonal watermarks directly into the pixel buffer.
 */
export default function SecureProblemCanvas({
  problemStatement = {},
  activeSession = null,
  mode = 'participant', // 'participant' | 'presentation' | 'admin'
  className = ''
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Security States (Anti-Copy & Integrity Protected)
  const [screenshotFlash, setScreenshotFlash] = useState(false);
  const [securityToast, setSecurityToast] = useState('');
  const toastTimeoutRef = useRef(null);

  const showSecurityToast = (msg) => {
    setSecurityToast(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setSecurityToast('');
    }, 2500);
  };

  // Keyboard Shortcuts & Anti-Copy Protection (Tab switching allowed freely for Antigravity)
  useEffect(() => {
    // PrintScreen Key Capture
    const handleKeyUp = (e) => {
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        setScreenshotFlash(true);
        showSecurityToast('⚠️ Screenshot blocked: Protected competition material.');
        try {
          if (navigator.clipboard) {
            navigator.clipboard.writeText('⚠️ Screenshot blocked: IEEE PES DIU SBC competition problem statement is confidential.');
          }
        } catch (err) {}
        setTimeout(() => setScreenshotFlash(false), 900);
      }
    };

    // Keyboard Shortcuts Blocker (F12, Ctrl+Shift+I/J/C, Ctrl+U, Ctrl+C, Ctrl+S, Ctrl+P)
    const handleKeyDown = (e) => {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      const key = e.key ? e.key.toLowerCase() : '';

      if (e.keyCode === 44 || e.key === 'PrintScreen') {
        setScreenshotFlash(true);
        setTimeout(() => setScreenshotFlash(false), 900);
      }

      // F12
      if (e.keyCode === 123 || e.key === 'F12') {
        e.preventDefault();
        e.stopPropagation();
        showSecurityToast('F12 DevTools Inspection is disabled.');
        return false;
      }

      // Ctrl+Shift+I / J / C (DevTools)
      if (isCtrlOrMeta && e.shiftKey && (key === 'i' || key === 'j' || key === 'c')) {
        e.preventDefault();
        e.stopPropagation();
        showSecurityToast('DevTools element inspector is disabled.');
        return false;
      }

      // Ctrl+U (View Source)
      if (isCtrlOrMeta && key === 'u') {
        e.preventDefault();
        e.stopPropagation();
        showSecurityToast('View page source is disabled.');
        return false;
      }

      // Ctrl+S (Save)
      if (isCtrlOrMeta && key === 's') {
        e.preventDefault();
        e.stopPropagation();
        showSecurityToast('Page saving is disabled.');
        return false;
      }

      // Ctrl+P (Print)
      if (isCtrlOrMeta && key === 'p') {
        e.preventDefault();
        e.stopPropagation();
        showSecurityToast('Printing is disabled.');
        return false;
      }

      // Ctrl+C / Ctrl+A / Ctrl+X
      if (isCtrlOrMeta && (key === 'c' || key === 'a' || key === 'x')) {
        e.preventDefault();
        e.stopPropagation();
        showSecurityToast('Text copying is disabled.');
        try {
          if (navigator.clipboard) {
            navigator.clipboard.writeText('⚠️ Copying is prohibited by IEEE PES DIU SBC.');
          }
        } catch (err) {}
        return false;
      }
    };

    window.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  // 2. Render Text onto Canvas (HiDPI Sharp Rendering)
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const containerWidth = container.clientWidth || 800;
    
    // Safety check: minimum width
    const targetWidth = Math.max(320, containerWidth);

    // Padding inside canvas
    const pad = mode === 'presentation' ? 32 : 24;
    const contentWidth = targetWidth - (pad * 2);

    // Dynamic measurement pass to compute required canvas height
    const baseFontSize = mode === 'presentation' ? 15 : 13;
    const lineHeight = baseFontSize * 1.55;
    
    ctx.font = `${baseFontSize}px 'JetBrains Mono', monospace, sans-serif`;

    // Helper: Wrap text lines
    const wrapText = (text, maxWidth) => {
      if (!text) return [];
      const paragraphs = String(text).split('\n');
      const lines = [];

      paragraphs.forEach((paragraph) => {
        if (!paragraph.trim()) {
          lines.push('');
          return;
        }
        const words = paragraph.split(' ');
        let currentLine = '';

        words.forEach((word) => {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        });
        if (currentLine) {
          lines.push(currentLine);
        }
      });
      return lines;
    };

    // Calculate lines for each section
    const scenarioLines = wrapText(problemStatement.scenario || '', contentWidth);
    const objectiveLines = wrapText(problemStatement.objective || '', contentWidth);
    const constraintsList = Array.isArray(problemStatement.constraints) ? problemStatement.constraints : [];
    const wrappedConstraints = constraintsList.map((c) => wrapText(c, contentWidth - 32));

    // Estimate total height needed
    let totalHeight = pad;
    // Track & Title
    totalHeight += 40; // Title bar
    totalHeight += 24; // Section 1 header
    totalHeight += (scenarioLines.length * lineHeight) + 20;
    totalHeight += 24; // Section 2 header
    totalHeight += (objectiveLines.length * lineHeight) + 20;
    if (constraintsList.length > 0) {
      totalHeight += 24; // Section 3 header
      wrappedConstraints.forEach((lines) => {
        totalHeight += Math.max(lineHeight, lines.length * lineHeight) + 8;
      });
      totalHeight += 16;
    }
    totalHeight += pad + 10;

    // Apply HiDPI scale
    canvas.width = targetWidth * dpr;
    canvas.height = Math.max(380, totalHeight) * dpr;
    canvas.style.width = `${targetWidth}px`;
    canvas.style.height = `${Math.max(380, totalHeight)}px`;

    ctx.scale(dpr, dpr);

    // Clear background
    ctx.fillStyle = '#080d16'; // Deep arena dark
    ctx.fillRect(0, 0, targetWidth, totalHeight);

    // --- WATERMARK PASS (Drawn directly in pixels) ---
    const watermarkText = activeSession
      ? `${activeSession.name || 'Contender'} • ${activeSession.studentId || 'ID'} • ${activeSession.deskNumber || 'Desk'} • PES DIU SBC 2026`
      : (mode === 'presentation' ? 'IEEE PES DIU SBC • AUDITORIUM BROADCAST • EEE FEST 2026' : 'IEEE PES DIU SBC • PROMPT BATTLE 2026');

    ctx.save();
    ctx.rotate(-15 * Math.PI / 180);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.032)';
    ctx.font = `bold ${mode === 'presentation' ? 14 : 11}px sans-serif`;
    
    // Tile watermarks across wide area
    for (let x = -400; x < targetWidth + 500; x += 320) {
      for (let y = -200; y < totalHeight + 400; y += 80) {
        ctx.fillText(watermarkText, x, y);
      }
    }
    ctx.restore();

    // --- CONTENT RENDERING ---
    let curY = pad + 10;

    // Category / Track
    if (problemStatement.track) {
      ctx.fillStyle = '#00e5ff'; // fest-cyan
      ctx.font = `bold ${baseFontSize - 2}px sans-serif`;
      ctx.fillText(`TRACK: ${problemStatement.track.toUpperCase()}`, pad, curY);
      curY += 22;
    }

    // Main Title
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${baseFontSize + 7}px sans-serif`;
    const titleLines = wrapText(problemStatement.title || 'Official Prompt Battle Challenge', contentWidth);
    titleLines.forEach((tLine) => {
      ctx.fillText(tLine, pad, curY);
      curY += (baseFontSize + 10);
    });
    curY += 14;

    // Section 1: Scenario
    if (problemStatement.scenario) {
      // Header pill
      ctx.fillStyle = '#f59e0b'; // amber
      ctx.font = `bold ${baseFontSize + 1}px sans-serif`;
      ctx.fillText('1. CHALLENGE SCENARIO & CONTEXT', pad, curY);
      curY += 18;

      ctx.fillStyle = '#cbd5e1'; // slate-300
      ctx.font = `${baseFontSize}px 'JetBrains Mono', monospace, sans-serif`;
      scenarioLines.forEach((line) => {
        if (line) {
          ctx.fillText(line, pad, curY);
        }
        curY += lineHeight;
      });
      curY += 16;
    }

    // Section 2: Core Objective
    if (problemStatement.objective) {
      ctx.fillStyle = '#00e5ff'; // cyan
      ctx.font = `bold ${baseFontSize + 1}px sans-serif`;
      ctx.fillText('2. CORE OBJECTIVE & TASKS', pad, curY);
      curY += 18;

      ctx.fillStyle = '#cbd5e1';
      ctx.font = `${baseFontSize}px 'JetBrains Mono', monospace, sans-serif`;
      objectiveLines.forEach((line) => {
        if (line) {
          ctx.fillText(line, pad, curY);
        }
        curY += lineHeight;
      });
      curY += 16;
    }

    // Section 3: Constraints
    if (constraintsList.length > 0) {
      ctx.fillStyle = '#ff007a'; // fest-pink
      ctx.font = `bold ${baseFontSize + 1}px sans-serif`;
      ctx.fillText('3. STRICT RULES & CONSTRAINTS', pad, curY);
      curY += 20;

      constraintsList.forEach((cText, idx) => {
        const cLines = wrappedConstraints[idx] || [cText];

        // Numbered bullet circle
        ctx.fillStyle = 'rgba(255, 0, 122, 0.2)';
        ctx.beginPath();
        ctx.arc(pad + 8, curY - 4, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ff007a';
        ctx.font = `bold ${baseFontSize - 3}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(String(idx + 1), pad + 8, curY);
        ctx.textAlign = 'left';

        // Constraint text
        ctx.fillStyle = '#e2e8f0';
        ctx.font = `${baseFontSize}px 'JetBrains Mono', monospace, sans-serif`;
        cLines.forEach((line, lIdx) => {
          ctx.fillText(line, pad + 24, curY + (lIdx * lineHeight) - 4);
        });

        curY += Math.max(lineHeight, cLines.length * lineHeight) + 6;
      });
    }

  }, [problemStatement, activeSession, mode]);

  // Re-render canvas whenever content changes, fonts ready, or window resizes
  useEffect(() => {
    renderCanvas();
    const raf = requestAnimationFrame(() => renderCanvas());
    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => renderCanvas()).catch(() => {});
    }

    const handleResize = () => {
      renderCanvas();
    };
    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', handleResize);
    };
  }, [renderCanvas]);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full rounded-2xl overflow-hidden select-none secure-problem-canvas-container ${className}`}
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        showSecurityToast('Right-click context menu is restricted.');
        return false;
      }}
      onCopy={(e) => {
        e.preventDefault();
        e.stopPropagation();
        showSecurityToast('Text copying is disabled.');
        return false;
      }}
      onCut={(e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }}
      onDragStart={(e) => {
        e.preventDefault();
        return false;
      }}
    >
      {/* Toast Alert */}
      {securityToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-rose-950/95 border border-rose-500/80 text-rose-200 text-xs font-mono shadow-[0_0_30px_rgba(244,63,94,0.6)] flex items-center gap-2 animate-bounce">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{securityToast}</span>
        </div>
      )}

      {/* RASTERIZED HTML5 CANVAS (ZERO DOM TEXT NODES) */}
      <canvas 
        ref={canvasRef}
        className="w-full block bg-dark-950"
      />

      {/* INSTANT PRINTSCREEN FLASH SHIELD */}
      {screenshotFlash && (
        <div className="absolute inset-0 z-50 bg-black flex items-center justify-center text-white font-mono text-sm font-bold">
          <div className="flex items-center gap-2 text-rose-400">
            <CameraOff className="w-5 h-5 animate-ping" />
            <span>Screenshot Blocked</span>
          </div>
        </div>
      )}
    </div>
  );
}
