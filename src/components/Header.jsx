// src/components/Header.jsx
import React, { useState } from 'react';

/**
 * Header 컴포넌트
 *
 * 좌측: 로고(앱 이름)
 * 우측: 팀명 검색 폼
 *
 * Props:
 *  - onSearch (function): 사용자가 검색폼을 제출했을 때 호출될 콜백 (검색어를 인자로 받음)
 */
const Header = ({ onSearch }) => {
  const [inputValue, setInputValue] = useState('');

  // 폼 제출 시 호출
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

// 간단한 인라인 스타일 예시 (원하시면 CSS 클래스나 styled-components로 대체하셔도 됩니다)
const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 20px',
    backgroundColor: '#205723', // 짙은 녹색
    color: 'white',
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
