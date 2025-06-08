// src/components/PlayerDetail.jsx
import React from 'react';

const FIELD_LABELS = {
  Player:'Name',
  sub_position:'Position',
  Nation:'Nationality',
  Age:'Age',
  market_value:'Market Value',
  Squad:'Club',
  total_minutes:'Appearances (min)',
  Gls:'Goals',
  xG:'Expected Goals (xG)',
  Ast:'Assists',
  xAG:'Expected Assists (xAG)',
  PrgC:'Progressive Carries',
  Sh:'Shots',
  'Sh/90':'Shots per 90mins',
  SoT:'Shots on Target (SoT)',
  Carries:'Carries',
  PrgDist_stats_possession:'Progressive Distance',
  Recov:'Recoveries',
  'SoT/90':'SoT per 90mins',
  'G/Sh':'Goals per Shot (G/Sh)',
  KP:'Key Passes (KP)',
  Tkl:'Tackles (Tkl)',
  Int:'Interceptions (Int)',
  SCA:'Shot-Creating Actions',
  SCA90:'SCA per 90mins',
};

const formatValue = (field, val) => {

  if (field === 'market_value') {
    const withCommas = val.toLocaleString()
    return withCommas + ' €'
  }
  return val
};

export default function PlayerDetail({ playerStat }) {
  if (!playerStat) {
    return <div style={{ padding: 8 }}>선수 정보를 찾을 수 없습니다.</div>;
  }

  return (
    <div>
      {/* 사진은 CSS에서 이미 처리 */}
      <img src={playerStat.image_url} alt={playerStat.Player} />
      <dl>
        {Object.entries(FIELD_LABELS).map(([field, label]) => {
            const raw = playerStat[field]
            const display = formatValue(field, raw)
            return (
            <div className="detail-row" key={field}>
              <span className="detail-label">{label} : </span>
              <span className="detail-value">
                {display ?? '—'}
              </span>
            </div>
            );
        })}
      </dl>
    </div>
  );
}
