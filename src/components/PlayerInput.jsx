// src/components/PlayerInput.jsx
import React, { useState } from 'react';

export default function PlayerInput({ onAdd }) {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed === '') return;
    onAdd(trimmed);
    setName('');
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', marginBottom: '10px' }}>
      <input
        type="text"
        placeholder="플레이어 이름"
        value={name}
        onChange={e => setName(e.target.value)}
        style={{ flexGrow: 1, marginRight: '4px', padding: '4px' }}
      />
      <button type="submit" style={{ padding: '4px 8px' }}>추가</button>
    </form>
  );
}
