// src/floor/1st/first.tsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
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

const FirstFloor: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set());
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null); // 컨테이너 ref
  const seatRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map()); // 좌석 ref들을 저장할 Map
  const [reservedSeatsFromServer, setReservedSeatsFromServer] = useState<Set<string>>(new Set()); // 서버로부터 받은 예약된 좌석
  const [isLoading, setIsLoading] = useState(false); // 로딩 상태

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
    const handleMouseLeave = (event: MouseEvent) => {
        // 마우스 버튼이 눌린 상태에서 벗어났는지 확인
        if (isDragging && (event.buttons & 1)) { // 1은 왼쪽 버튼
             handleMouseUp();
        }
    };

    const currentContainer = containerRef.current;
    // window 이벤트 리스너 추가 (컨테이너 밖에서 mouseup 발생 시)
    window.addEventListener('mouseup', handleMouseUp);
    // 컨테이너 이탈 시 핸들러 추가 (선택사항, 좀 더 부드러운 UX 위해)
    currentContainer?.addEventListener('mouseleave', handleMouseLeave);


    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      currentContainer?.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isDragging, handleMouseUp]); // isDragging, handleMouseUp 의존성 추가

  // 예약 처리 함수
  const handleReservation = async () => {
    if (selectedSeats.size === 0) {
      alert('예약할 좌석을 선택해주세요.');
      return;
    }

    setIsLoading(true);
    const payload = {
      reserved_guyok: "1층 선택 구역", // Placeholder 구역 이름
      seat_identifiers: Array.from(selectedSeats), // 좌석 식별자는 이미 1F-X-Y 형식
    };

    try {
      const response = await fetch('http://localhost:8000/reservations/', { // FastAPI 주소 확인 필요
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 201) {
        const newReservation = await response.json();
        // API 응답의 seat_identifier가 올바른 형식인지 확인 (Pydantic 모델에 따라 다를 수 있음)
        const reservedSeatIds = newReservation.seats && Array.isArray(newReservation.seats) 
                               ? newReservation.seats.map((s: any) => s.seat_identifier).join(', ') 
                               : Array.from(selectedSeats).join(', '); // fallback
        alert(`예약 성공! 예약 ID: ${newReservation.id}\n좌석: ${reservedSeatIds}`);
        setSelectedSeats(new Set());
      } else if (response.status === 409) {
        const errorData = await response.json();
        alert(`예약 실패: ${errorData.detail}`);
      } else {
        const errorText = await response.text();
        alert(`예약 처리 중 오류가 발생했습니다: ${response.status} ${errorText}`);
      }
    } catch (error) {
      console.error("Reservation error:", error);
      alert('네트워크 오류 또는 서버 문제로 예약에 실패했습니다.');
    }
    setIsLoading(false);
  };

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
