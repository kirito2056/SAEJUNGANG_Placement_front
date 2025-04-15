import React from 'react';
import './fourth.css';

const Floor4Page: React.FC = () => {
  return (
    <div className="floor4-container">
      <h1>2층</h1>
      <div className="seats-container">
        <div className="seat">4층 좌석 1</div>
        <div className="seat">4층 좌석 2</div>
      </div>
    </div>
  );
};

export default Floor4Page;