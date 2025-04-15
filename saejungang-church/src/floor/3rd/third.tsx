import React from 'react';
import './third.css'; 

const Floor3Page: React.FC = () => {
  return (
    <div className="floor2-container">
      <h1>3층</h1>
      <div className="seats-container">
        <div className="seat">3층 좌석 1</div> 
        <div className="seat">3층 좌석 2</div>
      </div>
    </div>
  );
};

export default Floor3Page;