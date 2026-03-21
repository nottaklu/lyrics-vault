import React from 'react';
import { Search } from 'lucide-react';

const SearchBar = ({ value, onChange }) => {
  return (
    <div className="search-container">
      <Search size={20} className="search-icon" />
      <input
        type="text"
        className="search-bar"
        placeholder="Search songs, keywords..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default SearchBar;
