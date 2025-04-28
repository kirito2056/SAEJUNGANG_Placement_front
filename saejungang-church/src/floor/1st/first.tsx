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

  // 좌석 ref를 Map에 저장하는 함수 (el 타입 명시)
  const setSeatRef = (seatNumber: string, element: HTMLButtonElement | null) => {
    if (element) {
      seatRefs.current.set(seatNumber, element);
    } else {
      seatRefs.current.delete(seatNumber);
    }
  };

  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    // 클릭된 요소가 좌석 버튼이 아닌 경우 드래그 시작
    if (!(event.target as HTMLElement).closest('.first_seat')) {
      setIsDragging(true);
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (containerRect) {
          const x = event.clientX - containerRect.left;
          const y = event.clientY - containerRect.top;
          setStartPoint({ x, y });
          setSelectionBox({ x, y, width: 0, height: 0 }); // 초기 선택 상자 설정
          // Shift 키를 누르지 않았다면 기존 선택 해제
          if (!event.shiftKey) {
            setSelectedSeats(new Set());
          }
      }
    }
    // 좌석을 클릭한 경우는 Seat 컴포넌트의 onClick에서 처리 (stopPropagation으로 인해 여기까지 오지 않음)
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


  const renderSeats = (col: number) => {
    const rows = (col === 1 || col === 6) ? 10 : (col === 3 || col === 4) ? 15 : 15;
    return (
      <div className="seat-column" key={col}>
        {Array.from({ length: rows }, (_, row) => {
          const seatNumber = `${col}-${row + 1}`;
          return (
            <Seat
              key={seatNumber}
              seatNumber={seatNumber}
              // ref를 설정하는 함수 전달 (타입 문제 해결됨)
              ref={(el: HTMLButtonElement | null) => setSeatRef(seatNumber, el)}
              // 선택 상태 전달
              isSelected={selectedSeats.has(seatNumber)}
              // 클릭 이벤트 핸들러 (개별 좌석 클릭 시 선택 토글)
              onClick={() => {
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
    </div>
  );
};

export default FirstFloor;
