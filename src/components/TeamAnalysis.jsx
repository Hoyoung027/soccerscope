// src/components/TeamAnalysis.jsx
import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './TeamAnalysis.css';

const POS_GROUPS = {
  DF: ['Left-Back','Right-Back','Centre-Back'],
  MF: ['Defensive Midfield','Central Midfield','Attacking Midfield','Left Midfield','Right Midfield'],
  FW: ['Left Winger','Right Winger','Centre-Forward','Second Striker']
};

function getPosCategory(subPos) {
  if (POS_GROUPS.DF.includes(subPos)) return 'DF';
  if (POS_GROUPS.MF.includes(subPos)) return 'MF';
  if (POS_GROUPS.FW.includes(subPos)) return 'FW';
  return null;
}

function Heatmap({ data }) {

  const wrapperRef = useRef();
  const [tip, setTip] = useState({ visible: false, x: 0, y: 0, name: '', value: 0 });

  const showTip = (e, name, value) => {
  const cellRect = e.currentTarget.getBoundingClientRect();
  const wrapRect = wrapperRef.current.getBoundingClientRect();
  const x = cellRect.left - wrapRect.left + cellRect.width / 2;
  const y = cellRect.top  - wrapRect.top - 3;
  setTip({ visible: true, x, y, name, value });
};

  const hideTip = () => setTip(t => ({ ...t, visible: false }));
  
  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);

  const rows = 15;
  const cols = Math.ceil(data.length / rows);

  return (
    <div ref={wrapperRef} className='heatmap-wrapper' style={{ position: 'relative' }}>
      {/* ② 툴팁 엘리먼트 */}
      {tip.visible && (
        <div
          className="heatmap-tooltip"
          style={{
            position: 'absolute',
            left: tip.x,
            top: tip.y,
            background: 'rgba(0,0,0,0.75)',
            color: '#fff',
            padding: '2px 6px',
            borderRadius: '4px',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            fontSize: '10px',
            zIndex: 1000,
            transform: 'translate(-50%, -100%)'
          }}
        >
          {tip.name}: {tip.value.toFixed(2)}
        </div>
      )}

      <div className="heatmap-grid">

        {data.map(({ name, value, isOur }, i) => {

            const ratio = max > min ? (value - min) / (max - min) : 0;

            // 2) 위치 비율: (row + col) 이 클수록 오른쪽아래
            const row = i % rows;
            const col = Math.floor(i / rows);
            const posRatio = (row + col) / ((rows - 1) + (cols - 1));

            // 3) 합성 투명도: 값(ratio) × (1 - 위치비율) 
            const alpha = ratio * (1 - posRatio);
            const bg = `rgba(220,20,60,${alpha})`;

            return (
            <div
              key={name}
              className="heatmap-cell"
              data-tooltip={`${name}: ${value.toFixed(2)}`}
              style={{
                backgroundColor: bg,
                border: isOur ? '2px solid #000' : '1px solid #ccc'
              }}
              onMouseEnter={e => showTip(e, name, value)}
              onMouseMove={e => showTip(e, name, value)}
              onMouseLeave={hideTip}
            />
        );
        })}
        </div>
    </div>
  );
}

export default function TeamAnalysis({
  rawData = [],
  teamName,
  compareKey,
  selectedCategory, 
  chartType,
  width = 600,
  height = 300
}) {
  const svgRef = useRef();

  useEffect(() => {
    if (!rawData.length || !compareKey || !selectedCategory) return;

    // 1) sub_position 기반으로 3개 카테고리 필터링
    const leagueData = rawData.filter(d =>
      getPosCategory(d.sub_position) === selectedCategory
    );
    const teamData = leagueData.filter(d => d.Squad === teamName);

    const seasonAvg = d3.mean(leagueData, d => +d[compareKey]) || 0;
    const teamAvg   = d3.mean(teamData,   d => +d[compareKey]) || 0;

    // 2) 팀 선수별 값
    const players = teamData.map(d => ({
      name: d.Player,
      value: +d[compareKey]
    }));

    // ─── Heatmap 모드이면 svg만 초기화하고 Bar 렌더링 로직 건너뛰기 ───
    if (chartType === 'heatmap') {
      d3.select(svgRef.current).html('');
      return;
    }

    // 3) 차트 스케일, 렌더링
    const margin = { top: 10, right: 20, bottom: 80, left: 60 };
    const w = width  - margin.left - margin.right;
    const h = height - margin.top  - margin.bottom;

    const x = d3.scaleBand()
      .domain(players.map(d => d.name))
      .range([0, w])
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, d3.max([seasonAvg, teamAvg, d3.max(players, d => d.value)]) * 1.1])
      .range([h, 0]);

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .html('');

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    let tooltip = d3.select('body').select('.bar-tooltip');    if (tooltip.empty()) {
      tooltip = d3.select('body')
        .append('div')
        .attr('class', 'bar-tooltip')
        .style('position', 'absolute')
        .style('pointer-events', 'none')
        .style('padding', '4px 8px')
        .style('background', 'rgba(0,0,0,0.7)')
        .style('color', '#fff')
        .style('font-size', '10px')
        .style('border-radius', '4px')
        .style('visibility', 'hidden');
    }

    // bar
    g.selectAll('rect.bar')
      .data(players)
      .join('rect')
        .attr('class', 'bar')
        .attr('x',      d => x(d.name))
        .attr('y',      d => y(d.value))
        .attr('width',  x.bandwidth())
        .attr('height', d => h - y(d.value))
        .attr('fill',   'rgba(32,87,35,0.4)')
        .attr('stroke', '#205723')       
        .attr('stroke-width', 1);

    // season avg dashed line
    g.append('line')
      .attr('x1', 0).attr('x2', w)
      .attr('y1', y(seasonAvg)).attr('y2', y(seasonAvg))
      .attr('stroke', 'steelblue')
      .attr('stroke-dasharray', '4,2')
      .attr('stroke-width', 2);

    // team avg dashed line
    g.append('line')
      .attr('x1', 0).attr('x2', w)
      .attr('y1', y(teamAvg)).attr('y2', y(teamAvg))
      .attr('stroke', 'darkorange')
      .attr('stroke-dasharray', '4,2')
      .attr('stroke-width', 2);

    // axes
    g.append('g').call(d3.axisLeft(y));
    g.append('g')
      .attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
        .attr('transform', 'rotate(-40)')
        .style('text-anchor', 'end');

    const legendX = width - margin.right - 120;  
    const legendY = margin.top;                  
    const legend = svg.append('g')
     .attr('transform', `translate(${legendX},${legendY})`);

    // Season Avg 선 표시
    legend.append('line')
        .attr('x1', 0).attr('y1', 0)
        .attr('x2', 20).attr('y2', 0)
        .attr('stroke', 'steelblue')
        .attr('stroke-dasharray', '4,2')
        .attr('stroke-width', 2);
    legend.append('text')
        .attr('x', 24)
        .attr('y', 4)
        .style('font-size', '10px')
        .style('fill', 'steelblue')
        .text('League Average');

    // Team Avg 선 표시
    legend.append('line')
        .attr('x1', 0).attr('y1', 14)
        .attr('x2', 20).attr('y2', 14)
        .attr('stroke', 'darkorange')
        .attr('stroke-dasharray', '4,2')
        .attr('stroke-width', 2);
    legend.append('text')
        .attr('x', 24)
        .attr('y', 18)
        .style('font-size', '10px')
        .style('fill', 'darkorange')
        .text('Team Average');

  }, [rawData, teamName, compareKey, selectedCategory, chartType, width, height]);

  if (chartType === 'heatmap') {

    const filtered = rawData.filter(d =>
      getPosCategory(d.sub_position) === selectedCategory
    );
    
    const data = filtered
        .map(d => ({
            name: d.Player,
            value: +d[compareKey],
            isOur: d.Squad === teamName
        }))
        .sort((a, b) => b.value - a.value);

    return <Heatmap data={data} />;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg ref={svgRef} />
    </div>
  );
}
