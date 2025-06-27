import React from 'react';
import styled from 'styled-components';
import MapNgii from './MapNgii';
import Ngii from './ngii';

const MapFrame = () => {
  return (
    <Container>
      <MapNgii>
        <Ngii />
      </MapNgii>
    </Container>
  );
};

export default MapFrame;

const Container = styled.div`
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  display: flex;

  .ol-attribution.ol-unselectable.ol-control.ol-uncollapsible {
    position: absolute;
    top: 93%;
    right: 2%;

    button {
      visibility: hidden;
    }
  }
`;
