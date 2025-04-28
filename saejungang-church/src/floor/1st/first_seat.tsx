// src/floor/1st/first_seat.tsx
import React, { forwardRef } from 'react';
import './first_seat.css';

interface SeatProps {
  seatNumber: string;
  onClick?: () => void;
  isSelected?: boolean;
}

const Seat = forwardRef<HTMLButtonElement, SeatProps>(({ seatNumber, onClick, isSelected }, ref) => {
  const className = `first_seat ${isSelected ? 'selected' : ''}`;

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onClick?.();
  };

  return (
    <button
      ref={ref}
      className={className}
      onClick={handleClick}
    >
      {seatNumber}
    </button>
  );
});

export default Seat;
