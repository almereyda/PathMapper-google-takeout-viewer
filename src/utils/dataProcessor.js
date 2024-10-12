export const processLocationData = async (data) => {
  console.log('Processing location data:', JSON.stringify(data).slice(0, 1000));

  const processedData = {
    routes: [],
    placeVisits: []
  };

  if (Array.isArray(data)) {
    console.log('Data is an array with length:', data.length);
    data.forEach((item, index) => {
      if (item.coordinates && item.activityType) {
        console.log(`Processing item ${index}: ${JSON.stringify(item)}`);
        const parsedCoordinates = parseCoordinates(item.coordinates);
        if (parsedCoordinates.length > 0) {
          processedData.routes.push({
            coordinates: parsedCoordinates,
            activityType: item.activityType,
            startTime: item.startTime,
            endTime: item.endTime
          });
        } else {
          console.warn('Skipping route due to invalid coordinates:', item);
        }
      }
    });
  } else if (typeof data === 'object') {
    console.log('Data is an object');
    if (data.routes) {
      console.log('Processing routes:', data.routes.length);
      processedData.routes = data.routes;
    }
    if (data.placeVisits) {
      console.log('Processing placeVisits:', data.placeVisits.length);
      processedData.placeVisits = data.placeVisits;
    }
    if (data.timelineObjects) {
      console.log('Processing timelineObjects:', data.timelineObjects.length);
      data.timelineObjects.forEach((obj, index) => {
        console.log(`Processing timelineObject ${index}: ${JSON.stringify(obj).slice(0, 200)}`);
        if (obj.activitySegment) {
          const { startLocation, endLocation, waypointPath, activityType, duration } = obj.activitySegment;
          
          let coordinates;
          if (waypointPath && waypointPath.waypoints) {
            coordinates = waypointPath.waypoints.map(wp => [wp.lngE7 / 1e7, wp.latE7 / 1e7]);
          } else if (startLocation && endLocation) {
            coordinates = [
              [startLocation.longitudeE7 / 1e7, startLocation.latitudeE7 / 1e7],
              [endLocation.longitudeE7 / 1e7, endLocation.latitudeE7 / 1e7]
            ];
          }

          if (coordinates) {
            const parsedCoordinates = parseCoordinates(coordinates);
            if (parsedCoordinates.length > 0) {
              processedData.routes.push({ 
                coordinates: parsedCoordinates, 
                activityType,
                startTime: duration.startTimestamp,
                endTime: duration.endTimestamp
              });
            } else {
              console.warn('Skipping route due to invalid coordinates:', obj.activitySegment);
            }
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
    }
  }

  console.log('Processed data:', JSON.stringify(processedData).slice(0, 1000));
  return processedData;
};

const parseCoordinates = (coords) => {
  if (typeof coords === 'string') {
    try {
      return JSON.parse(coords).filter(coord => coord[0] !== null && coord[1] !== null);
    } catch (e) {
      console.error('Error parsing coordinates:', e);
      return [];
    }
  } else if (Array.isArray(coords)) {
    return coords.filter(coord => coord[0] !== null && coord[1] !== null);
  }
  return [];
};