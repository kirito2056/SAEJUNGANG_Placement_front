import React from 'react';
import './second.css';

const Floor2Page: React.FC = () => {
  return (
    <div className="floor2-container">
      <h1>2층</h1>
      <div className="seats-container">
        <div className="seat">2층 좌석 1</div>
        <div className="seat">2층 좌석 2</div>
      </div>
    </div>
  );
};

export default Floor2Page;