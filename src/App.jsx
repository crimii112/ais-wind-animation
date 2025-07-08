import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { MapNgii } from '@/components/map';
import { GisWindMap } from '@/components/wind/gis-wind-map';
import { GisWindMapTest } from '@/components/wind/gis-wind-map-test';
import { GisWindMapEarth } from '@/components/wind/gis-wind-map-earth';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen overflow-x-hidden bg-gray-100">
        <Routes>
          <Route
            path="/"
            element={
              <div className="w-screen h-screen">
                <MapNgii id="gisWindMap">
                  <GisWindMap mapId="gisWindMap" />
                </MapNgii>
              </div>
            }
          />
          <Route
            path="/test"
            element={
              <div className="w-screen h-screen">
                <MapNgii id="gisWindMapTest">
                  <GisWindMapTest mapId="gisWindMapTest" />
                </MapNgii>
              </div>
            }
          />
          <Route
            path="/earth"
            element={
              <div className="w-screen h-screen">
                <MapNgii id="gisWindMapEarth">
                  <GisWindMapEarth mapId="gisWindMapEarth" />
                </MapNgii>
              </div>
            }
          />
        </Routes>
        <ReactQueryDevtools initialIsOpen={false} />
      </div>
    </BrowserRouter>
  );
}

export default App;
