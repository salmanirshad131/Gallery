import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  Volume1,
  VolumeX,
  Maximize2,
  Minimize2,
  PictureInPicture,
} from 'lucide-react';
import { formatDuration } from '../utils/formatters';

interface ModernAppleVideoPlayerProps {
  src: string;
  autoPlay?: boolean;
  filterStyle?: string;
  onEnded?: () => void;
}

export const ModernAppleVideoPlayer: React.FC<ModernAppleVideoPlayerProps> = ({
  src,
  autoPlay = true,
  filterStyle,
  onEnded,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrubTrackRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [bufferedTime, setBufferedTime] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number>(0);
  const [centerAction, setCenterAction] = useState<'play' | 'pause' | null>(null);

  // Auto-hide controls after 2.5s of inactivity while playing
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (isPlaying && !isScrubbing) {
      hideTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2500);
    }
  }, [isPlaying, isScrubbing]);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        setCenterAction('play');
        setTimeout(() => setCenterAction(null), 550);
      }).catch(() => {});
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      setCenterAction('pause');
      setTimeout(() => setCenterAction(null), 550);
    }
    resetHideTimer();
  }, [resetHideTimer]);

  const seekRelative = useCallback((deltaSec: number) => {
    if (!videoRef.current) return;
    const newTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + deltaSec));
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    resetHideTimer();
  }, [duration, resetHideTimer]);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
    resetHideTimer();
  }, [isMuted, resetHideTimer]);

  const handleVolumeChange = useCallback((newVol: number) => {
    if (!videoRef.current) return;
    const clamped = Math.max(0, Math.min(1, newVol));
    videoRef.current.volume = clamped;
    setVolume(clamped);
    if (clamped === 0) {
      videoRef.current.muted = true;
      setIsMuted(true);
    } else if (isMuted) {
      videoRef.current.muted = false;
      setIsMuted(false);
    }
    resetHideTimer();
  }, [isMuted, resetHideTimer]);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Ignore fullscreen denial
    }
  }, []);

  const togglePiP = useCallback(async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch {
      // PiP not supported
    }
  }, []);

  // Time & Buffer Tracking
  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current || isScrubbing) return;
    setCurrentTime(videoRef.current.currentTime);

    // Buffer calculation
    if (videoRef.current.buffered.length > 0) {
      for (let i = videoRef.current.buffered.length - 1; i >= 0; i--) {
        if (videoRef.current.buffered.start(i) <= videoRef.current.currentTime) {
          setBufferedTime(videoRef.current.buffered.end(i));
          break;
        }
      }
    }
  }, [isScrubbing]);

  const handleLoadedMetadata = useCallback(() => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration || 0);
    setCurrentTime(videoRef.current.currentTime || 0);
  }, []);

  // Interactive Scrub Bar
  const handleScrubPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!scrubTrackRef.current || !videoRef.current || duration <= 0) return;
    setIsScrubbing(true);
    e.currentTarget.setPointerCapture(e.pointerId);

    const rect = scrubTrackRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = pos * duration;
    videoRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const handleScrubPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!scrubTrackRef.current || duration <= 0) return;
    const rect = scrubTrackRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverTime(pos * duration);
    setHoverPosition(pos * 100);

    if (isScrubbing && videoRef.current) {
      const targetTime = pos * duration;
      videoRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  const handleScrubPointerUp = () => {
    setIsScrubbing(false);
    resetHideTimer();
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        seekRelative(-5);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        seekRelative(5);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleVolumeChange(volume + 0.1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleVolumeChange(volume - 0.1);
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        toggleMute();
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        void toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, seekRelative, handleVolumeChange, volume, toggleMute, toggleFullscreen]);

  // Sync fullscreen change from escape or browser action
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferPercent = duration > 0 ? (bufferedTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="modern-apple-player-wrap relative group w-full h-full flex items-center justify-center select-none overflow-hidden"
      onMouseMove={resetHideTimer}
      onClick={resetHideTimer}
      style={{
        borderRadius: isFullscreen ? 0 : '24px',
        backgroundColor: '#000000',
      }}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        autoPlay={autoPlay}
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          if (onEnded) onEnded();
        }}
        onClick={togglePlay}
        className="max-w-full max-h-full object-contain cursor-pointer"
        style={{
          filter: filterStyle,
          borderRadius: isFullscreen ? 0 : '20px',
        }}
      />

      {/* Large Center Play / Pause Indicator */}
      {centerAction && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="center-action-bubble w-20 h-20 rounded-full bg-black/60 backdrop-blur-2xl border border-white/20 text-white flex items-center justify-center shadow-2xl animate-centerBubble">
            {centerAction === 'play' ? (
              <Play className="w-9 h-9 fill-white translate-x-0.5" />
            ) : (
              <Pause className="w-9 h-9 fill-white" />
            )}
          </div>
        </div>
      )}

      {/* Floating Modern macOS QuickTime Glass HUD */}
      <div
        className={`modern-video-hud absolute bottom-5 left-1/2 -translate-x-1/2 w-[92%] max-w-[680px] z-40 transition-all duration-300 ${
          showControls || !isPlaying || isScrubbing
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <div className="apple-hud-glass px-5 py-3 rounded-2xl flex flex-col gap-2.5">
          {/* Progress Scrubber */}
          <div
            ref={scrubTrackRef}
            className="video-scrub-container relative h-4 flex items-center cursor-pointer group/scrub"
            onPointerDown={handleScrubPointerDown}
            onPointerMove={handleScrubPointerMove}
            onPointerUp={handleScrubPointerUp}
            onPointerLeave={() => setHoverTime(null)}
          >
            {/* Scrubber Background Track */}
            <div className="video-scrub-track w-full h-1.5 group-hover/scrub:h-2.5 rounded-full bg-white/20 backdrop-blur-md relative overflow-hidden transition-all duration-200">
              {/* Buffer Bar */}
              <div
                className="absolute top-0 left-0 bottom-0 bg-white/25 rounded-full transition-all duration-300"
                style={{ width: `${bufferPercent}%` }}
              />
              {/* Played Progress Bar */}
              <div
                className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Scrubber Thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md border border-black/10 scale-0 group-hover/scrub:scale-100 transition-transform duration-150 pointer-events-none"
              style={{ left: `calc(${progressPercent}% - 7px)` }}
            />

            {/* Hover Time Tooltip */}
            {hoverTime !== null && (
              <div
                className="absolute -top-7 -translate-x-1/2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-white/10 text-[11px] font-mono text-white shadow-lg pointer-events-none"
                style={{ left: `${hoverPosition}%` }}
              >
                {formatDuration(hoverTime)}
              </div>
            )}
          </div>

          {/* Controls Bar */}
          <div className="flex items-center justify-between text-white text-[13px]">
            {/* Left Controls: Play/Pause, Rewind, Forward, Time */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={togglePlay}
                className="hud-control-btn w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/15 active:scale-95 transition-all"
                title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-white" />
                ) : (
                  <Play className="w-4 h-4 fill-white translate-x-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => seekRelative(-10)}
                className="hud-control-btn w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/15 active:scale-95 transition-all text-white/80 hover:text-white"
                title="Rewind 10s (Left Arrow)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => seekRelative(10)}
                className="hud-control-btn w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/15 active:scale-95 transition-all text-white/80 hover:text-white"
                title="Forward 10s (Right Arrow)"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>

              <div className="text-[11.5px] font-mono text-white/80 tracking-tight ml-1 font-medium">
                <span>{formatDuration(currentTime)}</span>
                <span className="text-white/40 mx-1">/</span>
                <span>{formatDuration(duration)}</span>
              </div>
            </div>

            {/* Right Controls: Volume Slider, PiP, Fullscreen */}
            <div className="flex items-center gap-2">
              {/* Volume Popout Control */}
              <div className="volume-control-wrap flex items-center gap-1.5 group/vol">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="hud-control-btn w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/15 active:scale-95 transition-all text-white/80 hover:text-white"
                  title="Toggle Mute (M)"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                  ) : volume < 0.5 ? (
                    <Volume1 className="w-3.5 h-3.5" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                </button>

                <div className="w-0 group-hover/vol:w-16 overflow-hidden transition-all duration-200 flex items-center">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                    className="w-16 h-1 bg-white/20 rounded-full accent-blue-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* PiP Button */}
              {document.pictureInPictureEnabled && (
                <button
                  type="button"
                  onClick={togglePiP}
                  className="hud-control-btn w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/15 active:scale-95 transition-all text-white/80 hover:text-white"
                  title="Picture in Picture"
                >
                  <PictureInPicture className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Fullscreen Button */}
              <button
                type="button"
                onClick={toggleFullscreen}
                className="hud-control-btn w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/15 active:scale-95 transition-all text-white/80 hover:text-white"
                title="Toggle Fullscreen (F)"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-3.5 h-3.5" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

