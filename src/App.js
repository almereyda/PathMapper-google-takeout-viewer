import React, { useState, useEffect } from 'react';
import Map from './components/Map';
import { processLocationData } from './utils/dataProcessor';

const App = () => {
  const [locationData, setLocationData] = useState(null);
  const [activityTypes, setActivityTypes] = useState(['all']);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching location data');
        const response = await fetch('/api/location-data');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Received raw data:', data);

        // Process the data
        const processedData = await processLocationData(data);
        console.log('Processed data:', processedData);

        setLocationData(processedData);

        const types = [...new Set(processedData.routes.map(item => item.activityType).filter(Boolean))];
        console.log('Activity types:', types);
        setActivityTypes(['all', ...types]);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(`Failed to load data: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">{error}</div>;
  }

  console.log('Rendering App with locationData:', locationData);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-opacity-30 bg-black backdrop-filter backdrop-blur-lg py-2 shadow-lg">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold">PathMapper</h1>
        </div>
      </header>
      <main className="container mx-auto px-2 py-2 flex-grow">
        {locationData && (
          (locationData.routes && locationData.routes.length > 0) ||
          (locationData.placeVisits && locationData.placeVisits.length > 0)
        ) ? (
          <Map locationData={locationData} activityTypes={activityTypes} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-xl">No location data available</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;