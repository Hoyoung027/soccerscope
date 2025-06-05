const TeamStat = ({ stats, maxStats, width = 350, height = 350 }) => {
  // 1) SVG 중앙 좌표(중심점)
  const cx = width / 2;
  const cy = height / 2;

  // 2) 방사형 차트 최대 반지름 (padding을 위해 여유 공간을 남김)
  const maxRadius = Math.min(width, height) / 2 - 40; // 40px 정도 여유를 둠

  // 3) 축(Axes) 정의: 순서대로 6개의 지표와 레이블
  const axes = [
    { key: 'Gls',  label: 'Goal Score' },
    { key: 'xG',   label: 'xG'         },
    { key: 'xAG',  label: 'xA'         },
    { key: 'SoT',  label: 'SoT'        },
    { key: 'Int',  label: 'Int'        },
    { key: 'Recov', label: 'Recov'     },
  ];

  // 4) 축 개수
  const axisCount = axes.length;

  // 5) 격자(Grid) 수준 (몇 단계의 둥근 레벨을 그릴지)
  const gridLevels = 5;

  // 6) 극좌표(r, angleDeg)를 SVG 절대 좌표(x, y)로 변환하는 헬퍼 함수
  const polarToCartesian = (r, angleDeg) => {
    const angleRad = (Math.PI / 180) * angleDeg;
    return {
      x: cx + r * Math.cos(angleRad),
      y: cy + r * Math.sin(angleRad),
    };
  };

  // 7) 각 축별 “정규화된 값(ratio) → 실제 반지름(r)”을 계산
  //    그리고 극좌표를 직교좌표로 바꿔서 dataPoints 배열에 저장
  const dataPoints = axes.map((axis, idx) => {
    const value = stats[axis.key] || 0;
    const maxValue = maxStats[axis.key] || 1; // 0-div 방지용
    const ratio = value / maxValue;           // 0~1 비율
    const r = ratio * maxRadius;              // 실제 픽셀 반지름

    // -90°를 하면 첫 번째 축이 위쪽(12시 방향)에 오게 된다.
    const angle = -90 + (360 / axisCount) * idx;
    const { x, y } = polarToCartesian(r, angle);

    return { x, y, angle, label: axis.label, ratio };
  });

  // 8) Grid 배경용 다각형(Polygon) 좌표들을 계산
  const gridPolygons = [];
  for (let level = 1; level <= gridLevels; level++) {
    const rLevel = (maxRadius / gridLevels) * level;
    const points = axes.map((axis, idx) => {
      const angle = -90 + (360 / axisCount) * idx;
      const { x, y } = polarToCartesian(rLevel, angle);
      return `${x},${y}`;
    });
    gridPolygons.push(points.join(' '));
  }

  return (
    <svg width={width} height={height}>
      {/* ───────────────────────────────────────────────────────────
          1) 배경 격자 (Grid) 그리기
      ─────────────────────────────────────────────────────────── */}
      <g>
        {gridPolygons.map((pts, idx) => (
          <polygon
            key={`grid-level-${idx}`}
            points={pts}
            fill="none"
            stroke="#ccc"
            strokeWidth={0.5}
          />
        ))}
      </g>

      {/* ───────────────────────────────────────────────────────────
          2) 축(Axis) 선과 레이블(Label) 그리기
      ─────────────────────────────────────────────────────────── */}
      <g>
        {axes.map((axis, idx) => {
          const angle = -90 + (360 / axisCount) * idx;
          // 축 끝 좌표(격자 최외곽) 계산
          const { x: xEnd, y: yEnd } = polarToCartesian(maxRadius, angle);
          // 레이블은 축 끝에서 +20px 정도 떨어진 위치에 표시
          const { x: xLabel, y: yLabel } = polarToCartesian(maxRadius + 20, angle);

          return (
            <g key={`axis-${idx}`}>
              {/* 축 선(Line) */}
              <line
                x1={cx}
                y1={cy}
                x2={xEnd}
                y2={yEnd}
                stroke="#888"
                strokeWidth={1}
              />

              {/* 축 레이블(Text) */}
              <text
                x={xLabel}
                y={yLabel}
                textAnchor="middle"
                fontSize="10"
                fill="#205723"
                dy="4"
              >
                {axis.label}
              </text>
            </g>
          );
        })}
      </g>

      {/* ───────────────────────────────────────────────────────────
          3) 데이터 영역(Polygon) 그리기
      ─────────────────────────────────────────────────────────── */}
      <g>
        <polygon
          points={dataPoints.map((pt) => `${pt.x},${pt.y}`).join(' ')}
          fill="rgba(32,87,35,0.4)"  // 진한 녹색 반투명
          stroke="#205723"          // 진한 녹색 윤곽선
          strokeWidth={2}
        />
      </g>

      {/* ───────────────────────────────────────────────────────────
          4) 데이터 포인트(Circle) 찍기(선택)
      ─────────────────────────────────────────────────────────── */}
      <g>
        {dataPoints.map((pt, idx) => (
          <circle
            key={`point-${idx}`}
            cx={pt.x}
            cy={pt.y}
            r={4}
            fill="#205723"
            stroke="white"
            strokeWidth={1}
          />
        ))}
      </g>
    </svg>
  );
};

export default TeamStat;
