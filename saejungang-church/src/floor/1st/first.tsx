// src/floor/1st/first.tsx
import React, { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import Seat from './first_seat';
import './first.css';

// 드래그 영역 스타일을 위한 임시 컴포넌트
const SelectionBoxComponent: React.FC<{ box: { x: number; y: number; width: number; height: number } | null }> = ({ box }) => {
  if (!box) return null;
  const style: React.CSSProperties = {
    border: '1px dashed #007bff',
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
    position: 'absolute',
    left: `${box.x}px`,
    top: `${box.y}px`,
    width: `${box.width}px`,
    height: `${box.height}px`,
    pointerEvents: 'none', // 드래그 영역이 마우스 이벤트를 가로채지 않도록 설정
    zIndex: 10, // 다른 요소 위에 보이도록 설정
  };
  return <div style={style} />;
};

// 구역명 입력 모달 컴포넌트
const GuyokInputModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (guyok: string) => void;
  selectedSeatsCount: number;
}> = ({ isOpen, onClose, onSubmit, selectedSeatsCount }) => {
  const [guyok, setGuyok] = useState('');

  // 모달이 닫힐 때 입력값 초기화
  useEffect(() => {
    if (!isOpen) {
      setGuyok('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>구역명 입력</h3>
        <p>선택된 좌석 수: {selectedSeatsCount}개</p>
        <input
          type="text"
          value={guyok}
          onChange={(e) => setGuyok(e.target.value)}
          placeholder="구역명을 입력하세요"
          className="guyok-input"
        />
        <div className="modal-buttons">
          <button onClick={() => onSubmit(guyok)} className="submit-button">
            예약하기
          </button>
          <button onClick={onClose} className="cancel-button">
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

// --- 타입 정의 --- 
interface ServerReservationSeat {
  id: number | string; // 백엔드 seat 테이블의 ID (있다면)
  seat_identifier: string;
}

interface ServerReservation {
  id: number | string; // 백엔드 reservation 테이블의 ID
  reserved_guyok: string;
  seats: ServerReservationSeat[];
  // user_id 등 다른 정보가 있다면 추가 가능
}

interface ReservationGroup {
  id: number | string;
  guyok: string;
  seats: Set<string>;
  color: string; 
  boundingBox: { x: number; y: number; width: number; height: number } | null;
  rotationAngle?: number; // 회전 각도 추가
}

const FirstFloor: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set());
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const seatRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map());
  
  const [isLoading, setIsLoading] = useState(false);
  // reservedSeatsFromServer는 개별 좌석의 예약 여부를 빠르게 확인하기 위해 유지 (isReserved, isDisabled prop에 사용)
  const [reservedSeatsFromServer, setReservedSeatsFromServer] = useState<Set<string>>(new Set());
  // reservationGroups는 그룹 사각형을 그리기 위한 주 데이터
  const [reservationGroups, setReservationGroups] = useState<ReservationGroup[]>([]); 
  const ws = useRef<WebSocket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // WebSocket 연결 및 메시지 처리
  useEffect(() => {
    const wsUrl = (window.location.protocol === "https:" ? "wss://" : "ws://") + ("localhost:8000/ws");
    ws.current = new WebSocket(wsUrl);
    ws.current.onopen = () => { /* console.log("WebSocket Connected"); */ };
    ws.current.onclose = () => { /* console.log("WebSocket Disconnected"); */ };
    ws.current.onerror = (error) => console.error("WebSocket Error:", error);

    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data as string);
        if (message.type === "initial_state" || message.type === "reservation_update") {
          const serverData: ServerReservation[] = message.data || [];
          const newGroups: ReservationGroup[] = serverData.map(res => ({
            id: res.id,
            guyok: res.reserved_guyok,
            seats: new Set(res.seats.map(seat => seat.seat_identifier)),
            color: 'rgba(0, 123, 255, 0.6)',
            boundingBox: null,
            rotationAngle: 0,
          }));
          setReservationGroups(newGroups);
          const allCurrentlyReserved = new Set<string>();
          serverData.forEach(res => {
            res.seats.forEach(seat => allCurrentlyReserved.add(seat.seat_identifier));
          });
          setReservedSeatsFromServer(allCurrentlyReserved);
        } else if (message.type === "error") {
          console.error("Server WebSocket Error Message:", message.data);
          alert(`WebSocket Error from Server: ${message.data?.detail || JSON.stringify(message.data) || 'Unknown error'}`);
        }
      } catch (e) {
        console.error("Error processing WebSocket message:", e, "Raw data:", event.data);
        alert(`Error processing WebSocket message. Check console. Raw data: ${event.data}`);
      }
    };
    return () => ws.current?.close();
  }, []);

  // 좌석 ref를 Map에 저장하는 함수 (el 타입 명시)
  const setSeatRef = (seatNumber: string, element: HTMLButtonElement | null) => {
    if (element) {
      seatRefs.current.set(seatNumber, element);
    } else {
      seatRefs.current.delete(seatNumber);
    }
  };

  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    // 모달이 열려있을 때는 드래그 시작하지 않음
    if (isModalOpen) return;

    const targetElement = event.target as HTMLElement;
    if (!targetElement.closest('.first_seat') && !targetElement.closest('.reservation-button')) {
      setIsDragging(true);
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (containerRect) {
          const x = event.clientX - containerRect.left;
          const y = event.clientY - containerRect.top;
          setStartPoint({ x, y });
          setSelectionBox({ x, y, width: 0, height: 0 });
          if (!event.shiftKey) {
            setSelectedSeats(new Set());
          }
      }
    }
  }, [isModalOpen]); // isModalOpen 의존성 추가

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    // 모달이 열려있을 때는 드래그 동작 중지
    if (isModalOpen || !isDragging || !startPoint || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const currentX = event.clientX - containerRect.left;
    const currentY = event.clientY - containerRect.top;

    const x = Math.min(startPoint.x, currentX);
    const y = Math.min(startPoint.y, currentY);
    const width = Math.abs(startPoint.x - currentX);
    const height = Math.abs(startPoint.y - currentY);

    setSelectionBox({ x, y, width, height });

    // 영역 내 좌석 선택 로직 (다음 단계에서 구현)
    const currentSelected = new Set<string>(event.shiftKey ? selectedSeats : new Set()); // Shift 키 누르면 기존 선택 유지
    seatRefs.current.forEach((seatEl, seatNumber) => {
        if (seatEl) {
            const seatRect = seatEl.getBoundingClientRect();
            const selectionRect = {
                left: containerRect.left + x,
                top: containerRect.top + y,
                right: containerRect.left + x + width,
                bottom: containerRect.top + y + height,
            };

            // 좌석이 선택 영역과 겹치는지 확인
            const isOverlapping = !(
                seatRect.right < selectionRect.left ||
                seatRect.left > selectionRect.right ||
                seatRect.bottom < selectionRect.top ||
                seatRect.top > selectionRect.bottom
            );

            if (isOverlapping) {
                currentSelected.add(seatNumber);
            } else if (!event.shiftKey) { // Shift 키 안 눌렀으면 영역 밖 좌석 선택 해제
                // currentSelected.delete(seatNumber); // 이 로직은 Shift 키 동작과 함께 고려 필요
            }
        }
    });
    setSelectedSeats(currentSelected); // 임시 선택 상태 업데이트 (MouseUp에서 최종 확정)

  }, [isDragging, startPoint, selectedSeats, isModalOpen]); // isModalOpen 의존성 추가

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setStartPoint(null);
      setSelectionBox(null);
      // 최종 선택 상태는 이미 handleMouseMove에서 업데이트 되었으므로 여기서는 상태 초기화만 수행
    }
  }, [isDragging]);

  // 마우스가 컨테이너 밖으로 나가거나 브라우저 창을 벗어날 때 드래그 종료 처리
  useEffect(() => {
    const handleGlobalMouseUp = () => { if (isDragging) handleMouseUp(); };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging, handleMouseUp]); // isDragging, handleMouseUp 의존성 추가

  // 예약 처리 함수 수정
  const handleReservation = async (guyok: string) => {
    if (selectedSeats.size === 0) {
      alert('예약할 좌석을 선택해주세요.');
      return;
    }
    if (!guyok.trim()) {
      alert('구역명을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    const payload = { reserved_guyok: guyok, seat_identifiers: Array.from(selectedSeats) };
    
    const apiUrlBase = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    const fullApiUrl = `${apiUrlBase}/reservations/`;

    try {
      const response = await fetch(fullApiUrl, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload)
      });
      if (response.status === 201) {
        const newRes = await response.json();
        const seatIds = newRes.seats && Array.isArray(newRes.seats) ? newRes.seats.map((s: any) => s.seat_identifier).join(', ') : Array.from(selectedSeats).join(', ');
        alert(`예약 성공! ID: ${newRes.id}\n좌석: ${seatIds}`);
        setSelectedSeats(new Set());
        setIsModalOpen(false);
      } else if (response.status === 409) {
        const errData = await response.json(); 
        alert(`예약 실패: ${errData.detail}`);
      } else {
        const errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          alert(`예약 오류: ${response.status} ${errorJson.detail || errorText}`);
        } catch (e) {
          alert(`예약 오류: ${response.status} - 서버 응답을 확인해주세요.\n${errorText.substring(0, 200)}...`); 
        }
      }
    } catch (error) { 
      const errorMessage = error instanceof Error ? error.message : '네트워크/서버 오류로 예약 실패';
      alert(errorMessage);
      console.error("Reservation error:", error);
    }
    setIsLoading(false);
  };

  // 예약 그룹 Bounding Box 계산 (useLayoutEffect 사용)
  useLayoutEffect(() => {
    if (!containerRef.current || reservationGroups.length === 0) return;

    const cRect = containerRef.current.getBoundingClientRect();
    setReservationGroups(prevGroups => {
      const updatedGroups = prevGroups.map(group => {
        if (group.seats.size === 0) return { ...group, boundingBox: null, rotationAngle: 0 };
        
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        let seatsFoundCount = 0;
        const groupColumns = new Set<number>();

        group.seats.forEach(seatId => {
          const seatEl = seatRefs.current.get(seatId);
          const parts = seatId.split('-');
          if (parts.length === 3) {
            const col = parseInt(parts[1], 10);
            if (!isNaN(col)) {
              groupColumns.add(col);
            }
          }
          if (seatEl) {
            seatsFoundCount++;
            const seatRect = seatEl.getBoundingClientRect();
            const relTop = seatRect.top - cRect.top;
            const relLeft = seatRect.left - cRect.left;
            minX = Math.min(minX, relLeft);
            minY = Math.min(minY, relTop);
            maxX = Math.max(maxX, relLeft + seatRect.width);
            maxY = Math.max(maxY, relTop + seatRect.height);
          }
        });

        if (seatsFoundCount === 0) return { ...group, boundingBox: null, rotationAngle: 0 };
        
        const newBoundingBox = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
        
        let newRotationAngle = 0;
        const colsArray = Array.from(groupColumns);

        if (colsArray.length > 0) {
          const hasLeft = colsArray.some(col => col === 1 || col === 2);
          const hasCenter = colsArray.some(col => col === 3 || col === 4);
          const hasRight = colsArray.some(col => col === 5 || col === 6);

          const definedAngles: number[] = [];
          if (hasLeft) definedAngles.push(2);    // 왼쪽 블록 각도
          if (hasCenter) definedAngles.push(0);  // 중앙 블록 각도
          if (hasRight) definedAngles.push(-2);   // 오른쪽 블록 각도

          if (definedAngles.length > 0) {
            // 그룹이 하나의 블록 유형에만 속하는 경우 (가장 일반적인 경우 먼저 처리)
            if (hasLeft && !hasCenter && !hasRight) {
              newRotationAngle = 2;
            } else if (!hasLeft && hasCenter && !hasRight) {
              newRotationAngle = 0;
            } else if (!hasLeft && !hasCenter && hasRight) {
              newRotationAngle = -2;
            } else {
              // 두 개 이상의 블록 유형에 걸쳐 있는 경우, 해당 블록 각도들의 평균 계산
              let sumOfAngles = 0;
              let countOfAngleTypes = 0;
              if (hasLeft) { sumOfAngles += 2; countOfAngleTypes++; }
              if (hasCenter) { sumOfAngles += 0; countOfAngleTypes++; }
              if (hasRight) { sumOfAngles += -2; countOfAngleTypes++; }
              
              if (countOfAngleTypes > 0) {
                newRotationAngle = sumOfAngles / countOfAngleTypes;
              }
            }
          }
        }
        return { ...group, boundingBox: newBoundingBox, rotationAngle: newRotationAngle };
      });

      const boundingBoxesChanged = JSON.stringify(prevGroups.map(g=>g.boundingBox)) !== JSON.stringify(updatedGroups.map(g=>g.boundingBox));
      const rotationsChanged = JSON.stringify(prevGroups.map(g=>g.rotationAngle)) !== JSON.stringify(updatedGroups.map(g=>g.rotationAngle));
      
      if(boundingBoxesChanged || rotationsChanged) return updatedGroups;
      return prevGroups;
    });
  }, [reservationGroups, seatRefs.current.size]);

  const renderSeats = (col: number) => {
    const rows = (col === 1 || col === 6) ? 10 : (col === 3 || col === 4) ? 15 : 15;
    return (
      <div className="seat-column" key={col}>
        {Array.from({ length: rows }, (_, row) => {
          const seatNumber = `1F-${col}-${row + 1}`;
          const isActuallySelected = selectedSeats.has(seatNumber);
          const isReserved = reservedSeatsFromServer.has(seatNumber);
          return (
            <Seat
              key={seatNumber}
              seatNumber={seatNumber}
              ref={(el: HTMLButtonElement | null) => setSeatRef(seatNumber, el)}
              isSelected={isActuallySelected}
              isReserved={isReserved}
              isDisabled={isReserved && !isActuallySelected || isModalOpen} // 모달이 열려있을 때도 비활성화
              onClick={() => {
                if (isReserved || isModalOpen) return; // 모달이 열려있을 때는 클릭 무시
                setSelectedSeats(prevSelected => {
                    const newSelected = new Set(prevSelected);
                    if (newSelected.has(seatNumber)) {
                        newSelected.delete(seatNumber);
                    } else {
                        newSelected.add(seatNumber);
                    }
                    return newSelected;
                });
              }}
            />
          );
        })}
      </div>
    );
  };

  return (
    // 컨테이너에 ref와 이벤트 핸들러 연결
    <div
      // isDragging 상태에 따라 dragging 클래스 추가
      className={`first-floor-container ${isDragging ? 'dragging' : ''}`}
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp} // 컨테이너 내에서 mouseup 처리
      style={{ position: 'relative' }} // userSelect: 'none' 제거
    >
      {/* 드래그 영역 표시 컴포넌트 */}
      <SelectionBoxComponent box={selectionBox} />

      {/* 예약 그룹 사각형들 렌더링 */}
      {reservationGroups.map(group => {
        if (!group.boundingBox || group.boundingBox.width <= 0 || group.boundingBox.height <= 0) return null;
        const { x, y, width, height } = group.boundingBox;
        const rotationStyle = group.rotationAngle ? { transform: `rotate(${group.rotationAngle}deg)` } : {};
        return (
          <div
            key={`group-${group.id}`}
            className="reservation-group-overlay"
            style={{
              left: `${x}px`,
              top: `${y}px`,
              width: `${width}px`,
              height: `${height}px`,
              backgroundColor: group.color,
              ...rotationStyle, 
            }}
          >
            <span className="reservation-group-name">{group.guyok}</span>
          </div>
        );
      })}

      <div className="stage-container">
        <div className="choir">TARGET 2030</div>
        <div className="podium">설교단상</div>
        <div className="choir">가서 제자 삼으라</div>
      </div>
      <div className="seat-group">
        <div className="seat-block seat-block-left">{[1, 2].map(renderSeats)}</div>
        <div className="seat-block seat-block-center">{[3, 4].map(renderSeats)}</div>
        <div className="seat-block seat-block-right">{[5, 6].map(renderSeats)}</div>
      </div>

      {/* 예약 버튼 추가 */}
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <button 
          className="reservation-button"
          onClick={() => setIsModalOpen(true)} 
          disabled={isLoading || selectedSeats.size === 0} 
          style={{ padding: '10px 20px', fontSize: '1rem' }}
        >
          {isLoading ? '예약 중...' : `선택된 좌석 ${selectedSeats.size}개 예약하기`}
        </button>
      </div>

      <GuyokInputModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleReservation}
        selectedSeatsCount={selectedSeats.size}
      />
    </div>
  );
};

export default FirstFloor;


