// src/floor/1st/first.tsx
import React from 'react';
import Seat from './first_seat';
import './first.css';

const FirstFloor: React.FC = () => {
  const renderSeats = (col: number) => {
    const rows = (col === 1 || col === 6) ? 10 : (col === 3 || col === 4) ? 15 : 14;
    return (
      <div className="seat-column" key={col}>
        {Array.from({ length: rows }, (_, row) => {
          const seatNumber = `${col}-${row + 1}`;
          return <Seat key={seatNumber} seatNumber={seatNumber} />;
        })}
      </div>
    );
  };

  return (
    <div className="first-floor-container">
      <div className="stage-container">
        <div className="choir">TARGET 2030</div>
        <div className="podium">설교단상</div>
        <div className="choir">가서 제자 삼으라</div>
      </div>
      <div className="seat-group">
        <div className="seat-block seat-block-left">{[1, 2].map(renderSeats)}</div>
        <div className="seat-block seat-block-center">{[3, 4].map(renderSeats)}</div>
        <div className="seat-block seat-block-right">{[5, 6].map(renderSeats)}</div>
      </div>
    </div>
  );
};

export default FirstFloor;
