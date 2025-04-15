import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

// 변경된 import 경로 (src/floor 폴더 밑으로 이동)
import Floor1Page from './floor/1st/first'; // first.tsx (Floor1Page 컴포넌트)
import Floor2Page from './floor/2nd/second'; // second.tsx (Floor2Page 컴포넌트)
import Floor3Page from './floor/3rd/third';   // third.tsx (Floor3Page 컴포넌트)
import Floor4Page from './floor/4th/fourth';  // fourth.tsx (Floor4Page 컴포넌트)

import './App.css'; // App.css import 유지

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <div className="floor-buttons">
          <Link to="/floor1">
            <button>1층</button>
          </Link>
          <Link to="/floor2">
            <button>2층</button>
          </Link>
          <Link to="/floor3">
            <button>3층</button>
          </Link>
          <Link to="/floor4">
            <button>4층</button>
          </Link>
        </div>

        <div className="pages-container">
          <Routes>
            <Route path="/floor1" element={<Floor1Page />} />
            <Route path="/floor2" element={<Floor2Page />} />
            <Route path="/floor3" element={<Floor3Page />} />
            <Route path="/floor4" element={<Floor4Page />} />
            <Route path="/" element={<Floor1Page />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;