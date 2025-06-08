// src/components/TeamDetail.jsx
import { filter } from 'd3';
import React from 'react';

const FIELD_LABELS_FRONT = {
    name: 'Name',
}

const FIELD_LABELS_STATS = {
  total_market_value:'Market Value',
  Gls:'Goals',
  xG:'Expected Goals (xG)',
  xAG:'Expected Assists (xAG)',
  SoT:'Shots on Target (SoT)',
  Int:'Interceptions (Int)',
  Recov:'Recoveries',
}

const FIELD_LABELS_TEAM = {
  net_transfer_record:'Net Transfer',
  squad_size:'Squad Size',
  average_age:'Average Age',
  foreigners_number:'Foreigners (#)',
  foreigners_percentage:'Foreigners (%)',
  national_team_players:'National Team Players',
  stadium_seats:'Stadium Seats',
};

// 2) 포맷 함수: € 붙이고, % 붙이고
const formatTeamValue = (field, val) => {
  if (val == null) return '—';
  if (field === 'net_transfer_record') {
    const s = String(val).toLowerCase();
    const num = parseFloat(s.replace(/[^0-9\.\-]/g, '')) || 0;
    let amount = num;
    if (s.includes('m')) amount = num * 1_000_000;
    else if (s.includes('k')) amount = num * 1_000;
    val = Math.round(amount).toLocaleString() + ' €';
  }

  if (field === 'stadium_seats') {
    val = Number(val).toLocaleString();
  }

  if(field === 'xG') {
    const n = Number(val);
    val = isNaN(n) ? '—' : n.toFixed(1);
  }

  if(field === 'xAG') {
    const n = Number(val);
    val = isNaN(n) ? '—' : n.toFixed(1);
  }

  if(field === 'Recov') {
    val = Number(val).toLocaleString();
  }

  if(field === 'total_market_value'){
    val = Number(val).toLocaleString() + ' €';
  }
  return val;
};

export default function TeamDetail({ clubStat, teamAggregates}) {
  if (!clubStat) {
    return <div style={{ padding: 8 }}>팀 정보를 찾을 수 없습니다.</div>;
  }

  return (
    <div className="team-detail">
      <div className="team-detail-list">

        {Object.entries(FIELD_LABELS_FRONT).map(([field, label]) => {
          const raw = clubStat[field];
          const display = formatTeamValue(field, raw);
          return (
            <div className="detail-row" key={field}>
              <span className="detail-label">{label}:</span>
              <span className="detail-value">{display}</span>
            </div>
          );
        })}

        {Object.entries(FIELD_LABELS_STATS).map(([field, label]) => {
          const raw = teamAggregates[field];
          const display = formatTeamValue(field, raw);
          return (
            <div className="detail-row" key={field}>
              <span className="detail-label">{label}:</span>
              <span className="detail-value">{display}</span>
            </div>
          );
        })}

        {Object.entries(FIELD_LABELS_TEAM).map(([field, label]) => {
          const raw = clubStat[field];
          const display = formatTeamValue(field, raw);
          return (
            <div className="detail-row" key={field}>
              <span className="detail-label">{label}:</span>
              <span className="detail-value">{display}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
