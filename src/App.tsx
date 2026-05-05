import { Routes, Route } from 'react-router-dom';
import CharacterSelection from './scenes/CharacterSelection';
import IntroCutscene from './scenes/IntroCutscene';
import Bedroom from './scenes/Bedroom';
import MainHub from './scenes/MainHub';
import GameStage from './scenes/GameStage';
import Leaderboard from './scenes/Leaderboard';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<CharacterSelection />} />
      <Route path="/intro" element={<IntroCutscene />} />
      <Route path="/bedroom" element={<Bedroom />} />
      <Route path="/mainhub" element={<MainHub />} />
      <Route path="/stage/:stageId" element={<GameStage />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
    </Routes>
  );
}

export default App;
