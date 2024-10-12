import React, { useState } from 'react';

const LoadData = ({ onDataLoaded }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLoadData = async () => {
    setIsLoading(true);
    setError(null);
    console.log('Starting to load data...');
    try {
      const response = await fetch('/api/location-data');
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load data');
      }
      
      const data = await response.json();
      console.log('Received data:', data);
      onDataLoaded(data);
    } catch (error) {
      console.error('Error loading data:', error);
      setError(error.message);
    }
    setIsLoading(false);
  };

  return (
    <div className="text-center">
      <button 
        onClick={handleLoadData} 
        disabled={isLoading}
        className={`px-4 py-2 rounded-md text-white font-semibold ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        {isLoading ? 'Loading...' : 'Load Location History'}
      </button>
      {error && <p className="mt-2 text-red-600">{error}</p>}
    </div>
  );
};

export default LoadData;