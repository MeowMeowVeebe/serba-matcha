"use client";

import { useState, useRef, useCallback, useEffect, type ReactNode } from "react";

interface SwipeableCardProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onLongPress?: () => void;
  threshold?: number;
  longPressDelay?: number;
  className?: string;
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onLongPress,
  threshold = 50,
  longPressDelay = 500,
  className = "",
}: SwipeableCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    setTouchEnd(null);
    setIsDragging(true);

    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        onLongPress();
        setIsDragging(false);
      }, longPressDelay);
    }
  }, [onLongPress, longPressDelay]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStart) return;

    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    setTouchEnd({ x: currentX, y: currentY });
    setOffset({
      x: (currentX - touchStart.x) * 0.5,
      y: (currentY - touchStart.y) * 0.3,
    });
  }, [touchStart]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (!touchStart || !touchEnd) {
      setIsDragging(false);
      setOffset({ x: 0, y: 0 });
      return;
    }

    const distanceX = touchEnd.x - touchStart.x;
    const distanceY = touchEnd.y - touchStart.y;
    const absX = Math.abs(distanceX);
    const absY = Math.abs(distanceY);

    if (absX > absY && absX > threshold) {
      if (distanceX > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    } else if (absY > absX && absY > threshold) {
      if (distanceY > 0) {
        onSwipeDown?.();
      } else {
        onSwipeUp?.();
      }
    }

    setIsDragging(false);
    setOffset({ x: 0, y: 0 });
    setTouchStart(null);
    setTouchEnd(null);
  }, [touchStart, touchEnd, threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  return (
    <div
      ref={cardRef}
      className={`swipeable-card ${isDragging ? "swipeable-card--dragging" : ""} ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px) rotate(${offset.x * 0.05}deg)`,
        transition: isDragging ? "none" : "transform 0.3s ease-out",
      }}
    >
      {children}
      {isDragging && Math.abs(offset.x) > 20 && (
        <div className={`swipe-indicator ${offset.x > 0 ? "swipe-indicator--right" : "swipe-indicator--left"}`}>
          {offset.x > 0 ? "→" : "←"}
        </div>
      )}
    </div>
  );
}

// Swipeable Card Stack
interface CardStackProps {
  cards: ReactNode[];
  onCardSwipe?: (index: number, direction: "left" | "right") => void;
  className?: string;
}

export function SwipeableCardStack({ cards, onCardSwipe, className = "" }: CardStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(null);

  const handleSwipe = useCallback((direction: "left" | "right") => {
    setExitDirection(direction);
    onCardSwipe?.(currentIndex, direction);
    
    setTimeout(() => {
      setCurrentIndex(prev => Math.min(prev + 1, cards.length - 1));
      setExitDirection(null);
    }, 300);
  }, [currentIndex, cards.length, onCardSwipe]);

  return (
    <div className={`card-stack ${className}`}>
      {cards.slice(currentIndex, currentIndex + 3).map((card, i) => (
        <div
          key={currentIndex + i}
          className={`card-stack__card ${i === 0 && exitDirection ? `card-stack__card--exit-${exitDirection}` : ""}`}
          style={{
            zIndex: 3 - i,
            transform: `scale(${1 - i * 0.05}) translateY(${i * 10}px)`,
            opacity: 1 - i * 0.2,
          }}
        >
          {i === 0 ? (
            <SwipeableCard
              onSwipeLeft={() => handleSwipe("left")}
              onSwipeRight={() => handleSwipe("right")}
            >
              {card}
            </SwipeableCard>
          ) : (
            card
          )}
        </div>
      ))}
      <div className="card-stack__counter">
        {currentIndex + 1} / {cards.length}
      </div>
    </div>
  );
}

// Pull to Refresh
interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  className?: string;
}

export function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  className = "",
}: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY === 0 || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY;
    
    if (diff > 0 && containerRef.current?.scrollTop === 0) {
      setPullDistance(Math.min(diff * 0.5, threshold * 1.5));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold * 0.6);
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
    setStartY(0);
  };

  const progress = Math.min(pullDistance / threshold, 1);

  return (
    <div
      ref={containerRef}
      className={`pull-to-refresh ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="pull-to-refresh__indicator"
        style={{
          height: pullDistance,
          opacity: progress,
        }}
      >
        <div
          className={`pull-to-refresh__spinner ${isRefreshing ? "pull-to-refresh__spinner--active" : ""}`}
          style={{ transform: `rotate(${progress * 360}deg)` }}
        >
          {isRefreshing ? "↻" : "↓"}
        </div>
        <span>{isRefreshing ? "Refreshing..." : progress >= 1 ? "Release to refresh" : "Pull to refresh"}</span>
      </div>
      <div
        className="pull-to-refresh__content"
        style={{ transform: `translateY(${pullDistance}px)` }}
      >
        {children}
      </div>
    </div>
  );
}

// Pinch to Zoom
interface PinchZoomProps {
  children: ReactNode;
  minScale?: number;
  maxScale?: number;
  className?: string;
}

export function PinchZoom({
  children,
  minScale = 1,
  maxScale = 4,
  className = "",
}: PinchZoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const initialDistance = useRef(0);
  const initialScale = useRef(1);

  const getDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      initialDistance.current = getDistance(e.touches);
      initialScale.current = scale;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const currentDistance = getDistance(e.touches);
      const scaleChange = currentDistance / initialDistance.current;
      const newScale = Math.max(minScale, Math.min(maxScale, initialScale.current * scaleChange));
      setScale(newScale);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (scale > 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(2);
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setPosition({
          x: (rect.width / 2 - e.clientX + rect.left) * 0.5,
          y: (rect.height / 2 - e.clientY + rect.top) * 0.5,
        });
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`pinch-zoom ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onDoubleClick={handleDoubleClick}
    >
      <div
        className="pinch-zoom__content"
        style={{
          transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
          transition: "transform 0.2s ease-out",
        }}
      >
        {children}
      </div>
      {scale > 1 && (
        <button
          className="pinch-zoom__reset"
          onClick={() => {
            setScale(1);
            setPosition({ x: 0, y: 0 });
          }}
        >
          Reset Zoom
        </button>
      )}
    </div>
  );
}
