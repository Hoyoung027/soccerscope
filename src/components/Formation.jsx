import React, { useState } from 'react';

const Formation = ({ width = 400, height = 300, players = [], onSwap, selectedPlayerId, onSelectPlayer }) => {
  // SVG 안에서 필드(축구장) 주변에 줄 여백(margin)을 줍니다.
  const margin = 0;
  const fieldWidth = width - 2 * margin;
  const fieldHeight = height - 2 * margin;

  // 0~1로 들어온 정규화 좌표(xNorm, yNorm)를 실제 픽셀 좌표로 변환
  const realX = (xNorm) => margin + xNorm * fieldWidth;
  const realY = (yNorm) => margin + yNorm * fieldHeight;

  const cardWidth = 50;
  const cardHeight = 70;

  const [hoveredId, setHoveredId] = useState(null);
  const [draggingId, setDraggingId] = useState(null);

  // swap이 일어나는 경우 핸들러
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetStarterId) => {
    e.preventDefault();
    const draggedPlayerId = e.dataTransfer.getData('text/plain');
    console.log('onDrop(필드↔필드 또는 벤치→필드) →', draggedPlayerId, '↔', targetStarterId);
    if (draggedPlayerId && onSwap) {
      onSwap(draggedPlayerId, targetStarterId);
    }
  };

  const handleDragStart = (e, playerId, playerName) => {
    // 1) 드래그 데이터에 playerId를 저장
    e.dataTransfer.setData('text/plain', playerId);
    e.dataTransfer.effectAllowed = 'move';

    // 2) “오프스크린(offscreen)”에 임시 <div> 생성
    const previewDiv = document.createElement('div');
    previewDiv.style.position = 'absolute';
    previewDiv.style.top = '-1000px';  // 화면 밖으로 완전히 보냄
    previewDiv.style.left = '-1000px';
    previewDiv.style.padding = '4px 8px';
    previewDiv.style.background = 'white';
    previewDiv.style.border = '1px solid #333';
    previewDiv.style.borderRadius = '4px';
    previewDiv.style.fontSize = '12px';
    previewDiv.style.fontFamily = 'sans-serif';
    previewDiv.style.color = '#000';
    previewDiv.style.pointerEvents = 'none'; // 클릭 등 이벤트 막기
    previewDiv.innerText = playerName;

    // 문서에 추가해야만 브라우저가 렌더링을 참조해서 setDragImage가 제대로 동작함
    document.body.appendChild(previewDiv);

    // 3) <div> 노드를 드래그 프리뷰로 지정
    //    (offsetX, offsetY를 0,0으로 주면, div의 좌상단이 커서에 붙습니다.
    //     필요하면 조정)
    e.dataTransfer.setDragImage(previewDiv, 0, 0);

    // 4) 즉시(혹은 짧은 딜레이 후) DOM에서 제거
    //    setTimeout 0이 아니면, 일부 브라우저에서 "setDragImage" 값이 잡히기 전에 삭제될 수 있음
    setTimeout(() => {
      document.body.removeChild(previewDiv);
    }, 0);
  };

  return (
    <svg width={width} height={height}>
      {/* ────────────────────────────────────────────────────────── */}
      {/* 1) 필드(축구장) 배경: 녹색 사각형 + 흰색 테두리 */}
      <rect
        x={margin}
        y={margin}
        width={fieldWidth}
        height={fieldHeight}
        rx={10}              
        ry={10}
        fill="#45A049"
        stroke="white"
        strokeWidth={2}
      />

      {/* ────────────────────────────────────────────────────────── */}
      {/* 2) 가운데 선 (vertical center line)  
          - x = realX(0.5) 에서 y = realY(0) ~ realY(1) 까지 */}
      <line
        x1={realX(0)}
        y1={realY(0.5)}
        x2={realX(1)}
        y2={realY(0.5)}
        stroke="white"
        strokeWidth={2}
      />

      {/* ────────────────────────────────────────────────────────── */}
      {/* 3) 센터 서클 (center circle)  
          - 중심 = (realX(0.5), realY(0.5)),  
          - 반지름 = fieldWidth * 0.15  (필드 가로 길이 기준) */}
      <circle
        cx={realX(0.5)}
        cy={realY(0.5)}
        r={fieldWidth * 0.15}
        fill="none"
        stroke="white"
        strokeWidth={2}
      />

      {/* ────────────────────────────────────────────────────────── */}
      {/* 4) 페널티 영역 - 위쪽 (top penalty box)  
          - 폭(width)  = fieldWidth * 0.6  
          - 높이(height) = fieldHeight * 0.16  
          - 좌상단 위치 = (realX(0.2), realY(0)) */}
      <rect
        x={realX(0.2)}
        y={realY(0)}
        width={fieldWidth * 0.6}
        height={fieldHeight * 0.16}
        fill="none"
        stroke="white"
        strokeWidth={2}
      />

      {/* 5) 페널티 영역 - 아래쪽 (bottom penalty box)  
          - 좌상단 위치 = (realX(0.2), realY(1) - fieldHeight * 0.16) */}
      <rect
        x={realX(0.2)}
        y={realY(1) - fieldHeight * 0.16}
        width={fieldWidth * 0.6}
        height={fieldHeight * 0.16}
        fill="none"
        stroke="white"
        strokeWidth={2}
      />

      {/* ────────────────────────────────────────────────────────── */}
      {/* 6) 골 에어리어 (goal area) - 위쪽 */}
      {/*    - 폭(width)  = fieldWidth * 0.3  
            - 높이(height) = fieldHeight * 0.06  
            - 좌상단 위치 = (realX(0.35), realY(0)) */}
      <rect
        x={realX(0.35)}
        y={realY(0)}
        width={fieldWidth * 0.3}
        height={fieldHeight * 0.06}
        fill="none"
        stroke="white"
        strokeWidth={2}
      />

      {/* 7) 골 에어리어 (goal area) - 아래쪽 */}
      {/*    - 좌상단 위치 = (realX(0.35), realY(1) - fieldHeight * 0.06) */}
      <rect
        x={realX(0.35)}
        y={realY(1) - fieldHeight * 0.06}
        width={fieldWidth * 0.3}
        height={fieldHeight * 0.06}
        fill="none"
        stroke="white"
        strokeWidth={2}
      />

      {/* ────────────────────────────────────────────────────────── */}
      {/* 8) 골 포스트 (goal posts)  
          - 위쪽 골문 중앙 = (realX(0.5), realY(0))  
          - 아래쪽 골문 중앙 = (realX(0.5), realY(1)) */}
      <circle cx={realX(0.5)} cy={realY(0)} r={4} fill="white" />
      <circle cx={realX(0.5)} cy={realY(1)} r={4} fill="white" />

    {/* ────────────────────────────────────────────────────────── */}
      {/* 7) 플레이어 카드 (이미지 + 이름 + 국적) */}
      {players.map((p) => {

        // (2) 축구장 위 실제 픽셀 좌표 (중심점)
        const centerX = realX(p.x);
        const centerY = realY(p.y);

        // 카드 상단 왼쪽 모서리 좌표
        const cardX = centerX - cardWidth / 2;
        const cardY = centerY - cardHeight / 2;
        
        // posType 별 카드 이미지 URL
        const cardImageUrl = `/${p.posType}.png`;
        const faceImageUrl = p.image_url;

        // 선수 이미지 오버레이 위치 결정
        const faceSize = 28;
        const faceX = centerX - faceSize / 2 * 0.4;
        const faceY = cardY + cardHeight * 0.18; // 카드 상단에서 10% 지점
        const textNameY = faceY + faceSize + 16;   // 얼굴 이미지 아랫부분에서 +12px 내려오기
        const textNationY = textNameY + 10;        // 이름 아랫부분에서 +10px 내려오기

        const isHovered = hoveredId === p.id;
        const isDragging = draggingId === p.id;

        const scale = isHovered ? 1.1 : 1;
        const opacity = isDragging ? 0.6 : 1;

        const transform = `
          translate(${centerX}, ${centerY})
          scale(${scale})
          translate(${-centerX}, ${-centerY})
        `;

        const isSelected = p.id === selectedPlayerId;

        return (
        
         <g
            key={p.id}
            className={isSelected ? 'player-card selected' : 'player-card'}
            transform={transform}
            opacity={opacity}
            onMouseEnter={() => setHoveredId(p.id)}
            onMouseLeave={() => setHoveredId(null)}
            onDragStart={(e) => {
              setDraggingId(p.id);
              handleDragStart(e, p.id, p.name);
            }}
            onDragEnd={() => setDraggingId(null)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, p.id)}
            onClick={() => onSelectPlayer(p.id)}
          >
            {/* 더 넓은 영역에서 드래그 시작할 수 있도록 투명 사각형 도입 */}
            <rect
              x={cardX}
              y={cardY}
              width={cardWidth}
              height={cardHeight}
              fill="transparent"
              draggable={true}
              pointerEvents="all"
              onDragStart={(e) => {
                setDraggingId(p.id);
                handleDragStart(e, p.id, p.name);
              }}
              onDragEnd={() => setDraggingId(null)}
            />

            {/* ─── A. 카드 배경(포지션별) 그리기 ─── */}
            <image
              href={cardImageUrl}
              x={cardX}
              y={cardY}
              width={cardWidth}
              height={cardHeight}
              preserveAspectRatio="xMidYMid slice"
            />
            
            {/* 선수 이미지 */}
            <image
              href={p.image_url}
              x={faceX}
              y={faceY}
              width={faceSize}
              // height 속성을 생략하면 “원본 비율을 유지”하면서
              // width=faceWidth에 맞춰 자동으로 세로 크기가 설정됩니다.
              preserveAspectRatio="xMidYMid meet"
              style={{
                // SVG <image>에 borderRadius가 잘 안 먹힐 수 있으니,
                // 둥근 마스크가 필요하다면 clipPath를 사용해야 합니다.
                overflow: 'visible',
              }}
            />

            {/* 선수 이름 */}
            <text
              x={centerX}
              y={textNameY}
              textAnchor="middle"
              fontSize="5"
              fill="#000"
              stroke="none"
            >
              {p.name}
            </text>

            {/* 선수 국적 */}
            <text
              x={centerX}
              y={textNationY - 2}
              textAnchor="middle"
              fontSize="4"
              fill="#555"
              stroke="none"
            >
              {p.nation}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export default Formation;
