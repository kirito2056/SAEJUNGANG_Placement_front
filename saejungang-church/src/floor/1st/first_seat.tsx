// src/floor/1st/first_seat.tsx
import React from 'react';
import './first_seat.css';

interface SeatProps {
  seatNumber: string;
  onClick?: () => void;
}

const Seat: React.FC<SeatProps> = ({ seatNumber, onClick }) => {
  return (
    <button className="seat" onClick={onClick}>
      {seatNumber}
    </button>
  );
};

export default Seat;
