// src/floor/1st/first_seat.tsx
import React, { forwardRef } from 'react';
import './first_seat.css';

interface SeatProps {
  seatNumber: string;
  onClick?: () => void;
  isSelected?: boolean;
  isReserved?: boolean;
  isDisabled?: boolean;
}

const Seat = forwardRef<HTMLButtonElement, SeatProps>((
  { seatNumber, onClick, isSelected, isReserved, isDisabled }, 
  ref
) => {
  const classNames = [
    'first_seat',
    isSelected ? 'selected' : '',
    isReserved ? 'reserved' : '',
    isDisabled ? 'disabled' : ''
  ].filter(Boolean).join(' ');

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isDisabled) return;
    event.stopPropagation();
    onClick?.();
  };

  return (
    <button
      ref={ref}
      className={classNames}
      onClick={handleClick}
      disabled={isDisabled}
    >
      {seatNumber}
    </button>
  );
});

export default Seat;
