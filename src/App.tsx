import { Route, Routes } from "react-router-dom";
import {
  Bedroom,
  CharacterSelection,
  GameStage,
  IntroCutscene,
  Leaderboard,
  MainHub,
} from "./scenes";
import GameAudioDirector from "./components/common/GameAudioDirector";
import { AudioSettingsProvider } from "./components/common/AudioSettings";
import { useSupabaseSync } from "./hooks/useSupabaseSync";
import "./App.css";

function App() {
  
  useSupabaseSync();

  return (
    <AudioSettingsProvider>
      <GameAudioDirector />
      <Routes>
        <Route path="/" element={<CharacterSelection />} />
        <Route path="/intro" element={<IntroCutscene />} />
        <Route path="/bedroom" element={<Bedroom />} />
        <Route path="/mainhub" element={<MainHub />} />
        <Route path="/stage/:stageId" element={<GameStage />} />
        <Route path="/leaderboard" element={<Leaderboard />} />

        <Route path="*" element={<CharacterSelection />} />
      </Routes>
    </AudioSettingsProvider>
  );
}

export default App;
