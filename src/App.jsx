// src/App.jsx
import { useState, useEffect } from 'react';
import * as d3 from 'd3';
import Formation from './components/Formation';
import Header from './components/Header';
import TeamStat from './components/TeamStat';
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
  
  // 2) player_stat.csv에서 팀별로 집계한 결과를 저장
  const [teamAggregates, setTeamAggregates] = useState({});

  // 3) 각 지표별 “전체 팀 중 최대값” 저장
  const [maxStats, setMaxStats] = useState({});

  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(null);


  // Formation 구성용
  const [teamName, setTeamName] = useState('Tottenham'); // 사용자가 검색한 팀 이름
  const [playersIn433, setPlayersIn433] = useState([]); // 포메이션에 그릴 선수 리스트
  const [playersLoading, setPlayersLoading] = useState(false);
  const [playersError, setPlayersError]     = useState(null);

  useEffect(() => {
    setStatsLoading(true);
    setStatsError(null);

    d3.csv('/player_stat.csv')
      .then((data) => {
        // 1) 숫자 필드(parse) - CSV는 문자열로 올 수 있으므로, 숫자형태로 바꿔 줍니다.
        data.forEach((d) => {
          d.Gls = Number(d.Gls) || 0;
          d.xG = Number(d.xG) || 0;
          d.xAG = Number(d.xAG) || 0;
          d.SoT = Number(d.SoT) || 0;
          d.Int = Number(d.Int) || 0;
          d.Recov = Number(d.Recov) || 0;
        });

        // 2) “팀명(Squad)별 집계” 계산
        //    { SquadName: { Gls: sum, xG: sum, xAG: sum, SoT: sum, Int: sum, Recov: sum } }
        const aggregates = {};
        data.forEach((d) => {
          const team = d.Squad.trim();
          if (!aggregates[team]) {
            aggregates[team] = { Gls: 0, xG: 0, xAG: 0, SoT: 0, Int: 0, Recov: 0 };
          }
          aggregates[team].Gls += d.Gls;
          aggregates[team].xG += d.xG;
          aggregates[team].xAG += d.xAG;
          aggregates[team].SoT += d.SoT;
          aggregates[team].Int += d.Int;
          aggregates[team].Recov += d.Recov;
        });

        // 3) 각 지표별 “전체 팀 중 최대값(max)” 계산
        const maxStatsTemp = { Gls: 0, xG: 0, xAG: 0, SoT: 0, Int: 0, Recov: 0 };
        Object.values(aggregates).forEach((stats) => {
          if (stats.Gls   > maxStatsTemp.Gls)   maxStatsTemp.Gls = stats.Gls;
          if (stats.xG    > maxStatsTemp.xG)    maxStatsTemp.xG = stats.xG;
          if (stats.xAG   > maxStatsTemp.xAG)   maxStatsTemp.xAG = stats.xAG;
          if (stats.SoT   > maxStatsTemp.SoT)   maxStatsTemp.SoT = stats.SoT;
          if (stats.Int   > maxStatsTemp.Int)   maxStatsTemp.Int = stats.Int;
          if (stats.Recov > maxStatsTemp.Recov) maxStatsTemp.Recov = stats.Recov;
        });

        setTeamAggregates(aggregates);
        setMaxStats(maxStatsTemp);
        setStatsLoading(false);
      })
      .catch((err) => {
        console.error('player_stat.csv 로드 실패:', err);
        setStatsError('Team의 통계 데이터를 불러올 수 없습니다.');
        setStatsLoading(false);
      });
  }, []); 


  useEffect(() => {

	setPlayersLoading(true);
	setPlayersError(null);

    d3.csv('/players_big5.csv')
      .then((data) => {

        const teamPlayers = data.filter(
          (p) => p.current_club_name === teamName
        );

        const starters = []; // 선수 명단 

		// GK
        const gkCandidates = teamPlayers
          .filter((p) => p.sub_position === 'Goalkeeper')
          .sort((a, b) => parseValue(b.market_value_in_eur) - parseValue(a.market_value_in_eur));

        if (gkCandidates.length > 0) {
          const gk = gkCandidates[0];
          starters.push({
            id: gk.player_id,
            x: POSITION_COORDS_433.GK.x,
            y: POSITION_COORDS_433.GK.y,
            color: '#CCCCCC',
            label: gk.name,
			name: gk.name,
			image_url: gk.image_url,                 
			country_of_citizenship: gk.country_of_citizenship,
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
          .sort((a, b) => parseValue(b.market_value_in_eur) - parseValue(a.market_value_in_eur));

        cbCandidates.slice(0, 2).forEach((p, idx) => {
          const coord = idx === 0
            ? POSITION_COORDS_433.LCB
            : POSITION_COORDS_433.RCB;
          starters.push({
            id: p.player_id,
            x: coord.x,
            y: coord.y,
            color: '#0074D9',
            label: p.name,
			name: p.name,
			image_url: p.image_url,                 
			country_of_citizenship: p.country_of_citizenship,
          });
        });

        const lbCandidates = teamPlayers
          .filter((p) => p.sub_position === 'Left-Back')
          .sort((a, b) => parseValue(b.market_value_in_eur) - parseValue(a.market_value_in_eur));

        if (lbCandidates.length > 0) {
          const lb = lbCandidates[0];
          starters.push({
            id: lb.player_id,
            x: POSITION_COORDS_433.LB.x,
            y: POSITION_COORDS_433.LB.y,
            color: '#0074D9',
            label: lb.name,
			name: lb.name,
			image_url: lb.image_url,                 
			country_of_citizenship: lb.country_of_citizenship,
          });
        }

        const rbCandidates = teamPlayers
          .filter((p) => p.sub_position === 'Right-Back')
          .sort((a, b) => parseValue(b.market_value_in_eur) - parseValue(a.market_value_in_eur));

        if (rbCandidates.length > 0) {
          const rb = rbCandidates[0];
          starters.push({
            id: rb.player_id,
            x: POSITION_COORDS_433.RB.x,
            y: POSITION_COORDS_433.RB.y,
            color: '#0074D9',
            label: rb.name,
			name: rb.name,
			image_url: rb.image_url,                 
			country_of_citizenship: rb.country_of_citizenship,
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
          .sort((a, b) => parseValue(b.market_value_in_eur) - parseValue(a.market_value_in_eur))
          .slice(0, 3);

        midCandidates.forEach((p, idx) => {
          let coord;
          if (idx === 0) coord = POSITION_COORDS_433.LM;
          else if (idx === 1) coord = POSITION_COORDS_433.CM;
          else coord = POSITION_COORDS_433.RM;

          starters.push({
            id: p.player_id,
            x: coord.x,
            y: coord.y,
            color: '#FF4136',
            label: p.name,
			name: p.name,
			image_url: p.image_url,                 
			country_of_citizenship: p.country_of_citizenship,
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
          .sort((a, b) => parseValue(b.market_value_in_eur) - parseValue(a.market_value_in_eur));


        if (fwCandidates.length > 0) {
          const lf = fwCandidates.find((p) => p.sub_position === 'Left Winger') || fwCandidates[0];
          starters.push({
            id: lf.player_id,
            x: POSITION_COORDS_433.LF.x,
            y: POSITION_COORDS_433.LF.y,
            color: '#2ECC40',
            label: lf.name,
			name: lf.name,
			image_url: lf.image_url,                 
			country_of_citizenship: lf.country_of_citizenship,
          });
        }

        if (fwCandidates.length > 1) {
          const cf = fwCandidates.find(
            (p) => p.sub_position === 'Centre-Forward' || p.sub_position === 'Second Striker'
          ) || fwCandidates[1];
          starters.push({
            id: cf.player_id,
            x: POSITION_COORDS_433.CF.x,
            y: POSITION_COORDS_433.CF.y,
            color: '#2ECC40',
            label: cf.name,
			name: cf.name,
			image_url: cf.image_url,                 
			country_of_citizenship: cf.country_of_citizenship,
          });
        }

        if (fwCandidates.length > 2) {
          const rw = fwCandidates.find((p) => p.sub_position === 'Right Winger') || fwCandidates[2];
          starters.push({
            id: rw.player_id,
            x: POSITION_COORDS_433.RF.x,
            y: POSITION_COORDS_433.RF.y,
            color: '#2ECC40',
            label: rw.name,
			name: rw.name,
			image_url: rw.image_url,                 
			country_of_citizenship: rw.country_of_citizenship,
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

  // 사용자가 헤더에서 검색을 눌렀을 때 팀명을 받아와서 상태를 변경
  const handleTeamSearch = (searchTerm) => {
    setTeamName(searchTerm);
  };

  return (
    <div>
      <Header onSearch={handleTeamSearch} /> 

		<div>
		{/* 로딩 */}
		{playersLoading && <p>데이터를 불러오는 중입니다...</p>}

		{/* 에러 */}
		{playersError && <p style={{ color: 'red' }}>{playersError}</p>}

		{/* Formation 렌더링 */}
		{!playersLoading && !playersError && playersIn433.length > 0 && (
		<Formation width={600} height={350} players={playersIn433} />
		)}

		{/* 선수 리스트가 비어 있을 때(팀명이 잘못되었거나, 선수 없음) */}
		{!playersLoading && !playersError && playersIn433.length === 0 && (
		<p>“{teamName}” 팀의 선수 정보를 찾을 수 없습니다.</p>
		)}
		</div>
		
		<div style={{ width: 400, paddingLeft: 20 }}>
		<h3 style={{ marginTop: 0, color: '#205723' }}>Team’s Stat</h3>
		{statsLoading && <p>통계 로딩 중...</p>}
		{statsError && <p style={{ color: 'red' }}>{error}</p>}

		{/* selectedTeam의 통계가 있으면 Radar Chart 렌더링 */}
		{!statsLoading && !statsError && teamAggregates[teamName] && (
		<TeamStat
			stats={teamAggregates[teamName]}
			maxStats={maxStats}
			width={350}
			height={350}
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
  );
}

export default App;
