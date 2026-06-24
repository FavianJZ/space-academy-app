import { Route, Routes } from "react-router-dom";
import {
  Bedroom,
  CharacterSelection,
  GameStage,
  IntroCutscene,
  Leaderboard,
  MainHub,
} from "./scenes";
import "./App.css";

function App() {
  return (
    <Routes>
      <Route path="/" element={<CharacterSelection />} />
      <Route path="/intro" element={<IntroCutscene />} />
      <Route path="/bedroom" element={<Bedroom />} />
      <Route path="/mainhub" element={<MainHub />} />
      <Route path="/stage/:stageId" element={<GameStage />} />
      <Route path="/leaderboard" element={<Leaderboard />} />

      <Route path="*" element={<CharacterSelection />} />
    </Routes>
  );
}

export default App;