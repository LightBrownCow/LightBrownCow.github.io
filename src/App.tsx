import {
  SpectrumVisualizer,
  type SpectrumSettings,
} from "./components/SpectrumVisualizer";

function App() {
  const settings: SpectrumSettings = {
    barCount: 12,
    pillCount: 40,
  };

  return (
    <>
      <SpectrumVisualizer settings={settings} />;
    </>
  );
}

export default App;
