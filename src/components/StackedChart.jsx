// src/components/StackedChart.jsx
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';


const COLUMN_LABELS = {
  Gls:   'Goals',
  Ast:   'Number of assists',
  xG:    'Expected goals(xG)',
  npxG:  'Non-penalty xG',
  xAG:   'Expected assists(xAG)',
  'G/Sh':'Goals per shot(G/Sh)',
  KP:    'Key passes(KP)',
  PPA:   'Passes into penalty area',
  SCA:   'Shot-creating actions',
  SCA90: 'SCA per 90 minutes',
  Sh:    'Total shots',
  'Sh/90':'Shots per 90 minutes',
  SoT:   'Shots on target(SoT)',
  'SoT/90':'SoT per 90 minutes',
  PrgC:  'Progressive carries',
  Carries: 'carries',
  PrgDist_stats_possession: 'Progressive distance',
  PrgP:  'Progressive passes',
  Tkl:   'Tackles(Tkl)',
  'Tkl%':'Tackle success rate',
  Int:   'Interceptions(Int)',
  Recov: 'Ball recoveries'
};

export default function StackedChart({
  data,
  players,
  columns,
  baseline,
  onCategoryClick,
  manualCount
}) {
  const svgRef       = useRef();
  const containerRef = useRef();
  const tooltipRef   = useRef();
  const [dims, setDims] = useState({ width: 0, height: 0 });

  const safeTrim = s => (typeof s === 'string' ? s.trim() : '');

  // 컨테이너 크기 감지
  useEffect(() => {
    const ro = new ResizeObserver(es => {
      for (let e of es) {
        setDims({
          width: e.contentRect.width,
          height: e.contentRect.height
        });
      }
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    drawChart();
  }, [data, players, columns, baseline, dims, manualCount]);

  function drawChart() {

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    if (!data || !players.length || !columns.length || dims.width <= 0) return;

    // 1) 마진 설정
    const margin = { top: 30, right: 20, bottom: 50, left: 20 };
    const fullW  = dims.width;
    const fullH  = dims.height;
    const w      = fullW - margin.left - margin.right;
    const h      = fullH - margin.top  - margin.bottom;
    svg.attr('width', fullW).attr('height', fullH);

    // 2) 깨끗한 선수 목록
    const cleanPlayers = players.map(safeTrim).filter(p => p);
    if (!cleanPlayers.length) return;

    // 3) market_value 차이 계산
    const baseRow = data.find(d =>
      safeTrim(d.Player).toLowerCase() === cleanPlayers[0].toLowerCase()
    );
    const baseMV = baseRow ? +baseRow.market_value : 0;
    const diffs  = cleanPlayers.map(p => {
      const r = data.find(d =>
        safeTrim(d.Player).toLowerCase() === p.toLowerCase()
      );
      return r ? (+r.market_value - baseMV) : 0;
    });

    // 4) 기준/수동 선수는 앞에 두고, 추천 선수만 diff 내림차순 정렬
    const prefix     = cleanPlayers.slice(0, manualCount);     // 기준 + 직접 추가된 선수
    const recPlayers = cleanPlayers.slice(manualCount);        // 추천 선수들
    const recWithDiff = recPlayers.map((p, i) => ({
      player: p,
      diff: diffs[manualCount + i]
    }));
    recWithDiff.sort((a, b) => b.diff - a.diff);
    const sortedRec    = recWithDiff.map(d => d.player);
    const sortedPlayers = [...prefix, ...sortedRec];

    // 5) 데이터 준비 (norm 값)
    const dataForPlayers = sortedPlayers.map(name => {
      const row = data.find(d =>
        safeTrim(d.Player).toLowerCase() === name.toLowerCase()
      );
      if (!row) {
        const obj = { Player: name };
        columns.forEach(c => obj[c] = 0);
        return obj;
      }
      const obj = { Player: row.Player };
      columns.forEach(c => obj[c] = +row[`${c}_norm`]);
      return obj;
    });

    // 6) xScale
    const xScale = d3.scaleBand()
      .domain(sortedPlayers)
      .range([0, w])
      .padding(0.2)
      .round(true);

    // 7) 스택 레이아웃
    let series = d3.stack().keys(columns)(dataForPlayers)
      .map(s => ({ key: s.key, values: s }));

    // baseline shift
    if (baseline && columns.includes(baseline)) {
      const bi     = series.findIndex(s => s.key === baseline);
      const shifts = series[bi].values.map(d => d[0]);
      series = series.map(s => ({
        key: s.key,
        values: s.values.map((d, i) => [d[0] - shifts[i], d[1] - shifts[i]])
      }));
    }

    // 8) Y축 스케일 (10% padding)
    const allY0 = series.flatMap(s => s.values.map(d => d[0]));
    const allY1 = series.flatMap(s => s.values.map(d => d[1]));
    const rawMax = baseline
      ? Math.max(Math.abs(d3.min(allY0)), Math.abs(d3.max(allY1)))
      : d3.max(allY1);
    const paddedMax = rawMax * 1.1;
    const yScale = d3.scaleLinear()
      .domain(
        baseline
          ? [paddedMax, -paddedMax]
          : [0, paddedMax]
      )
      .range(
        baseline
          ? [0, h]
          : [h, 0]
      )
      .nice();

    // 9) clipPath
    svg.append('defs')
      .append('clipPath').attr('id', 'barClip')
      .append('rect')
        .attr('x', margin.left)
        .attr('y', margin.top)
        .attr('width', w)
        .attr('height', h);

    // 10) barsG
    const barsG = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)
      .attr('clip-path', 'url(#barClip)');

    const color = d3.scaleOrdinal(d3.schemeCategory10).domain(columns);

    // 11) 그리기
    const layerG = barsG.selectAll('.layer')
      .data(series, d => d.key)
      .join('g')
        .attr('class', 'layer')
        .attr('fill', d => color(d.key));

    layerG.selectAll('rect')
      .data(d =>
        d.values.map((v, i) => ({
          key: d.key,
          player: sortedPlayers[i],
          y0: v[0],
          y1: v[1]
        }))
      , d => d.key + '_' + d.player)
      .join(
        enter => enter.append('rect')
          .attr('x',     d => xScale(d.player))
          .attr('width', xScale.bandwidth())
          .attr('y',     d => yScale(d.y1))
          .attr('height',d => Math.abs(yScale(d.y0) - yScale(d.y1)))
          .attr('stroke','#333').attr('stroke-width',0.5)
          .attr('opacity', d => baseline ? (d.key===baseline?1:0.2) : 1)
          .on('mouseover', (e, d) => {
            const r = data.find(r =>
              safeTrim(r.Player).toLowerCase() === d.player.toLowerCase()
            );
            const label = COLUMN_LABELS[d.key] || d.key;
            d3.select(tooltipRef.current)
              .html(`<strong>${label}</strong>: ${r ? r[d.key] : 'N/A'}`)
              .style('visibility', 'visible');
          })
          .on('mousemove', e => {
            const rect = containerRef.current.getBoundingClientRect();
            d3.select(tooltipRef.current)
              .style('top',  `${e.clientY - rect.top - 40}px`)
              .style('left', `${e.clientX - rect.left + 10}px`);
          })
          .on('mouseout', () =>
            d3.select(tooltipRef.current).style('visibility', 'hidden')
          ),
        update => update.call(u =>
          u.transition().duration(500)
            .attr('x',     d => xScale(d.player))
            .attr('y',     d => yScale(d.y1))
            .attr('height',d => Math.abs(yScale(d.y0) - yScale(d.y1)))
            .attr('width', xScale.bandwidth())
            .attr('opacity', d => baseline ? (d.key===baseline?1:0.2) : 1)
        ),
        exit => exit.call(x =>
          x.transition().duration(300)
           .attr('y', yScale(0))
           .attr('height', 0)
           .remove()
        )
      )
      .on('click', (e, d) =>
        onCategoryClick(d.key === baseline ? null : d.key)
      );

    // 12) market_value 차이값 라벨
    const topYs = sortedPlayers.map((p, i) => {
      const last = series[series.length - 1].values[i];
      return yScale(last[1]);
    });

    const labelsG = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    labelsG.selectAll('.diff-label')
      .data(sortedPlayers.map((p, i) => ({ player: p, diff: diffs[cleanPlayers.indexOf(p)], yTop: topYs[i] })))
      .join('text')
        .attr('class', 'diff-label')
        .attr('x', d => xScale(d.player) + xScale.bandwidth()/2)
        .attr('y', d => d.yTop - 6)
        .attr('text-anchor', 'middle')
        .style('font-size', '10px')
        .style('fill', d => d.diff >= 0 ? 'green' : 'red')
        .text(d => {
          const sign = d.diff >= 0 ? '+' : '-';
          return `${sign}€${Math.abs(Math.round(d.diff)).toLocaleString()}`;
        });

    // 13) Y축
    svg.append('g')
      .attr('class','y-axis')
      .attr('transform', `translate(${margin.left},${margin.top})`)
      .call(d3.axisLeft(yScale).ticks(5).tickSizeInner(-w).tickSizeOuter(0))
      .selectAll('line').attr('stroke','#ccc');

    // 14) X축
    const xAxisG = svg.append('g')
      .attr('class','x-axis')
      .attr('transform', `translate(${margin.left},${margin.top + yScale(0)})`)
      .call(d3.axisBottom(xScale));

    // tick 텍스트 줄바꿈
    xAxisG.selectAll('text')
      .style('cursor','pointer')
      .each(function(name) {
        const parts = name.split(' ');       // 공백으로 분할
        const el    = d3.select(this);
        el.text('');                          // 기존 텍스트 제거
        parts.forEach((word, i) => {
          el.append('tspan')
            .attr('x', 0)
            // 첫 줄부터 아래로 1.2em 씩 내려주고 싶으면
            .attr('dy', i === 0 ? '1.2em' : '1.1em')
            .text(word);
        });
      })
      .on('mouseover', (e, name) => {
        const r = data.find(d => safeTrim(d.Player).toLowerCase() === name.trim().toLowerCase());
        if (!r) return;
        let html = `<strong>${name}</strong><br/>Nation: ${r.Nation}<br/>Team: ${r.Squad}</strong><br/>Position: ${r.Pos}<br/>Age: ${r.Age}<br/>`;
        columns.forEach(c => {
          const label = COLUMN_LABELS[c] || c;
          html += `${label}: ${r[c]}<br/>`;
        });
        d3.select(tooltipRef.current)
          .html(html)
          .style('visibility','visible');
      })
      .on('mousemove', e => {
        const rect = containerRef.current.getBoundingClientRect();
        d3.select(tooltipRef.current)
          .style('top',  `${e.clientY-rect.top-100}px`)
          .style('left', `${e.clientX-rect.left+10}px`);
      })
      .on('mouseout', () =>
        d3.select(tooltipRef.current).style('visibility','hidden')
      );

    // 15) 구분선
    const recDiffs  = diffs.slice(manualCount);
    const highCount = recDiffs.filter(d => d > 0).length;
    const idx1 = manualCount;
    const idx2 = manualCount + highCount;
    const step    = xScale.step();
    const bw      = xScale.bandwidth();
    const halfGap = (step - bw) / 2;

    [idx1, idx2].forEach(idx => {
      if (idx > 0 && idx < sortedPlayers.length) {
        const xPos = xScale(sortedPlayers[idx]) - halfGap;
        barsG.append('line')
          .attr('x1', xPos)
          .attr('x2', xPos)
          .attr('y1', 0)
          .attr('y2', h)
          .attr('stroke', '#333')
          .attr('stroke-dasharray', '4 4');
      }
    });

    // 16) 범례
    const legend = svg.append('g')
      .attr('transform', `translate(${margin.left + w - 100},${margin.top + 5})`);
    columns.forEach((col, i) => {
      const g = legend.append('g').attr('transform', `translate(0,${i * 18})`);
      g.append('rect')
        .attr('width',12).attr('height',12)
        .attr('fill', color(col))
        .attr('stroke','#333').attr('stroke-width',0.5);
      g.append('text')
        .attr('x',16).attr('y',10)
        .style('font-size','8px')
        .text(COLUMN_LABELS[col] || col);
    });
  }

  return (
    <div ref={containerRef} style={{ width:'100%', height:'100%', position:'relative' }}>
      <div
        ref={tooltipRef}
        style={{
          position:'absolute', pointerEvents:'none',
          backgroundColor:'rgba(255,255,255,0.9)', border:'1px solid #333',
          borderRadius:'4px', padding:'6px', fontSize:'12px', visibility:'hidden',
          boxShadow:'2px 2px 6px rgba(0,0,0,0.3)', lineHeight:'1.4em',
          zIndex:10
        }}
      />
      <svg ref={svgRef} style={{ width:'100%', height:'100%' }} />
    </div>
  );
}
