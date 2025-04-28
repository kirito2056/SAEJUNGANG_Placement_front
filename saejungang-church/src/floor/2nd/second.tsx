// src/floor/2nd/second.tsx
import React from 'react';
import './second.css';
import SecondSeat from './second_seat'; // SecondSeat 컴포넌트 임포트

// Placeholder 컴포넌트 (스타일은 CSS에서 정의)
const SeatPlaceholder: React.FC = () => <div className="seat-placeholder"></div>;

const Floor2Page: React.FC = () => {
  return (
    <div className="floor2-container">
      {/* 강단 등 다른 요소가 필요하면 여기에 추가 */}
      {/* <div className="stage">강단</div> */}
      <div className="second-floor-seats">
        {/* left-section과 right-section을 묶는 컨테이너 */}
        <div className="top-sections">
          {/* ----- 왼쪽 섹션 ----- */}
          <div className="left-section">
            {/* --- 5번 좌석 열 --- */}
            {/*<SeatPlaceholder />*/}
            <div className="seat-column ">
              <SeatPlaceholder />
              <SecondSeat seatNumber="2L-R2-7" />
              <SecondSeat seatNumber="2L-R3-7" />
              <SecondSeat seatNumber="2L-R4-7" />
            </div>
            <div className="seat-column ">
              <SecondSeat seatNumber="2L-R1-6" />
              <SecondSeat seatNumber="2L-R2-6" />
              <SecondSeat seatNumber="2L-R3-6" />
              <SecondSeat seatNumber="2L-R4-6" />
            </div>
            <div className="seat-column ">
              <SecondSeat seatNumber="2L-R1-5" />
              <SecondSeat seatNumber="2L-R2-5" />
              <SecondSeat seatNumber="2L-R3-5" />
              <SecondSeat seatNumber="2L-R4-5" />
            </div>
            {/* --- 4번 좌석 열 --- */}
            <div className="seat-column">
              <SecondSeat seatNumber="2L-R1-4" />
              <SecondSeat seatNumber="2L-R2-4" />
              <SecondSeat seatNumber="2L-R3-4" />
              <SecondSeat seatNumber="2L-R4-4" />
            </div>
            {/* --- 3번 좌석 열 --- */}
            <div className="seat-column">
              <SecondSeat seatNumber="2L-R1-3" />
              <SecondSeat seatNumber="2L-R2-3" />
              <SecondSeat seatNumber="2L-R3-3" />
              <SecondSeat seatNumber="2L-R4-3" />
            </div>
            {/* --- 2번 좌석 열 --- */}
            <div className="seat-column">
              <SeatPlaceholder />              
              <SecondSeat seatNumber="2L-R2-2" />
              <SecondSeat seatNumber="2L-R3-2" />
              <SecondSeat seatNumber="2L-R4-2" />
            </div>
            {/* --- 1번 좌석 열 --- */}
            <div className="seat-column">
              <SeatPlaceholder />              
              <SecondSeat seatNumber="2L-R2-1" />
              <SecondSeat seatNumber="2L-R3-1" />
              <SecondSeat seatNumber="2L-R4-1" />
            </div>
          </div>

          {/* ----- 오른쪽 섹션 ----- */}
          <div className="right-section">
            {/* --- 1번 좌석 열 --- */}
            <div className="seat-column">
              <SeatPlaceholder />              
              <SecondSeat seatNumber="2R-R2-1" />
              <SecondSeat seatNumber="2R-R3-1" />
              <SecondSeat seatNumber="2R-R4-1" />
            </div>
            {/* --- 2번 좌석 열 --- */}
            <div className="seat-column">
              <SeatPlaceholder />              
              <SecondSeat seatNumber="2R-R2-2" />
              <SecondSeat seatNumber="2R-R3-2" />
              <SecondSeat seatNumber="2R-R4-2" />
            </div>
            {/* --- 3번 좌석 열 --- */}
            <div className="seat-column">
              <SecondSeat seatNumber="2R-R1-3" />
              <SecondSeat seatNumber="2R-R2-3" />
              <SecondSeat seatNumber="2R-R3-3" />
              <SecondSeat seatNumber="2R-R4-3" />
            </div>
            {/* --- 4번 좌석 열 --- */}
            <div className="seat-column">
              <SecondSeat seatNumber="2R-R1-4" />
              <SecondSeat seatNumber="2R-R2-4" />
              <SecondSeat seatNumber="2R-R3-4" />
              <SecondSeat seatNumber="2R-R4-4" />
            </div>
            {/* --- 5번 좌석 열 --- */}
            <div className="seat-column">
              <SecondSeat seatNumber="2R-R1-5" />
              <SecondSeat seatNumber="2R-R2-5" />
              <SecondSeat seatNumber="2R-R3-5" />
              <SecondSeat seatNumber="2R-R4-5" />
            </div>
            <div className="seat-column ">
              <SecondSeat seatNumber="2R-R1-6" />
              <SecondSeat seatNumber="2R-R2-6" />
              <SecondSeat seatNumber="2R-R3-6" />
              <SecondSeat seatNumber="2R-R4-6" />
            </div>
            <div className="seat-column ">
              <SeatPlaceholder />              
              <SecondSeat seatNumber="2R-R2-7" />
              <SecondSeat seatNumber="2R-R3-7" />
              <SecondSeat seatNumber="2R-R4-7" />
            </div>
          </div>
        </div>

        {/* ----- 중앙 섹션 ----- */}
        <div className="center-section">
          {/* --- 1번 좌석 열 --- */}
          <div className="seat-column">
            <SecondSeat seatNumber="2C-R1-1" isCenter />
            <SecondSeat seatNumber="2C-R2-1" isCenter />
            <SecondSeat seatNumber="2C-R3-1" isCenter />
            <SecondSeat seatNumber="2C-R4-1" isCenter />
          </div>
          {/* --- 2번 좌석 열 --- */}
          <div className="seat-column">
            <SecondSeat seatNumber="2C-R1-2" isCenter />
            <SecondSeat seatNumber="2C-R2-2" isCenter />
            <SecondSeat seatNumber="2C-R3-2" isCenter />
            <SecondSeat seatNumber="2C-R4-2" isCenter />
          </div>
          {/* --- 3번 좌석 열 --- */}
          <div className="seat-column">
            <SecondSeat seatNumber="2C-R1-3" isCenter />
            <SecondSeat seatNumber="2C-R2-3" isCenter />
            <SecondSeat seatNumber="2C-R3-3" isCenter />
            <SecondSeat seatNumber="2C-R4-3" isCenter />
          </div>
          <div className="seat-column">
            <SecondSeat seatNumber="2C-R1-4" isCenter />
            <SecondSeat seatNumber="2C-R2-4" isCenter />
            <SecondSeat seatNumber="2C-R3-4" isCenter />
            <SecondSeat seatNumber="2C-R4-4" isCenter />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Floor2Page;