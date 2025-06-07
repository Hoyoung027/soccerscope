// src/App.jsx
import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import Formation from './components/Formation';
import Header from './components/Header';
import TeamStat from './components/TeamStat';
import RosterList from './components/RosterList';
import PlayerDetail from './components/PlayerDetail';
import TeamDetail from './components/TeamDetail';
import Draggable from 'react-draggable';     

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

function App() {
  
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


  useEffect(() => {
    setStatsLoading(true);
    setStatsError(null);

    d3.csv('/stats.csv')
      .then((data) => {
        data.forEach(d => {
          d.Age = +parseInt(d.Age, 10) || 0;
          d.market_value = parseInt(d.market_value,10) || 0;
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
        setAllPlayerStats(data);

        // 팀별 집계
        const aggregates = {};
        data.forEach((d) => {
          const team = d.Squad.trim();
          if (!aggregates[team]) {
            aggregates[team] = { total_market_value: 0, Gls: 0, xG: 0, xAG: 0, SoT: 0, Int: 0, Recov: 0 };
          }
          aggregates[team].total_market_value += d.market_value;
          aggregates[team].Gls += d.Gls;
          aggregates[team].xG += d.xG;
          aggregates[team].xAG += d.xAG;
          aggregates[team].SoT += d.SoT;
          aggregates[team].Int += d.Int;
          aggregates[team].Recov += d.Recov;
        });

        setTeamAggregates(aggregates);
        setStatsLoading(false);
      })
      .catch((err) => {
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
    const isDraggedInField = playersIn433.some((p) => p.id === draggedPlayerId);
    const isTargetInField  = playersIn433.some((p) => p.id === targetStarterId);

    // Formation 내에서의 swap
    if (isDraggedInField && isTargetInField) {
      //  → 두 필드 선수를 교환(swap)
      const fieldCopy = [...playersIn433];
      // ① 두 선수의 인덱스를 찾고
      const idxDragged = fieldCopy.findIndex((p) => p.id === draggedPlayerId);
      const idxTarget  = fieldCopy.findIndex((p) => p.id === targetStarterId);
      if (idxDragged < 0 || idxTarget < 0) return;

      // ② 두 객체의 x,y 값을 서로 바꿔준다
      const tempX = fieldCopy[idxDragged].x;
      const tempY = fieldCopy[idxDragged].y;
      const tempPosType = fieldCopy[idxDragged].posType;

      fieldCopy[idxDragged].x = fieldCopy[idxTarget].x;
      fieldCopy[idxDragged].y = fieldCopy[idxTarget].y;
      fieldCopy[idxDragged].posType = fieldCopy[idxTarget].posType;

      fieldCopy[idxTarget].x = tempX;
      fieldCopy[idxTarget].y = tempY;
      fieldCopy[idxTarget].posType = tempPosType;

      // (옵션) 혹은 두 객체 전체를 통째로 바꿔 넣어도 됩니다:
      // [ fieldCopy[idxDragged], fieldCopy[idxTarget] ] = [ fieldCopy[idxTarget], fieldCopy[idxDragged] ];

      setPlayersIn433(fieldCopy);
      return;
    }

    // Roster와 Formation 간의 swap

    // 드롭된 “스타터”의 기존 정보를 playersIn433에서 꺼내기
    const oldStarter = playersIn433.find((p) => p.id === targetStarterId);
    if (!oldStarter) return;

    // 벤치(로스터)에서 드래그해 온 선수(원본 full 객체)를 teamPlayers에서 찾기
    const benchPlayer = teamPlayers.find((p) => p.Player_Id === draggedPlayerId);
    if (!benchPlayer) return;

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

    // ④ 새로운 playersIn433 배열 생성:  
    //    - oldStarter는 빼고(newStarter로 대체),  
    //    - 나머지 스타터는 그대로
    const updatedStarters = playersIn433.map((p) =>
      p.id === targetStarterId ? newStarter : p
    );

    setPlayersIn433(updatedStarters);
  };

  const handleSelectPlayer = (playerId) => {
    setSelectedPlayerId(playerId);
  };

  const handleShowClubDetail = () => setShowClubDetail(true);
  const handleCloseClubDetail = () => setShowClubDetail(false);

  return (
    <div className="app-container">

      {playersIn433.map((p) => (
        <img
          key={p.id}
          id={`drag-face-${p.id}`}
          src={p.image_url}           
          alt={p.name}
          style={{
            visibility: 'hidden',     
            width: 30,               
            objectFit: 'cover',
          }}
        />
      ))}

      <Header onSearch={handleTeamSearch} /> 
      <div className="content-container">

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

        <div className="formation-wrapper">
          {/* 로딩 */}
          {playersLoading && <p>데이터를 불러오는 중입니다...</p>}

          {/* 에러 */}
          {playersError && <p style={{ color: 'red' }}>{playersError}</p>}

          {/* Formation 렌더링 */}
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

          {/* 선수 리스트가 비어 있을 때(팀명이 잘못되었거나, 선수 없음) */}
          {!playersLoading && !playersError && playersIn433.length === 0 && (
          <p>“{teamName}” 팀의 선수 정보를 찾을 수 없습니다.</p>
          )}
		    </div>

        {selectedPlayerId && (
          <>
          <div
            className="detail-overlay"
            onClick={() => setSelectedPlayerId(null)}
          />    

         <Draggable nodeRef={detailRef} handle=".drag-handle">
           <div className="detail-wrapper" ref={detailRef}>
             <div className="drag-handle">Player Detail</div>
             <PlayerDetail
               playerStat={
                 allPlayerStats.find(d => d.Player_Id === selectedPlayerId)
               }
             />
           </div>
         </Draggable>
         </>
        )}
		
        <div className="stat-wrapper">
          <h3 style={{ marginTop: 0, color: '#205723' }}>Team’s Stat</h3>
          {statsLoading && <p>통계 로딩 중...</p>}
          {statsError && <p style={{ color: 'red' }}>{statsError}</p>}

          {/* selectedTeam의 통계가 있으면 Radar Chart 렌더링 */}
          {!statsLoading && !statsError && (
          <TeamStat
            teamAggregates={teamAggregates}
            selectedTeam={teamName}
            width={350}
            height={350}
            onDetailClick={handleShowClubDetail}
          />
          )}

          {/* 해당 팀의 통계가 없을 경우 */}
          {!statsLoading && !statsError && !teamAggregates[teamName] && (
          <p style={{ color: '#999' }}>
            “{teamName}” 팀의 통계를 찾을 수 없습니다.
          </p>
          )}
        </div>
      </div>

      {showClubDetail && (       
        <>
          <div className="detail-overlay" onClick={handleCloseClubDetail} />

          <Draggable nodeRef={detailRef} handle=".drag-handle">
            <div className="detail-wrapper" ref={detailRef}>
              <div className="drag-handle">
                Detail
                <button
                  style={{ float: 'right', border: 'none', background: 'transparent', cursor: 'pointer' }}
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
	</div>
  );
}

export default App;
