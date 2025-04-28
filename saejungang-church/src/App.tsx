import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Floor1Page from './floor/1st/first'; // Floor1Page import 유지
import Floor2Page from './floor/2nd/second';
import Floor3Page from './floor/3rd/third';
import Floor4Page from './floor/4th/fourth';
import './App.css';
import FloorBase from './floor/base/floorbase';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <div className="floor-buttons">
          {/* 층 버튼 텍스트 수정: 층 이름 대신 층 번호 (또는 아이콘) */}
          <Link to="/floor1">
            <button>1층</button> {/* "1층" 텍스트 유지 or "1" 또는 아이콘으로 변경 */}
          </Link>
          <Link to="/floor2">
            <button>2층</button> {/* "2층" 텍스트 유지 or "2" 또는 아이콘으로 변경 */}
          </Link>
          <Link to="/floor3">
            <button>3층</button> {/* "3층" 텍스트 유지 or "3" 또는 아이콘으로 변경 */}
          </Link>
          <Link to="/floor4">
            <button>4층</button> {/* "4층" 텍스트 유지 or "4" 또는 아이콘으로 변경 */}
          </Link>
        </div>

        <div className="floor-stack-container">
          {/* 1층 페이지를 항상 배경처럼 보여주기 위해 Routes 밖에 배치 */}
          <FloorBase floorName="1층">{<Floor1Page />}</FloorBase>

          <Routes>
            {/* 2층, 3층, 4층 페이지만 Route로 정의 */}
            <Route
              path="/floor2"
              element={<FloorBase floorName="2층" isOverlay={true}>{<Floor2Page />}</FloorBase>} // isOverlay prop 추가 (CSS 스타일링에 사용)
            />
            <Route
              path="/floor3"
              element={<FloorBase floorName="3층" isOverlay={true}>{<Floor3Page />}</FloorBase>} // isOverlay prop 추가
            />
            <Route
              path="/floor4"
              element={<FloorBase floorName="4층" isOverlay={true}>{<Floor4Page />}</FloorBase>} // isOverlay prop 추가
            />
            {/* 기본 경로를 1층 대신 다른 페이지 (예: 메인 페이지) 로 변경하거나, 1층을 Routes 안에 포함시킬 수도 있습니다.
                하지만 현재 요구사항은 1층이 항상 배경처럼 보이는 것이므로, 기본 경로는 삭제하거나 다른 용도로 사용하는 것이 좋습니다. */}
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;