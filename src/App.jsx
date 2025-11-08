import { useEffect, useRef } from 'react'
import './App.css'
import { MainScene } from './scenes/MainScene'

function App() {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    if (canvasRef.current) {
      const scene = new MainScene(canvasRef.current);
      scene.initialize();

      return () => {
        scene.dispose();
      };
    }
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  )
}

export default App
