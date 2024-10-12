const express = require('express');
const fs = require('fs-extra');
const { glob } = require('glob');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

app.use(express.static(path.join(__dirname, 'build')));

app.get('/api/location-data', async (req, res) => {
  console.log('Received request for location data');
  const locationHistoryPath = path.join(__dirname, 'public', 'location_history');
  
  console.log('Accessing location history path:', locationHistoryPath);

  try {
    if (!await fs.pathExists(locationHistoryPath)) {
      console.log('Location history directory not found');
      return res.status(404).json({ error: 'Location history directory not found' });
    }

    console.log('Location history directory found, searching for JSON files...');
    const files = await glob(path.join(locationHistoryPath, '**', '*.json'));

    console.log(`Found ${files.length} JSON files`);

    if (files.length === 0) {
      console.log('No JSON files found in the location history directory');
      return res.status(404).json({ error: 'No JSON files found in the location history directory' });
    }

    const processedData = {
      routes: [],
      placeVisits: []
    };

    for (const file of files) {
      try {
        console.log(`Processing file: ${file}`);
        const fileContent = await fs.readFile(file, 'utf8');
        const json = JSON.parse(fileContent);

        console.log(`File content parsed, timelineObjects length: ${json.timelineObjects ? json.timelineObjects.length : 'undefined'}`);

        if (json.timelineObjects && Array.isArray(json.timelineObjects)) {
          json.timelineObjects.forEach(obj => {
            if (obj.activitySegment) {
              const { startLocation, endLocation, waypointPath, activityType, duration } = obj.activitySegment;
              
              if (waypointPath && waypointPath.waypoints) {
                const coordinates = waypointPath.waypoints.map(wp => [wp.lngE7 / 1e7, wp.latE7 / 1e7]);
                processedData.routes.push({ coordinates, activityType, startTime: duration.startTimestamp, endTime: duration.endTimestamp });
              } else if (startLocation && endLocation) {
                const coordinates = [
                  [startLocation.longitudeE7 / 1e7, startLocation.latitudeE7 / 1e7],
                  [endLocation.longitudeE7 / 1e7, endLocation.latitudeE7 / 1e7]
                ];
                processedData.routes.push({ coordinates, activityType, startTime: duration.startTimestamp, endTime: duration.endTimestamp });
              }
            } else if (obj.placeVisit) {
              const { location, duration, placeConfidence, centerLatE7, centerLngE7 } = obj.placeVisit;
              processedData.placeVisits.push({
                coordinates: [centerLngE7 / 1e7, centerLatE7 / 1e7],
                name: location.name || location.address,
                semanticType: location.semanticType,
                startTime: duration.startTimestamp,
                endTime: duration.endTimestamp,
                confidence: placeConfidence,
                address: location.address,
                placeId: location.placeId
              });
            }
          });
        } else {
          console.warn(`File ${file} does not contain a valid timelineObjects array`);
        }
      } catch (error) {
        console.error(`Error processing file ${file}:`, error);
      }
    }

    console.log(`Processed ${processedData.routes.length} routes and ${processedData.placeVisits.length} place visits`);
    console.log('Sample processed data:', JSON.stringify(processedData).slice(0, 1000));
    res.json(processedData);
  } catch (error) {
    console.error('Error processing location data:', error);
    res.status(500).json({ error: 'Error processing location data', details: error.message });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});