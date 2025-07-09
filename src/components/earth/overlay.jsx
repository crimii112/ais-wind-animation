import { useEffect, useRef } from 'react';

const OverlayCanvas = ({ width, height }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    console.log(ctx.getImageData(0, 0, width, height));
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        width,
        height,
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 2000,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
      }}
    />
  );
};

export { OverlayCanvas };
