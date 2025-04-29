// src/floor/base/floorbase.tsx (수정된 부분)
import React from 'react';
import './floorbase.css';

interface FloorBaseProps {
  children: React.ReactNode;
  floorName: string;
  isOverlay?: boolean; // isOverlay prop 추가 (optional prop)
}

const FloorBase: React.FC<FloorBaseProps> = ({ children, floorName, isOverlay }) => {
  const containerClassName = `floor-base-container ${isOverlay ? 'floor-overlay' : ''}`; // 조건부 클래스 이름
  return (
    <div className={containerClassName}> {/* 수정된 클래스 이름 사용 */}
      <div className="floor-layout">
        {/* 상단 영역: 층 이름 표시 */}
          <h2>{floorName}</h2>

        {/* 좌석 배치 영역 */}
        <div className="seat-layout-container">
          {children}
        </div>
      </div>
    </div>
  );
};

export default FloorBase;