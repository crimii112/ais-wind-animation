import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { MapNgii } from '@/components/map';
import { GisWindMap } from '@/components/ais/contents/gis-wind-map';

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
        </Routes>
        <ReactQueryDevtools initialIsOpen={false} />
      </div>
    </BrowserRouter>
  );
}

export default App;
