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

  // WebSocket 연결 및 메시지 처리
  useEffect(() => {
    // const wsUrl = (window.location.protocol === "https:" ? "wss://" : "ws://") + (process.env.REACT_APP_WEBSOCKET_URL || "localhost:8000/ws");
    const wsUrl = (window.location.protocol === "https:" ? "wss://" : "ws://") + ("localhost:8000/ws"); // 직접 사용
    console.log("Attempting to connect to WebSocket:", wsUrl);
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => { /* console.log("WebSocket Connected"); */ };
    ws.current.onclose = () => { /* console.log("WebSocket Disconnected"); */ };
    ws.current.onerror = (error) => console.error("WebSocket Error:", error);

    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data as string);
        if (message.type === "initial_state" || message.type === "reservation_update") {
          const serverData: ServerReservation[] = message.data || [];
          console.log("Processing serverData for groups (from WebSocket message.data):", serverData);
          
          const newGroups: ReservationGroup[] = serverData.map(res => ({
            id: res.id,
            guyok: res.reserved_guyok,
            seats: new Set(res.seats.map(seat => seat.seat_identifier)),
            color: 'rgba(0, 123, 255, 0.6)', // 초기 파란색, 약간 투명하게
            boundingBox: null, 
          }));
          console.log("New groups created (before setting state, from WebSocket):", newGroups);
          setReservationGroups(newGroups);

          const allCurrentlyReserved = new Set<string>();
          serverData.forEach(res => {
            res.seats.forEach(seat => allCurrentlyReserved.add(seat.seat_identifier));
          });
          setReservedSeatsFromServer(allCurrentlyReserved);
          console.log("Updated reservedSeatsFromServer (from WebSocket):", allCurrentlyReserved);

        } else if (message.type === "error") {
          console.error("Server WebSocket Error Message:", message.data);
          alert(`WebSocket Error from Server: ${message.data?.detail || JSON.stringify(message.data) || 'Unknown error'}`);
        }
      } catch (e) {
        console.error("Error processing WebSocket message:", e, "Raw data:", event.data);
        alert(`Error processing WebSocket message. Check console for details. Raw data: ${event.data}`);
      }
    };
    return () => {
      console.log("Closing WebSocket connection");
      ws.current?.close();
    }
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
    const targetElement = event.target as HTMLElement;
    // 클릭된 요소가 좌석 버튼이 아니고, 예약 버튼도 아닌 경우 드래그 시작
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
  }, []); // 의존성 배열 유지

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !startPoint || !containerRef.current) return;

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

  }, [isDragging, startPoint, selectedSeats]); // selectedSeats 추가

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

  // 예약 처리 함수
  const handleReservation = async () => {
    if (selectedSeats.size === 0) {
      alert('예약할 좌석을 선택해주세요.');
      return;
    }
    setIsLoading(true);
    const payload = { reserved_guyok: "1층 선택 구역", seat_identifiers: Array.from(selectedSeats) };
    
    // API URL 구성 수정
    const apiUrlBase = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    const fullApiUrl = `${apiUrlBase}/reservations/`;

    try {
      const response = await fetch(fullApiUrl, { 
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      if (response.status === 201) {
        const newRes = await response.json();
        const seatIds = newRes.seats && Array.isArray(newRes.seats) ? newRes.seats.map((s: any) => s.seat_identifier).join(', ') : Array.from(selectedSeats).join(', ');
        alert(`예약 성공! ID: ${newRes.id}\n좌석: ${seatIds}`);
        setSelectedSeats(new Set());
      } else if (response.status === 409) {
        const errData = await response.json(); alert(`예약 실패: ${errData.detail}`);
      } else {
        // 404 HTML 응답을 더 잘 처리하기 위해 response.text()를 먼저 확인
        const errorText = await response.text();
        try {
          // JSON 에러 메시지인지 확인
          const errorJson = JSON.parse(errorText);
          alert(`예약 오류: ${response.status} ${errorJson.detail || errorText}`);
        } catch (e) {
          // JSON이 아니라면 HTML 또는 일반 텍스트로 표시
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
    console.log(
      "useLayoutEffect for bounding box: Triggered. Groups:", 
      reservationGroups.length, 
      "Seat Refs:", 
      seatRefs.current.size
    );

    if (!containerRef.current) {
      console.log("Bounding box calc: Container ref not ready.");
      return;
    }
    if (reservationGroups.length === 0) {
      console.log("Bounding box calc: No reservation groups to process.");
      return; // 그룹이 없으면 계산할 필요 없음
    }
    if (seatRefs.current.size === 0 && reservationGroups.some(g => g.seats.size > 0)) {
        console.warn("Bounding box calc: Reservation groups exist, but no seat refs available yet. Calculation might be incomplete.");
        // 이 경우, seatRefs가 채워진 후 이 effect가 다시 실행되어야 함
    }

    const cRect = containerRef.current.getBoundingClientRect();
    // console.log("Container Rect for BBox:", cRect); // 이전 로그에서 유지

    setReservationGroups(prevGroups => {
      // console.log("Updating reservation groups for bounding boxes. Seat refs size:", seatRefs.current.size); // 이전 로그에서 유지
      const updatedGroups = prevGroups.map(group => {
        if (group.seats.size === 0) {
          // console.log(`Group ${group.id} (${group.guyok}) has no seats.`); // 이전 로그에서 유지
          return { ...group, boundingBox: null };
        }
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        let seatsFoundCount = 0;

        group.seats.forEach(seatId => {
          const seatEl = seatRefs.current.get(seatId);
          if (seatEl) {
            seatsFoundCount++;
            const seatRect = seatEl.getBoundingClientRect();
            const relTop = seatRect.top - cRect.top;
            const relLeft = seatRect.left - cRect.left;
            minX = Math.min(minX, relLeft);
            minY = Math.min(minY, relTop);
            maxX = Math.max(maxX, relLeft + seatRect.width);
            maxY = Math.max(maxY, relTop + seatRect.height);
          } else {
            // console.log(`Seat element for ID ${seatId} in group ${group.guyok} not found in refs.`);
          }
        });

        if (seatsFoundCount === 0) {
          // console.log(`No seat elements found for group ${group.id} (${group.guyok}).`); // 이전 로그에서 유지
          return { ...group, boundingBox: null };
        }
        const newBoundingBox = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
        // console.log(`Group ${group.id} (${group.guyok}) - Seats found: ${seatsFoundCount}, BBox:`, newBoundingBox); // 이전 로그에서 유지
        // 만약 이전 boundingBox와 같다면 새 객체를 만들지 않는 최적화도 가능하나, 지금은 단순하게 유지
        return { ...group, boundingBox: newBoundingBox };
      });
      
      // Check if actual changes occurred to prevent potential loops if an object reference didn't change
      // This is a shallow check; for deep check, JSON.stringify or a utility function would be needed
      const hasChanged = JSON.stringify(prevGroups.map(g=>g.boundingBox)) !== JSON.stringify(updatedGroups.map(g=>g.boundingBox));
      if(hasChanged){
        console.log("Bounding boxes re-calculated, setting new reservationGroups state.");
        return updatedGroups;
      }
      return prevGroups; // No actual change in bounding boxes
    });
  // 의존성 배열: reservationGroups 객체 배열 자체가 변경되거나 (새 그룹 추가/삭제 등),
  // 그룹 내 좌석 ID 목록이 변경되거나, 좌석 ref의 개수가 변경될 때 실행.
  }, [reservationGroups, seatRefs.current.size]); // reservationGroups 자체를 의존성에 추가 (새 배열 인스턴스일 경우)
                                                // JSON.stringify(...)는 매우 클 수 있으므로, 그룹 객체 자체의 변경을 감지하도록 함.
                                                // reservationGroups.map(g => Array.from(g.seats)).flat() 대신 reservationGroups 자체를 넣음
                                                // React는 배열/객체 참조가 바뀌면 effect를 실행.

  const renderSeats = (col: number) => {
    const rows = (col === 1 || col === 6) ? 10 : (col === 3 || col === 4) ? 15 : 15;
    return (
      <div className="seat-column" key={col}>
        {Array.from({ length: rows }, (_, row) => {
          const seatNumber = `1F-${col}-${row + 1}`; // 좌석 식별자에 "1F-" 접두사 추가
          const isActuallySelected = selectedSeats.has(seatNumber);
          const isReserved = reservedSeatsFromServer.has(seatNumber);
          return (
            <Seat
              key={seatNumber}
              seatNumber={seatNumber} // "1F-X-Y" 형식의 좌석 번호 전달
              ref={(el: HTMLButtonElement | null) => setSeatRef(seatNumber, el)}
              isSelected={isActuallySelected}
              isReserved={isReserved}
              isDisabled={isReserved && !isActuallySelected}
              onClick={() => {
                if (isReserved) return;
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
        if (!group.boundingBox || group.boundingBox.width <= 0 || group.boundingBox.height <= 0) {
          // console.log(`Group ${group.id} (${group.guyok}) boundingBox is null or invalid, not rendering.`); // 너무 많은 로그 유발 가능
          return null;
        }
        const { x, y, width, height } = group.boundingBox;
        console.log(`Rendering group overlay for ${group.guyok} at`, group.boundingBox);
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
            }}
          >
            <span className="reservation-group-name">{group.guyok}</span>
          </div>
        );
      })}

      <div className="stage-container">
        <div className="choir">성가대석 (좌)</div>
        <div className="podium">설교단상</div>
        <div className="choir">성가대석 (우)</div>
      </div>
      <div className="seat-group">
        <div className="seat-block seat-block-left">{[1, 2].map(renderSeats)}</div>
        <div className="seat-block seat-block-center">{[3, 4].map(renderSeats)}</div>
        <div className="seat-block seat-block-right">{[5, 6].map(renderSeats)}</div>
      </div>

      {/* 예약 버튼 추가 */}
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <button 
          className="reservation-button" // 클래스 추가
          onClick={handleReservation} 
          disabled={isLoading || selectedSeats.size === 0} 
          style={{ padding: '10px 20px', fontSize: '1rem' }}
        >
          {isLoading ? '예약 중...' : `선택된 좌석 ${selectedSeats.size}개 예약하기`}
        </button>
      </div>
      {/* 선택된 좌석 목록 표시 (디버깅용) */}
      {/* <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        Selected: {Array.from(selectedSeats).join(', ')}
      </div> */}
    </div>
  );
};

export default FirstFloor;


