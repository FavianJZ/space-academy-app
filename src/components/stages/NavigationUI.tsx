import React from 'react';
import type { NavigationRoute } from '../../types/threejs-intro.types';
import './NavigationUI.css';

interface NavigationUIProps {
  visible: boolean;
  onSelectRoute: (route: NavigationRoute) => void;
}

const routes: NavigationRoute[] = ['Mesin', 'Navigasi', 'Bensin', 'Blackhole'];

export const NavigationUI: React.FC<NavigationUIProps> = ({
  visible,
  onSelectRoute,
}) => {
  if (!visible) return null;

  return (
    <div id="nav-layer">
      <div className="nav-box">
        <h3 style={{ color: '#00ffff', marginBottom: '5px' }}>
          [ PERINGATAN SISTEM ]
        </h3>
        <p style={{ marginBottom: '20px', fontSize: '14px' }}>
          Navigasi otomatis terganggu. Silakan pilih rute manual menuju Planet Asal.
        </p>

        <div className="nav-grid">
          {routes.map((route) => {
            const labels: Record<NavigationRoute, string> = {
              'Mesin': '[ PERBAIKI MESIN UTAMA ]',
              'Navigasi': '[ KALIBRASI NAVIGASI MANUAL ]',
              'Bensin': '[ AKTIFKAN CADANGAN BAHAN BAKAR ]',
              'Blackhole': '[ MANUVER DARURAT: HINDARI BLACKHOLE ]',
            };
            return (
              <button
                key={route}
                className="nav-btn"
                data-path={route}
                onClick={() => onSelectRoute(route)}
              >
                {labels[route]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default NavigationUI;
