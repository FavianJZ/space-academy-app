import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import NewIntroScene from '../components/NewIntroScene';
import './IntroCutscene.css';

/**
 * IntroCutscene - Main intro scene component using the friend's THREE JS project
 * This component integrates the space cockpit experience with narrative
 */
const IntroCutscene: React.FC = () => {
  const navigate = useNavigate();

  const handleSceneComplete = useCallback(() => {
    // Navigate to the next scene after intro completes
    navigate('/bedroom');
  }, [navigate]);

  return (
    <div className="intro-cutscene-container">
      <NewIntroScene onComplete={handleSceneComplete} />
    </div>
  );
};

export default IntroCutscene;
