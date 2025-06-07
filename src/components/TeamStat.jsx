import React, { useState } from 'react';

const TeamStat = ({
  teamAggregates = {},
  selectedTeam = '',
  width = 350,
  height = 350,
  onDetailClick
}) => {

  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [selectedIndices, setSelectedIndices] = useState([]);

  // 1) SVG 중심 좌표
  const cx = width / 2;
  const cy = height / 2;

  // 2) 최대 반지름 (격자/레이더 용)
  const maxRadius = Math.min(width, height) / 2 - 40; // 40px 여백

  // 3) 축 정의 (6개)
  const axes = [
    { key: 'Gls',  label: 'Goal Score' },
    { key: 'xG',   label: 'xG'         },
    { key: 'xAG',  label: 'xA'         },
    { key: 'SoT',  label: 'SoT'        },
    { key: 'Int',  label: 'Int'        },
    { key: 'Recov',label: 'Recov'      },
  ];
  const axisCount = axes.length;

  // 전체 팀 이름 배열
  const allTeams = Object.keys(teamAggregates);
  const teamCount = allTeams.length;

  // 특정 축(key)에서 선택 팀의 백분위(0~1) 계산
  const computePercentile = (key) => {
    const rawValues = allTeams.map((t) => teamAggregates[t][key] || 0);
    const selectedValue = (teamAggregates[selectedTeam] || {})[key] || 0;
    const countLE = rawValues.filter((v) => v <= selectedValue).length;
    return countLE / teamCount;
  };

  // selectedTeam이 teamAggregates에 없는 경우 빈 배열로 처리
  if (!teamAggregates[selectedTeam]) {
    return <p style={{ color: '#999' }}>“{selectedTeam}” 팀의 통계를 찾을 수 없습니다.</p>;
  }

  // 각 축별 백분위 → (r, angle) → (x,y) 실제 좌표 계산
  const dataPoints = axes.map((axis, idx) => {
    const pct = computePercentile(axis.key);            
    const r = pct * maxRadius;                          
    const angle = -90 + (360 / axisCount) * idx;    
    const rad = (Math.PI / 180) * angle;
    const x = cx + r * Math.cos(rad);
    const y = cy + r * Math.sin(rad);
    return { x, y, angle, label: axis.label, pct };
  });

  // 8) 백분위 격자선 (25%, 50%, 75%, 100% 수준)
  const gridPercents = [0.25, 0.5, 0.75, 1.0];
  const gridPolygons = gridPercents.map((levelPct) => {
    const rLevel = levelPct * maxRadius;
    const pts = axes.map((axis, idx) => {
      const angle = -90 + (360 / axisCount) * idx;
      const rad = (Math.PI / 180) * angle;
      const x = cx + rLevel * Math.cos(rad);
      const y = cy + rLevel * Math.sin(rad);
      return `${x},${y}`;
    });
    return pts.join(' ');
  });

  const activeSet = new Set(selectedIndices);
  if (hoveredIndex !== null) {
    activeSet.add(hoveredIndex);
  }

  // 전체 grid/축/폴리곤을 fade할지 결정하는 불리언
  const anyActive = activeSet.size > 0;
  const fadedOpacity = anyActive ? 0.3 : 1;

  // (H) 클릭 시 토글 함수: clickedIdx가 있으면 해제, 없으면 추가
  const toggleSelection = (clickedIdx) => {
    setSelectedIndices((prev) => {
      if (prev.includes(clickedIdx)) {
        return prev.filter((i) => i !== clickedIdx);
      } else {
        return [...prev, clickedIdx];
      }
    });
  };

  return (
    <div
      className="teamstat-container"
      style={{
        position: 'relative',
        width: width,
        height: height,
      }}
    >
      {/* 1) 오른쪽 상단 Detail 버튼 */}
      <button
        className="detail-button"
        onClick={onDetailClick}
      >
        Detail
      </button>
      <svg 
        width={width} 
        height={height} 
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {/* 백분위 격자선 */}
        <g opacity={fadedOpacity}>
          {gridPolygons.map((pts, idx) => (
            <polygon
              key={`grid-${idx}`}
              points={pts}
              fill="none"
              stroke="#ccc"
              strokeWidth={0.5}
            />
          ))}
        </g>

        {/* 축(axes) 라인 & 레이블 */}
        <g opacity={fadedOpacity}>
          {axes.map((axis, idx) => {
            const angle = -90 + (360 / axisCount) * idx;
            const rad = (Math.PI / 180) * angle;
            // 축 끝점
            const xEnd = cx + maxRadius * Math.cos(rad);
            const yEnd = cy + maxRadius * Math.sin(rad);
            // 레이블 위치 (끝점에서 20px 바깥쪽)
            const xLab = cx + (maxRadius + 20) * Math.cos(rad);
            const yLab = cy + (maxRadius + 20) * Math.sin(rad);

            return (
              <g key={`axis-${idx}`}>
                {/* 축 선 */}
                <line
                  x1={cx}
                  y1={cy}
                  x2={xEnd}
                  y2={yEnd}
                  stroke="#888"
                  strokeWidth={1}
                />
                {/* 축 레이블 */}
                <text
                  x={xLab}
                  y={yLab}
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

        {/* 선택 팀의 그래프 */}
        <g opacity={anyActive ? 0.2 : 1}>
          <polygon
            points={dataPoints.map((pt) => `${pt.x},${pt.y}`).join(' ')}
            fill="rgba(32,87,35,0.4)"
            stroke="#205723"
            strokeWidth={2}
          />
        </g>

        {/* 각 축 포인트 */}
        <g>
          {dataPoints.map((pt, idx) => {
            const isActive = activeSet.has(idx);
            return (
              <circle
                key={idx}
                cx={pt.x}
                cy={pt.y}
                r={4}
                fill={isActive ? '#FF4136' : '#205723'}
                opacity={isActive ? 1 : fadedOpacity}
                stroke="white"
                strokeWidth={1}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => toggleSelection(idx)}
                cursor="pointer"
              />
            );
          })}
        </g>

        {/* hover, select */}
        {Array.from(activeSet).map((idx) => {
          const pt = dataPoints[idx];
          return (
            <text
              key={`txt-${idx}`}
              x={pt.x - 15}
              y={pt.y - 10}
              fontSize="12"
              fill="#000"
              fontWeight="bold"
            >
              {`${pt.label}: ${(pt.pct * 100).toFixed(1)}%`}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

export default TeamStat;