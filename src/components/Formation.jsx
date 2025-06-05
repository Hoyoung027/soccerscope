const Formation = ({ width = 600, height = 350, players = [] }) => {
  // SVG 안에서 필드(축구장) 주변에 줄 여백(margin)을 줍니다.
  const margin = 20;
  const fieldWidth = width - 2 * margin;
  const fieldHeight = height - 2 * margin;

  // 0~1로 들어온 정규화 좌표(xNorm, yNorm)를 실제 픽셀 좌표로 변환
  const realX = (xNorm) => margin + xNorm * fieldWidth;
  const realY = (yNorm) => margin + yNorm * fieldHeight;

  return (
    <svg width={width} height={height}>
      {/* ────────────────────────────────────────────────────────── */}
      {/* 1) 필드(축구장) 배경: 녹색 사각형 + 흰색 테두리 */}
      <rect
        x={margin}
        y={margin}
        width={fieldWidth}
        height={fieldHeight}
        rx={10}               // 모서리 둥글게
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
        // (1) 카드(이미지) 크기: 정사각형 30×30px
        const imgSize = 30;

        // (2) 축구장 위 실제 픽셀 좌표 (중심점)
        const centerX = realX(p.x);
        const centerY = realY(p.y);

        // (3) 이미지(카드) 왼쪽 상단 위치 보정
        const imgX = centerX - imgSize / 2;
        const imgY = centerY - imgSize / 2 - 10; 
        // -10: 사진 위쪽으로 살짝 올려, 이름/국적이 바로 아래에 보이도록

        // (4) 이름 / 국적 텍스트 좌표
        const textX = centerX;             // 수평 가운데 정렬
        const nameY = centerY + imgSize / 2 - 5; 
        const countryY = nameY + 10;       // 이름 아래에 국적

        return (
          <g key={p.id}>
            {/* 7.1) 선수 이미지 (정사각형) */}
            <image
              href={p.image_url}     // 로컬 public/images/... 또는 CDN URL
              x={imgX}
              y={imgY}
              width={imgSize}
              height={imgSize}
              preserveAspectRatio="xMidYMid slice"
              style={{ borderRadius: '50%' }} 
              // SVG에서 직접 border-radius는 적용되지 않으므로, CSS로 가능할 경우 사용
            />

            {/* 7.2) 선수 이름 (텍스트) */}
            <text
              x={textX}
              y={nameY + 2}
              textAnchor="middle"
              fontSize="8"
              fill="black"
              stroke="black"
              strokeWidth={0.2}
            >
              {p.name}
            </text>

            {/* 7.3) 선수 국적 (텍스트) */}
            <text
              x={textX}
              y={countryY}
              textAnchor="middle"
              fontSize="5"
              fill="white" 
              stroke="white"
              strokeWidth={0.1}
            >
              ({p.country_of_citizenship})
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export default Formation;
