
import React from 'react';

interface SocketProps {
  id: string;
  side: 'left' | 'right';
  isDragging: boolean;
  onMouseDown: (side: 'left' | 'right', e: React.MouseEvent) => void;
  onMouseEnter: (side: 'left' | 'right') => void;
  onMouseLeave: () => void;
}

const Socket: React.FC<SocketProps> = ({ id, side, isDragging, onMouseDown, onMouseEnter, onMouseLeave }) => {
  return (
    <div
      id={id}
      data-socket={side}
      onMouseDown={(e) => onMouseDown(side, e)}
      onMouseEnter={() => onMouseEnter(side)}
      onMouseLeave={onMouseLeave}
      className={`relative w-8 h-8 flex items-center justify-center z-30 cursor-crosshair group/socket pointer-events-auto`}
    >
      <div className={`
        w-3.5 h-3.5 bg-slate-900 border-2 border-slate-500 rounded-full transition-all duration-200
        group-hover/socket:scale-125 group-hover/socket:border-primary
        ${isDragging ? 'ring-4 ring-primary/20 scale-110 border-primary shadow-[0_0_8px_rgba(19,91,236,0.4)]' : 'shadow-lg'}
      `} />
    </div>
  );
};

export default Socket;
