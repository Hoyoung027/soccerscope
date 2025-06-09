// src/components/Header.jsx
import React, { useState, useRef, useEffect } from 'react';
import './Header.css';

const Header = ({ onSearch, teamList = [] }) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const wrapperRef = useRef(null);

  const handleSubmit = e => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSearch(inputValue.trim());
      setInputValue('');
      setSuggestions([]);
    }
  };

  const handleChange = e => {
    const val = e.target.value;
    setInputValue(val);
    if (val) {
      const lower = val.toLowerCase();
      setSuggestions(
        teamList
          .filter(name => name.toLowerCase().includes(lower))
          .slice(0, 5)
      );
    } else {
      setSuggestions([]);
    }
  };

  const handleSelect = name => {
    onSearch(name);
    setInputValue('');
    setSuggestions([]);
  };

  useEffect(() => {
    const onClickOutside = e => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setSuggestions([]);
      }
    };
    document.addEventListener('click', onClickOutside);
    return () => document.removeEventListener('click', onClickOutside);
  }, []);

  return (
    <header className="header" ref={wrapperRef}>
      <div className="logo">⚽️ <strong>SoccerScope</strong></div>
      <form className="search-form" onSubmit={handleSubmit}>
        <input
          className="search-input"
          type="text"
          placeholder="Search the Team"
          value={inputValue}
          onChange={handleChange}
        />
        <button className="search-button" type="submit">Search</button>

        {suggestions.length > 0 && (
          <ul className="autocomplete">
            {suggestions.map(team => (
              <li key={team} onClick={() => handleSelect(team)}>
                {team}
              </li>
            ))}
          </ul>
        )}
      </form>
    </header>
  );
};

export default Header;
