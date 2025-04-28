// src/floor/2nd/second_seat.tsx
import React from 'react';
import './second_seat.css'; // second_seat.css 임포트

interface SecondSeatProps {
  seatNumber: string;
  isCenter?: boolean; // isCenter prop 추가 (optional)
}

const SecondSeat: React.FC<SecondSeatProps> = ({ seatNumber, isCenter }) => {
  // isCenter 값에 따라 클래스 이름 결정
  const seatClassName = isCenter ? 'second-seat-center' : 'second_seat';

  return (
    <div className={seatClassName}>
      {seatNumber}
    </div>
  );
};

export default SecondSeat;