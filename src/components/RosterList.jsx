// src/RosterList.jsx

import React from 'react';
import './RosterList.css'; 

const RosterList = ({ teamPlayers = [], starters = [], onSelectPlayer, selectedPlayerId}) => {

  const starterIds = new Set(starters.map((p) => p.id));
  const remainingPlayers = teamPlayers.filter((p) => !starterIds.has(p.Player_Id));

  const handleDragStart = (e, playerId) => {
    e.dataTransfer.setData('text/plain', playerId);
    e.dataTransfer.effectAllowed = 'move';
  };


  return (
    <div className="roster-list">
      <h3>Roster</h3>
      {remainingPlayers.length === 0 ? (
        <p>포메이션 외에 남은 선수가 없습니다.</p>
      ) : (
        <ul>
          {remainingPlayers.map((p) => {
            const isSelected = p.Player_Id === selectedPlayerId;
            return(
            <li 
                key={p.Player_Id} 
                className= {"roster-item" + (isSelected ? ' selected' : '')}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, p.Player_Id)}
                onClick={() => onSelectPlayer(p.Player_Id)}
            >
              <span className="player-name">{p.Player}</span>
              <span className="player-pos">({p.Pos})</span>
            </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default RosterList;
