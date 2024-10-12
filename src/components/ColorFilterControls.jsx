import React, { useState } from 'react';

const ColorFilterControls = ({ onFilterChange, activityTypes, activityColors, showPlaceVisits, onTogglePlaceVisits }) => {
  const [selectedFilter, setSelectedFilter] = useState('all');

  const handleFilterChange = (event) => {
    const filter = event.target.value;
    setSelectedFilter(filter);
    onFilterChange(filter);
  };

  const capitalizeFirstLetter = (string) => {
    if (typeof string !== 'string') return 'Unknown';
    return string.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };

  return (
    <div className="filter-popover bg-black bg-opacity-50 backdrop-filter backdrop-blur-lg p-4 rounded-lg shadow-lg">
      <div className="mb-4">
        <label htmlFor="filter" className="block text-sm font-medium text-white mb-1">Filter by:</label>
        <select 
          id="filter" 
          value={selectedFilter} 
          onChange={handleFilterChange} 
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg text-white"
        >
          <option value="all">All Activities</option>
          {activityTypes.map(type => (
            <option key={type || 'unknown'} value={type || ''}>
              {capitalizeFirstLetter(type)}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap gap-2">
        {Object.entries(activityColors).map(([activity, color]) => (
          <div key={activity} className="flex items-center">
            <div 
              className="w-4 h-4 rounded-full mr-2" 
              style={{ backgroundColor: color }}
            ></div>
            <span className="text-xs text-white">{capitalizeFirstLetter(activity)}</span>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={showPlaceVisits}
            onChange={onTogglePlaceVisits}
            className="form-checkbox h-5 w-5 text-blue-600"
          />
          <span className="text-white text-sm">Show Place Visits</span>
        </label>
      </div>
    </div>
  );
};

export default ColorFilterControls;