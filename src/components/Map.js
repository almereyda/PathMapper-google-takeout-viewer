import React, { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import ColorFilterControls from './ColorFilterControls';

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

const NYC_COORDINATES = [-74.006, 40.7128];
const DEFAULT_ZOOM = 11;

const activityColors = {
  WALKING: '#4CAF50',
  CYCLING: '#2196F3',
  RUNNING: '#FF5722',
  IN_PASSENGER_VEHICLE: '#FFC107',
  IN_BUS: '#9161f2',
  FLYING: '#ff3319',
  IN_TRAIN: '#a10b2b',
  SKIING: '#29bdad',
  UNKNOWN_ACTIVITY_TYPE: '#bcd382',
};

const LINE_WIDTH = 1.5;
const LINE_OPACITY = 0.6;

// Custom Popup class
class GlassPopup extends mapboxgl.Popup {
  setDOMContent(content) {
    super.setDOMContent(content);
    if (this._content) {
      this._content.classList.add('glass-panel', 'text-white');
    }
    return this;
  }
}

const Map = ({ locationData, activityTypes }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [filter, setFilter] = useState('all');
  const [showPlaceVisits, setShowPlaceVisits] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [userInteracted, setUserInteracted] = useState(false);

  const updateMap = useCallback(() => {
    if (!map.current || !mapLoaded || !locationData) return;

    // Remove existing layers and sources
    ['routes', 'place-visits'].forEach(layer => {
      if (map.current.getLayer(layer)) map.current.removeLayer(layer);
      if (map.current.getSource(layer)) map.current.removeSource(layer);
    });

    // Add routes
    const routes = locationData.routes || [];
    const filteredRoutes = routes.filter(item =>
      item.activityType !== 'IN_SUBWAY' &&
      (filter === 'all' || item.activityType === filter)
    );

    map.current.addSource('routes', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: filteredRoutes.map(route => ({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: route.coordinates
          },
          properties: {
            ...route
          }
        }))
      }
    });

    map.current.addLayer({
      id: 'routes',
      type: 'line',
      source: 'routes',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': [
          'match',
          ['get', 'activityType'],
          ...Object.entries(activityColors).flat(),
          '#888888'
        ],
        'line-width': LINE_WIDTH,
        'line-opacity': LINE_OPACITY
      }
    });

    // Add place visits
    const placeVisits = locationData.placeVisits || [];
    if (showPlaceVisits && placeVisits.length > 0) {
      map.current.addSource('place-visits', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: placeVisits.map(visit => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: visit.coordinates
            },
            properties: {
              name: visit.name,
              address: visit.address,
              semanticType: visit.semanticType,
              startTime: visit.startTime,
              endTime: visit.endTime,
              confidence: visit.confidence,
              placeId: visit.placeId
            }
          }))
        }
      });

      map.current.addLayer({
        id: 'place-visits',
        type: 'circle',
        source: 'place-visits',
        paint: {
          'circle-radius': 6,
          'circle-color': '#FF1493',
          'circle-opacity': 0.7
        }
      });

      // Add a popup for place visits
      // Update the place visits popup creation:
      map.current.on('click', 'place-visits', (e) => {
        const coordinates = e.features[0].geometry.coordinates.slice();
        const properties = e.features[0].properties;

        const popupContent = document.createElement('div');
        popupContent.innerHTML = `
      <div class="p-4">
        <h3 class="text-lg font-semibold mb-2">${properties.name || 'Unnamed Place'}</h3>
        <p class="mb-1"><strong>Address:</strong> ${properties.address || 'N/A'}</p>
        <p class="mb-1"><strong>Type:</strong> ${properties.semanticType || 'N/A'}</p>
        <p class="mb-1"><strong>Visit Start:</strong> ${new Date(properties.startTime).toLocaleString()}</p>
        <p class="mb-1"><strong>Visit End:</strong> ${new Date(properties.endTime).toLocaleString()}</p>
      </div>
    `;

        new GlassPopup()
          .setLngLat(coordinates)
          .setDOMContent(popupContent)
          .addTo(map.current);
      });

      // Change cursor to pointer when hovering over a place visit
      map.current.on('mouseenter', 'place-visits', () => {
        map.current.getCanvas().style.cursor = 'pointer';
      });

      map.current.on('mouseleave', 'place-visits', () => {
        map.current.getCanvas().style.cursor = '';
      });
    }

    // Only fit bounds if user has interacted with the map
    if (userInteracted) {
      const bounds = new mapboxgl.LngLatBounds();
      filteredRoutes.forEach(route => {
        route.coordinates.forEach(coord => bounds.extend(coord));
      });
      if (showPlaceVisits) {
        placeVisits.forEach(visit => {
          bounds.extend(visit.coordinates);
        });
      }

      if (!bounds.isEmpty()) {
        map.current.fitBounds(bounds, {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          maxZoom: 15  // Limit maximum zoom level
        });
      }
    }

  }, [locationData, filter, showPlaceVisits, mapLoaded, userInteracted]);

  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v10',
      center: NYC_COORDINATES,
      zoom: DEFAULT_ZOOM
    });

    map.current.on('load', () => {
      map.current.addControl(new mapboxgl.NavigationControl());
      setMapLoaded(true);
    });

    map.current.on('click', 'routes', (e) => {
      if (e.features.length > 0) {
        const feature = e.features[0];
        setSelectedTrip(feature.properties);
      }
    });

    // Set userInteracted to true when the user moves the map
    map.current.on('movestart', () => setUserInteracted(true));

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mapLoaded && locationData && locationData.routes && locationData.routes.length > 0) {
      updateMap();
    }
  }, [mapLoaded, locationData, updateMap]);

  return (
    <div className="relative w-full h-screen">
      <div ref={mapContainer} className="absolute inset-0" />
      <div className="absolute top-4 left-4 z-10">
        <ColorFilterControls
          onFilterChange={setFilter}
          activityTypes={activityTypes.filter(type => type !== 'IN_SUBWAY')}
          activityColors={activityColors}
          showPlaceVisits={showPlaceVisits}
          onTogglePlaceVisits={() => setShowPlaceVisits(!showPlaceVisits)}
        />
      </div>
      {selectedTrip && (
        <div className="trip-info absolute bottom-4 left-4 z-10 p-4 glass-panel rounded-lg shadow-lg text-white">
          <h3 className="text-lg font-semibold">{selectedTrip.activityType}</h3>
          <p>Start Time: {new Date(selectedTrip.startTime).toLocaleString()}</p>
          <p>End Time: {new Date(selectedTrip.endTime).toLocaleString()}</p>
          <p>Duration: {((new Date(selectedTrip.endTime) - new Date(selectedTrip.startTime)) / 60000).toFixed(2)} minutes</p>
          <div className="mt-2 mb-2 bg-gray-800 p-2 rounded overflow-auto max-h-40">
            <pre className="text-xs">{JSON.stringify(selectedTrip, null, 2)}</pre>
          </div>
          <button
            className="mt-2 px-2 py-1 bg-blue-500 rounded hover:bg-blue-600"
            onClick={() => setSelectedTrip(null)}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default Map;