// src/floor/1st/first.tsx
import React from 'react';
import Seat from './first_seat';
import './first.css';

const FirstFloor: React.FC = () => {
  const renderSeats = (col: number) => {
    const rows = (col === 1 || col === 6) ? 8 : (col === 3 || col === 4) ? 14 : 13;
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
        <div className="choir">성가대석 (좌)</div>
        <div className="podium">설교단상</div>
        <div className="choir">성가대석 (우)</div>
      </div>
      <div className="seat-group">
        <div className="seat-block seat-block-left">{[1, 2].map(renderSeats)}</div>
        <div className='center-and-right seat-group'>
          <div className="seat-block seat-block-center">{[3, 4].map(renderSeats)}</div>
          <div className="seat-block seat-block-right">{[5, 6].map(renderSeats)}</div>
        </div>
      </div>
    </div>
  );
};

export default FirstFloor;
