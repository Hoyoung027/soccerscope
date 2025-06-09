// src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import Formation from './components/Formation';
import Header from './components/Header';
import TeamStat from './components/TeamStat';
import RosterList from './components/RosterList';
import PlayerDetail from './components/PlayerDetail';
import TeamDetail from './components/TeamDetail';
import Draggable from 'react-draggable';     
import StackedChart from './components/StackedChart';
import './App.css';

const POSITION_COORDS_433 = {
  GK:  { x: 0.5,  y: 0.90 },
  LB:  { x: 0.15, y: 0.75 },
  LCB: { x: 0.35, y: 0.75 },
  RCB: { x: 0.65, y: 0.75 },
  RB:  { x: 0.85, y: 0.75 },
  LM:  { x: 0.25, y: 0.50 },
  CM:  { x: 0.50, y: 0.50 },
  RM:  { x: 0.75, y: 0.50 },
  LF:  { x: 0.20, y: 0.25 },
  CF:  { x: 0.50, y: 0.17 },
  RF:  { x: 0.80, y: 0.25 },
};

const parseValue = (val) => {
  return Number(val) || 0;
};

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

const FIELD_LABELS_STATS = {
  total_market_value:'Market Value',
  Gls:'Goals',
  xG:'Expected Goals (xG)',
  xAG:'Expected Assists (xAG)',
  SoT:'Shots on Target (SoT)',
  Int:'Interceptions (Int)',
  Recov:'Recoveries',
}

export default function App() {

  // stats.csv에서 팀별로 집계한 결과를 저장
  const [teamAggregates, setTeamAggregates] = useState({});

  // 에러 확인용
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(null);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [playersError, setPlayersError]     = useState(null);
  

  // 선수 detail
  const [allPlayerStats, setAllPlayerStats] = useState([]);    
  const [selectedPlayerId, setSelectedPlayerId] = useState(null); 
  const detailRef = useRef(null); 

  // 팀 detail 
  const [allClubStats, setAllClubStats] = useState([]); 
  const [showClubDetail, setShowClubDetail] = useState(false);

  // Roster, Formation 구성용
  const [teamName, setTeamName] = useState('Tottenham'); 
  const [playersIn433, setPlayersIn433] = useState([]); 
  const [teamPlayers, setTeamPlayers] = useState([]);

  const [rawData, setRawData] = useState(null);
  const [columns, setColumns] = useState([]);
  const [baseline, setBaseline] = useState(null);

  const [origLineupStats, setOrigLineupStats] = useState(null);
  const [origMv, setOrigMv]  = useState(0);
  const [lineupDiffStats, setLineupDiffStats] = useState({});
  const [diffMv, setDiffMv] = useState(0);
  const [showImpactModal, setShowImpactModal] = useState(false);
  const impactRef = useRef(null);
  const [swapInfo, setSwapInfo] = useState({ out: '', in: '' });

  // 1) 수동으로 추가한 플레이어
  const [manualPlayers, setManualPlayers] = useState([]);
  // 2) 추천 로직으로 생성된 플레이어
  const [recommendedPlayers, setRecommendedPlayers] = useState([]);
  const [inputName, setInputName] = useState('');

  // 차트에 넘길 최종 선수 목록
  const chartPlayers = [...manualPlayers, ...recommendedPlayers];

  useEffect(() => {
    setStatsLoading(true);
    setStatsError(null);

    d3.csv('/stats.csv')
      .then((data) => {
        // --- 데이터 파싱 & 집계 ---
        data.forEach(d => {
          d.Player_Id = +d.Player_Id;  
          d.Age     = +parseInt(d.Age, 10) || 0;
          d.market_value = parseInt(d.market_value, 10) || 0;
          d.total_minutes = +d.total_minutes;
          d.Gls = +d.Gls;
          d.Ast = +d.Ast;
          d.xG = +d.xG;
          d.xAG = +d.xAG;
          d.PrgC = +d.PrgC;
          d.Sh = +d.Sh;
          d['Sh/90'] = +d['Sh/90'];
          d.SoT = +d.SoT;
          d['SoT/90'] = +d['SoT/90'];
          d['G/Sh'] = +d['G/Sh'];
          d.KP = +d.KP;
          d.Tkl = +d.Tkl;
          d.Int = +d.Int;
          d.SCA = +d.SCA;
          d['SCA90'] = +d['SCA90'];
          d.Carrie = +d.Carries;
          d.PrgDist_stats_possession = +d.PrgDist_stats_possession;
          d.Recov = +d.Recov;
        });

        // 팀별 집계
        const aggregates = {};
        data.forEach(d => {
          const team = d.Squad.trim();
          if (!aggregates[team]) {
            aggregates[team] = { total_market_value: 0, Gls: 0, xG: 0, xAG: 0, SoT: 0, Int: 0, Recov: 0 };
          }
          aggregates[team].total_market_value += d.market_value;
          aggregates[team].Gls  += d.Gls;
          aggregates[team].xG   += d.xG;
          aggregates[team].xAG  += d.xAG;
          aggregates[team].SoT  += d.SoT;
          aggregates[team].Int  += d.Int;
          aggregates[team].Recov+= d.Recov;
        });

        setAllPlayerStats(data);
        setTeamAggregates(aggregates);
        setStatsLoading(false);

        // 여기서 rawData랑 manualPlayers 초기값 세팅
        setRawData(data);
        if (data.length) {
          setManualPlayers([]);
        }
      })
      .catch(err => {
        console.error('stats.csv 로드 실패:', err);
        setStatsError('Team의 통계 데이터를 불러올 수 없습니다.');
        setStatsLoading(false);
      });
  }, []);
  useEffect(() => {

	setPlayersLoading(true);
	setPlayersError(null);

    d3.csv('/stats.csv')
      .then((data) => {

        data.forEach(d => {
          d.Player_Id = +d.Player_Id; 
        })

        const teamPlayers = data.filter(
          (p) => p.Squad === teamName
        );

        setTeamPlayers(teamPlayers);

        const starters = []; // 선수 명단 

		// GK
        const gkCandidates = teamPlayers
          .filter((p) => p.sub_position === 'Goalkeeper')
          .sort((a, b) => parseValue(b.total_minutes) - parseValue(a.total_minutes));

        if (gkCandidates.length > 0) {
          const gk = gkCandidates[0];
          starters.push({
            id: gk.Player_Id,
            x: POSITION_COORDS_433.GK.x,
            y: POSITION_COORDS_433.GK.y,
            color: '#CCCCCC',
            label: gk.Player,
            name: gk.Player,
            image_url: gk.image_url,                 
            nation: gk.Nation,
            posType: 'GK',
          });
        }

        const defenderSubPositions = [
          'Centre-Back',
          'Left-Back',
          'Right-Back',
        ];
        
		// CB는 Centre-Back 중 상위 2명을 LCB, RCB에 지정
        const cbCandidates = teamPlayers
          .filter((p) => p.sub_position === 'Centre-Back')
          .sort((a, b) => parseValue(b.total_minutes) - parseValue(a.total_minutes));

        cbCandidates.slice(0, 2).forEach((p, idx) => {
          const coord = idx === 0
            ? POSITION_COORDS_433.LCB
            : POSITION_COORDS_433.RCB;
          starters.push({
            id: p.Player_Id,
            x: coord.x,
            y: coord.y,
            color: '#0074D9',
            label: p.Player,
            name: p.Player,
            image_url: p.image_url,                 
            nation: p.Nation,
            posType: 'DF',
          });
        });

        const lbCandidates = teamPlayers
          .filter((p) => p.sub_position === 'Left-Back')
          .sort((a, b) => parseValue(b.total_minutes) - parseValue(a.total_minutes));

        if (lbCandidates.length > 0) {
          const lb = lbCandidates[0];
          starters.push({
            id: lb.Player_Id,
            x: POSITION_COORDS_433.LB.x,
            y: POSITION_COORDS_433.LB.y,
            color: '#0074D9',
            label: lb.Player,
            name: lb.Player,
            image_url: lb.image_url,                 
            nation: lb.Nation,
            posType: 'DF',
          });
        }

        const rbCandidates = teamPlayers
          .filter((p) => p.sub_position === 'Right-Back')
          .sort((a, b) => parseValue(b.total_minutes) - parseValue(a.total_minutes));

        if (rbCandidates.length > 0) {
          const rb = rbCandidates[0];
          starters.push({
            id: rb.Player_Id,
            x: POSITION_COORDS_433.RB.x,
            y: POSITION_COORDS_433.RB.y,
            color: '#0074D9',
            label: rb.Player,
            name: rb.Player,
            image_url: rb.image_url,                 
            nation: rb.Nation,
            posType: 'DF',
          });
        }

        // MF 3명 선발 후 LM, CM, RM에 배치치
        const midfielderSubPositions = [
          'Defensive Midfield',
          'Central Midfield',
          'Attacking Midfield',
          'Left Midfield',
          'Right Midfield',
        ];
        const midCandidates = teamPlayers
          .filter((p) => midfielderSubPositions.includes(p.sub_position))
          .sort((a, b) => parseValue(b.total_minutes) - parseValue(a.total_minutes))
          .slice(0, 3);

        midCandidates.forEach((p, idx) => {
          let coord;
          if (idx === 0) coord = POSITION_COORDS_433.LM;
          else if (idx === 1) coord = POSITION_COORDS_433.CM;
          else coord = POSITION_COORDS_433.RM;

          starters.push({
            id: p.Player_Id,
            x: coord.x,
            y: coord.y,
            color: '#FF4136',
            label: p.Player,
            name: p.Player,
            image_url: p.image_url,                 
            nation: p.Nation,
            posType: 'MF',
          });
        });

		// FW
        const forwardSubPositions = [
          'Left Winger',
          'Right Winger',
          'Centre-Forward',
          'Second Striker',
        ];
        const fwCandidates = teamPlayers
          .filter((p) => forwardSubPositions.includes(p.sub_position))
          .sort((a, b) => parseValue(b.total_minutes) - parseValue(a.total_minutes));


        if (fwCandidates.length > 0) {
          const lf = fwCandidates.find((p) => p.sub_position === 'Left Winger') || fwCandidates[0];
          starters.push({
            id: lf.Player_Id,
            x: POSITION_COORDS_433.LF.x,
            y: POSITION_COORDS_433.LF.y,
            color: '#2ECC40',
            label: lf.Player,
            name: lf.Player,
            image_url: lf.image_url,                 
            nation: lf.Nation,
            posType: 'FW',
          });
        }

        if (fwCandidates.length > 1) {
          const cf = fwCandidates.find(
            (p) => p.sub_position === 'Centre-Forward' || p.sub_position === 'Second Striker'
          ) || fwCandidates[1];
          starters.push({
            id: cf.Player_Id,
            x: POSITION_COORDS_433.CF.x,
            y: POSITION_COORDS_433.CF.y,
            color: '#2ECC40',
            label: cf.Player,
            name: cf.Player,
            image_url: cf.image_url,                 
            nation: cf.Nation,
            posType: 'FW',
          });
        }

        if (fwCandidates.length > 2) {
          const rw = fwCandidates.find((p) => p.sub_position === 'Right Winger') || fwCandidates[2];
          starters.push({
            id: rw.Player_Id,
            x: POSITION_COORDS_433.RF.x,
            y: POSITION_COORDS_433.RF.y,
            color: '#2ECC40',
            label: rw.Player,
            name: rw.Player,
            image_url: rw.image_url,                 
            nation: rw.Nation,
            posType:'FW',
          });
        }

        // 전체 선수 목록을 저장
        setPlayersIn433(starters);
		setPlayersLoading(false);
      })
      .catch((err) => {
        console.error('CSV 로드 실패:', err);
		setPlayersError('선수 데이터를 불러오지 못했습니다.');
        setPlayersLoading(false);
      });
  }, [teamName]);

  useEffect(() => {
    d3.csv('/clubs.csv').then(data => {
      setAllClubStats(data);
    }).catch(err => {
      console.error('팀 데이터를 불러오지 못했습니다.', err);
    });
  }, []);


  // 사용자가 헤더에서 검색을 눌렀을 때 팀명을 받아와서 상태를 변경
  const handleTeamSearch = (searchTerm) => {
    setTeamName(searchTerm);
  };

  // 선수 swap하는 함수
  const handleSwap = (draggedPlayerId, targetStarterId) => {

    // Foramation 내에서의 swap, Roster 선수와의 Swap을 구분
    // const isDraggedInField = playersIn433.some((p) => p.id === draggedPlayerId);
    // const isTargetInField  = playersIn433.some((p) => p.id === targetStarterId);
    
    const draggedIdNum = Number(draggedPlayerId);
    const targetIdNum  = Number(targetStarterId);

    const isDraggedInField = playersIn433.some(p => p.id === draggedIdNum);
    const isTargetInField  = playersIn433.some(p => p.id === targetIdNum);

    // Formation 내에서의 swap
    if (isDraggedInField && isTargetInField) {
      //  → 두 필드 선수를 교환(swap)
      const fieldCopy = [...playersIn433];
      // ① 두 선수의 인덱스를 찾고
      // const idxDragged = fieldCopy.findIndex((p) => p.id === draggedPlayerId);
      // const idxTarget  = fieldCopy.findIndex((p) => p.id === targetStarterId);
      
      const idxDragged = fieldCopy.findIndex(p => p.id === draggedIdNum);
      const idxTarget  = fieldCopy.findIndex(p => p.id === targetIdNum);
      
      if (idxDragged < 0 || idxTarget < 0) return;

      // 두 객체의 x,y 값을 서로 바꿔준다
      const tempX = fieldCopy[idxDragged].x;
      const tempY = fieldCopy[idxDragged].y;
      const tempPosType = fieldCopy[idxDragged].posType;

      fieldCopy[idxDragged].x = fieldCopy[idxTarget].x;
      fieldCopy[idxDragged].y = fieldCopy[idxTarget].y;
      fieldCopy[idxDragged].posType = fieldCopy[idxTarget].posType;

      fieldCopy[idxTarget].x = tempX;
      fieldCopy[idxTarget].y = tempY;
      fieldCopy[idxTarget].posType = tempPosType;


      [ fieldCopy[idxDragged], fieldCopy[idxTarget] ] = [ fieldCopy[idxTarget], fieldCopy[idxDragged] ];

      setPlayersIn433(fieldCopy);
      return;
    }

    // Roster와 Formation 간의 swap
    // 드롭된 “스타터”의 기존 정보를 playersIn433에서 꺼내기
    // const oldStarter = playersIn433.find((p) => p.id === targetStarterId);
    const oldStarter = playersIn433.find(p => p.id === targetIdNum);
    if (!oldStarter) {
      return;
    }

    // 벤치(로스터)에서 드래그해 온 선수(원본 full 객체)를 teamPlayers에서 찾기
    // const benchPlayer = teamPlayers.find((p) => p.Player_Id === draggedPlayerId);
    let benchPlayer = teamPlayers.find(p => p.Player_Id === draggedIdNum);

    if (!benchPlayer) {
      benchPlayer = rawData.find(d => d.Player_Id === draggedIdNum);    
    }

    if(!benchPlayer) {
      return;
    }

    setSwapInfo({ 
      out: oldStarter.name, 
      in: benchPlayer.Player 
    });

    // (B) Stats, Market Value 차이 계산
    const KEYS = ['Gls','xG','xAG','SoT','Int','Recov'];
    const diffStats = {};
    KEYS.forEach(k => {
      const oldVal = rawData.find(d => d.Player_Id === oldStarter.id)?.[k] || 0;
      const newVal = rawData.find(d => d.Player_Id === benchPlayer.Player_Id)?.[k] || 0;
      diffStats[k] = newVal - oldVal;
    });
    setLineupDiffStats(diffStats);

    const oldMv = rawData.find(d => d.Player_Id === oldStarter.id)?.market_value || 0;
    setDiffMv(benchPlayer.market_value - oldMv);

    // 벤치 선수를 새로 “스타터” 정보로 매핑:  
    // oldStarter.x, oldStarter.y, oldStarter.posType를 그대로 물려받음
    const newStarter = {
      id: benchPlayer.Player_Id,
      x: oldStarter.x,
      y: oldStarter.y,
      image_url: benchPlayer.image_url,
      nation: benchPlayer.Nation,
      name: benchPlayer.Player,
      posType: oldStarter.posType,
    };

    // 새로운 playersIn433 배열 생성:  
    const updatedStarters = playersIn433.map((p) =>
      // p.id === targetStarterId ? newStarter : p
      p.id === targetIdNum ? newStarter : p
    );

    setPlayersIn433(updatedStarters);
    setShowImpactModal(true);
  };


  const handleSelectPlayer = (playerId) => {
    setSelectedPlayerId(playerId);
  };

  const handleShowClubDetail = () => setShowClubDetail(true);
  const handleCloseClubDetail = () => setShowClubDetail(false);
  
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

  const handleRosterDrop = e => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    const player = teamPlayers.find(p => String(p.Player_Id) === String(draggedId));
    if (player && !manualPlayers.includes(player.Player)) {
      setManualPlayers(mp => [...mp, player.Player]);
    }
  };

  const handlePlayerListDrop = e => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    const player = teamPlayers.find(p => String(p.Player_Id) === String(draggedId));
    if (player && !manualPlayers.includes(player.Player)) {
      setManualPlayers(mp => [...mp, player.Player]);
    }
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
    <div className="app-container">
      {/* ===========================
          1) Header & 검색
      =========================== */}
      <Header onSearch={handleTeamSearch} />

      <div className="content-container">
        {/* ===========================
            2) Roster 목록
        =========================== */}
        <div className="roster-wrapper">
          {playersLoading ? (
            <p>선수 목록 로딩 중…</p>
          ) : playersError ? (
            <p style={{ color: 'red' }}>{playersError}</p>
          ) : (
            <RosterList
              teamPlayers={teamPlayers}
              starters={playersIn433}
              onSelectPlayer={handleSelectPlayer}
              selectedPlayerId={selectedPlayerId}
            />
          )}
        </div>

        {/* ===========================
            3) Formation 필드
        =========================== */}
        <div className="formation-wrapper">
          {playersLoading && <p>데이터를 불러오는 중입니다...</p>}
          {playersError && <p style={{ color: 'red' }}>{playersError}</p>}

          {!playersLoading && !playersError && playersIn433.length > 0 && (
            <Formation
              width={400}
              height={415}
              players={playersIn433}
              onSwap={handleSwap}
              selectedPlayerId={selectedPlayerId}
              onSelectPlayer={handleSelectPlayer}
            />
          )}

          {!playersLoading && !playersError && playersIn433.length === 0 && (
            <p>“{teamName}” 팀의 선수 정보를 찾을 수 없습니다.</p>
          )}
        </div>



        {/* ===========================
            4) Team Stat + Detail
        =========================== */}
        <div className="stat-wrapper">
          <h3 style={{ marginTop: 0, color: '#205723' }}>Team’s Stat</h3>
          {statsLoading && <p>통계 로딩 중...</p>}
          {statsError && <p style={{ color: 'red' }}>{statsError}</p>}

          {!statsLoading && !statsError && (
            <TeamStat
              teamAggregates={teamAggregates}
              selectedTeam={teamName}
              width={350}
              height={350}
              onDetailClick={handleShowClubDetail}
            />
          )}
          {!statsLoading && !statsError && !teamAggregates[teamName] && (
            <p style={{ color: '#999' }}>
              “{teamName}” 팀의 통계를 찾을 수 없습니다.
            </p>
          )}
        </div>
      </div>

      {/* ===========================
          5) Player Comparison 차트
      =========================== */}
      <div className="chart-wrapper">
        <div className="app">
          <h3 className="app-title">Player Comparison</h3>
          <div id="container">
            <div className="sidebar">
              <div className="box categories-box">
                <h3 className="box-title">Categories</h3>
                <div className="category-list">
                  {allColumns.map(col => (
                    <label key={col} className="category-item">
                      <input
                        type="checkbox"
                        checked={columns.includes(col)}
                        onChange={() => handleToggleColumn(col)}
                      />
                      {COLUMN_LABELS[col] || col}
                    </label>
                  ))}
                </div>
              </div>

              <div className="add-box">
                <div className="add-button-box">
                  <input
                    className="add-input"
                    type="text"
                    placeholder="Search the Player"
                    value={inputName}
                    onChange={e => setInputName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddPlayer()}
                  />
                  <button
                    className="add-btn"
                    onClick={handleAddPlayer}
                  >
                    Search
                  </button>
                </div>
              </div>


              <div className="box current-box">
                <h3 className="box-title">Player list</h3>
                <ul className="current-list"
                   onDragOver={e => e.preventDefault()}
                   onDrop={handleRosterDrop}
                >
                  {[...manualPlayers, ...recommendedPlayers].map(name => {
                    const isRec = !manualPlayers.includes(name);
                    const row = rawData.find(d => d.Player === name);
                    const playerId = row ? row.Player_Id : '';
                    return (
                      <li 
                        key={name} 
                        style={{ opacity: isRec ? 0.5 : 1 }}
                        draggable
                        onDragStart={e => {
                          e.dataTransfer.setData('text/plain', playerId);
                        }}
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

            <div className="chart-container">
                <div
                  className="chart-area"
                  onDragOver={e => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                  }}
                  onDrop={handleRosterDrop}
                >
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
        </div>
      </div>

      {/* ===========================
          6) 모달 오버레이들
      =========================== */}
      {selectedPlayerId && (
        <>
          <div className="detail-overlay" onClick={() => setSelectedPlayerId(null)} />
          <Draggable nodeRef={detailRef} handle=".drag-handle">
            <div className="detail-wrapper" ref={detailRef}>
              <div className="drag-handle">Player Detail</div>
              <PlayerDetail
                playerStat={allPlayerStats.find(d => d.Player_Id === selectedPlayerId)}
              />
            </div>
          </Draggable>
        </>
      )}

      {showClubDetail && (
        <>
          <div className="detail-overlay" onClick={handleCloseClubDetail} />
          <Draggable nodeRef={detailRef} handle=".drag-handle">
            <div className="detail-wrapper" ref={detailRef}>
              <div className="drag-handle">
                Detail
                <button
                  style={{
                    float: 'right',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer'
                  }}
                  onClick={handleCloseClubDetail}
                >✕</button>
              </div>
              <TeamDetail
                clubStat={allClubStats.find(d => d.name.trim() === teamName)}
                teamAggregates={teamAggregates[teamName]}
                selectedTeam={teamName}
              />
            </div>
          </Draggable>
        </>
      )}

      {showImpactModal && (
        <>
          <div className="detail-overlay" onClick={() => setShowImpactModal(false)} />
          <Draggable nodeRef={impactRef} handle=".drag-handle">
            <div className="detail-wrapper" ref={impactRef}>
              <div className="drag-handle">
                Squad Switch Impact
                <button
                  style={{
                    float: 'right',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer'
                  }}
                  onClick={() => setShowImpactModal(false)}
                >✕</button>
              </div>

              <div style={{ padding: '8px' }}>
                
                <div className="detail-row">
                  <span className="detail-label incoming ">In: </span>
                  <span className="detail-value incoming">{swapInfo.in}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label outgoing">Out: </span>
                  <span className="detail-value outgoing">{swapInfo.out}</span>
                </div>
              
                <div
                  className="detail-row"
                >
                  <span className="detail-label">Net Transfer : </span>
                  <span className="detail-value">
                    {diffMv >= 0 ? '+ ' : '- '}{Math.abs(diffMv).toLocaleString()} €
                  </span>
                </div>
                {Object.entries(lineupDiffStats).map(([key, val]) => (
                  <div
                    className="detail-row"
                    key={key}
                  >
                    <span className="detail-label">
                      {FIELD_LABELS_STATS[key] || key}
                    </span>
                    <span className="detail-value">
                      {val >= 0 ? ': + ' : ': - '}{Math.abs(val).toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Draggable>
        </>
      )}
    </div>
  );
  
}
