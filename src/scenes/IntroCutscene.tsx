import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import NewIntroScene from '../components/NewIntroScene';
import './IntroCutscene.css';

const IntroCutscene: React.FC = () => {
  const navigate = useNavigate();

  const handleSceneComplete = useCallback(() => {
    
    navigate('/bedroom');
  }, [navigate]);

  return (
    <div className="intro-cutscene-container">
      <NewIntroScene onComplete={handleSceneComplete} />
    </div>
  );
};

export default IntroCutscene;
