// src/App.jsx
import React, { useState, useEffect } from 'react';
import * as d3 from 'd3';
import StackedChart from './components/StackedChart';
import './App.css';

export default function App() {
  const [rawData, setRawData] = useState(null);
  const [columns, setColumns] = useState([]);
  const [baseline, setBaseline] = useState(null);

  // 1) 수동으로 추가한 플레이어
  const [manualPlayers, setManualPlayers] = useState([]);
  // 2) 추천 로직으로 생성된 플레이어
  const [recommendedPlayers, setRecommendedPlayers] = useState([]);
  const [inputName, setInputName] = useState('');

  
  // 차트에 넘길 최종 선수 목록
  const chartPlayers = [...manualPlayers, ...recommendedPlayers];

  // CSV 로드
  useEffect(() => {
    d3.csv('/stats.csv').then(data => {
      setRawData(data);
      if (data.length) {
        setManualPlayers([data[0].Player]);
      }
    });
  }, []);

  // 수동 추가
  const handleAddPlayer = () => {
    const name = inputName.trim();
    if (!rawData) return;
    
    const exists = rawData.find(d => d.Player === name);
    if (exists && !manualPlayers.includes(name)) {
      setManualPlayers(mp => [...mp, name]);
    }
    setInputName('');
  };

  // 수동 추가된 선수 또는 추천된 선수를 삭제
  const handleRemovePlayer = name => {
    if (manualPlayers.includes(name)) {
      // 수동 선수 목록에서 삭제
      setManualPlayers(mp => mp.filter(p => p !== name));
    } else {
      // 추천 선수 목록에서 삭제
      setRecommendedPlayers(rp => rp.filter(p => p !== name));
    }
  };

  // 카테고리 토글 (최대 5개)
  const allColumns = [
    'Gls','Ast','xG','npxG','xAG','G/Sh','KP','PPA','SCA','SCA90',
    'Sh','Sh/90','SoT','SoT/90','PrgC','Carries','PrgDist_stats_possession','PrgP',
    'Tkl','Tkl%','Int','Recov'
  ];
  const handleToggleColumn = col => {
    if (columns.includes(col)) {
      setColumns(cs => cs.filter(x => x !== col));
    } else if (columns.length < 5) {
      setColumns(cs => [...cs, col]);
    } else {
      alert('카테고리는 최대 5개까지 선택 가능합니다.');
    }
  };

  // Dancing 기준 컬럼 토글
  const handleCategoryClick = col => {
    setBaseline(b => (b === col ? null : col));
  };

  // 추천 로직
  useEffect(() => {
    if (!rawData || manualPlayers.length === 0 || columns.length === 0) {
      setRecommendedPlayers([]);
      return;
    }
    const base = manualPlayers[0];
    const baseRow = rawData.find(d => d.Player === base);
    if (!baseRow) return;
    const baseMV = +baseRow.market_value;

    const higher = rawData.filter(
      d => !manualPlayers.includes(d.Player) && +d.market_value > baseMV
    );
    const lower = rawData.filter(
      d => !manualPlayers.includes(d.Player) && +d.market_value < baseMV
    );

    const sortByRankSum = arr =>
      arr
        .map(d => {
          const sum = columns.reduce((acc, c) => {
            const raw = d[`${c}_rank`];
            // 랭크가 유효한 숫자면 변환, 아니면 Infinity
            const num = (raw != null && raw !== '')
              ? +raw
              : Infinity;
            return acc + num;
          }, 0);
          return { player: d.Player, sum };
        })
        .sort((a, b) => a.sum - b.sum)
        .map(x => x.player);

    const topHigh = sortByRankSum(higher).slice(0, 4);
    const topLow  = sortByRankSum(lower).slice(0, 4);

    setRecommendedPlayers([...topHigh, ...topLow]);
  }, [rawData, manualPlayers, columns]);

  return (
    <div className="app">
      <h1 className="app-title">Player Comparison</h1>
      <div className="container">
        <div className="sidebar">
          {/* Categories */}
          <div className="box categories-box">
            <div className="category-list">
              {allColumns.map(col => (
                <label key={col} className="category-item">
                  <input
                    type="checkbox"
                    checked={columns.includes(col)}
                    onChange={() => handleToggleColumn(col)}
                  />
                  {col}
                </label>
              ))}
            </div>
          </div>

          {/* 선수 추가 */}
          <div className="box add-box">
            <input
              className="add-input-pill"
              type="text"
              placeholder="선수 이름 입력 후 Enter"
              value={inputName}
              onChange={e => setInputName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddPlayer()}
            />
          </div>

          {/* 현재 플레이어 (수동 추가 + 추천) */}
          <div className="box current-box">
            <h3>플레이어 목록</h3>
            <ul className="current-list">
           {[...manualPlayers, ...recommendedPlayers].map(name => {
             const isRecommended = !manualPlayers.includes(name);
             return (
               <li
                 key={name}
                 style={{ opacity: isRecommended ? 0.5 : 1 }}
               >
                 <span>{name}</span>
                 <button
                   className="remove-btn"
                   onClick={() => handleRemovePlayer(name)}
                 >─</button>
               </li>
             );
           })}
            </ul>
          </div>
        </div>

        {/* 차트 */}
        <div className="chart-area">
          <StackedChart
            data={rawData}
            players={chartPlayers}
            columns={columns}
            baseline={baseline}
            onCategoryClick={handleCategoryClick}
            manualCount={manualPlayers.length}
          />
        </div>
      </div>
    </div>
  );
}
