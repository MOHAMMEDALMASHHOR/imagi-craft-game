import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface PuzzlePieceProps {
  id: number;
  correctIndex: number;
  currentIndex: number;
  image: string;
  gridSize: { rows: number; cols: number };
  isSelected: boolean;
  isDragging: boolean;
  canDrop: boolean;
  onClick: () => void;
  onDragStart: (id: number, clientX: number, clientY: number) => void;
  onDragMove: (clientX: number, clientY: number) => void;
  onDragEnd: () => void;
  onDrop: (targetIndex: number) => void;
  className?: string;
}

export function PuzzlePiece({
  id,
  correctIndex,
  currentIndex,
  image,
  gridSize,
  isSelected,
  isDragging,
  canDrop,
  onClick,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDrop,
  className,
}: PuzzlePieceProps) {
  const pieceRef = useRef<HTMLDivElement>(null);
  const [isPressed, setIsPressed] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const getPieceStyle = () => {
    const col = correctIndex % gridSize.cols;
    const row = Math.floor(correctIndex / gridSize.cols);
    const percentX = (col * 100) / (gridSize.cols - 1);
    const percentY = (row * 100) / (gridSize.rows - 1);

    return {
      backgroundImage: `url(${image})`,
      backgroundPosition: `${percentX}% ${percentY}%`,
      backgroundSize: `${gridSize.cols * 100}% ${gridSize.rows * 100}%`,
    };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    setIsPressed(true);

    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }

    const rect = pieceRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      });
    }

    onDragStart(id, touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    onDragMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsPressed(false);
    onDragEnd();

    // Check if dropped on a valid target
    const touch = e.changedTouches[0];
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);

    if (elementBelow && elementBelow instanceof HTMLElement) {
      const targetIndex = parseInt(elementBelow.dataset.index || '');
      if (!isNaN(targetIndex) && targetIndex !== currentIndex) {
        onDrop(targetIndex);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = pieceRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
    onDragStart(id, e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      onDragMove(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    onDragEnd();
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        onDragMove(e.clientX, e.clientY);
      }
    };

    const handleGlobalMouseUp = () => {
      onDragEnd();
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, onDragMove, onDragEnd]);

  return (
    <div
      ref={pieceRef}
      data-index={currentIndex}
      className={cn(
        "aspect-square cursor-pointer transition-all duration-200 rounded-md touch-manipulation",
        "relative overflow-hidden",
        "min-h-[48px] min-w-[48px]",
        {
          "ring-4 ring-primary shadow-lg shadow-primary/50 scale-105 z-10": isSelected,
          "ring-2 ring-success shadow-success/50": correctIndex === currentIndex && !isSelected,
          "ring-2 ring-accent shadow-md scale-102 hover:ring-accent/70": !isSelected && !isDragging && correctIndex !== currentIndex,
          "opacity-50 scale-95": isDragging,
          "ring-4 ring-success animate-pulse": canDrop,
          "active:scale-95": isPressed,
        },
        className
      )}
      style={getPieceStyle()}
      onClick={onClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Piece overlay for visual feedback */}
      <div className={cn(
        "absolute inset-0 pointer-events-none transition-opacity duration-200",
        "bg-gradient-to-br from-transparent to-black/5",
        {
          "opacity-0": !isPressed,
          "opacity-100": isPressed,
        }
      )} />

      {/* Drag indicator for mobile */}
      {isSelected && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
          <div className="absolute bottom-1 left-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );
}

export default PuzzlePiece;