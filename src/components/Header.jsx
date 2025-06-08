// src/components/Header.jsx
import React, { useState } from 'react';

const Header = ({ onSearch }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed) {
      onSearch(trimmed);
      setInputValue('');
    }
  };

  return (
    <header style={styles.header}>
      {/* 좌측 로고(앱 이름) */}
      <div style={styles.logo}>
        ⚽️ <strong>SoccerScope</strong>
      </div>

      {/* 우측 검색 폼 */}
      <form onSubmit={handleSubmit} style={styles.searchForm}>
        <input
          type="text"
          placeholder="Search the Team"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          style={styles.searchInput}
        />
        <button type="submit" style={styles.searchButton}>
          Search
        </button>
      </form>
    </header>
  );
};

export default Header;

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 20px',
    backgroundColor: '#205723',
    color: 'white',
    marginBottom: '10px',
  },
  logo: {
    fontSize: '1.2rem',
  },
  searchForm: {
    display: 'flex',
    alignItems: 'center',
  },
  searchInput: {
    padding: '4px 8px',
    borderRadius: '4px 0 0 4px',
    border: '1px solid #ccc',
    fontSize: '0.9rem',
    outline: 'none',
    width: '160px',
  },
  searchButton: {
    padding: '5px 10px',
    border: 'none',
    backgroundColor: '#3F7D2A', // 버튼 녹색
    color: 'white',
    borderRadius: '0 4px 4px 0',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
};
