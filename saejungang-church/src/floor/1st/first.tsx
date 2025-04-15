import React from 'react';
import './first.css';

const Floor1Page: React.FC = () => {
  return (
    <div>
      <h1>1층</h1>
      <div className="floor-1-layout">
        <div className="stage">
          <div className="stage-choir">성가대석</div>
          <div className="stage-pulpit">설교단상</div>
        </div>
        <div className="seats-container-1f">
          <div className="seat-section">
            <div className="seat">좌석 1-1</div>
            <div className="seat">좌석 1-2</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Floor1Page;