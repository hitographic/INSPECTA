import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { PLANTS } from '../constants/AppConstants';
import { ArrowLeft, Database } from 'lucide-react';
import { authService } from '../utils/authService';

export default function PlantSelectionScreen() {
  const { setSelectedPlant, currentUser, isLoading } = useApp();
  const navigate = useNavigate();
  const allowedPlants = authService.getAllowedPlants();

  React.useEffect(() => {
    if (!isLoading && !currentUser) {
      navigate('/');
    }
  }, [currentUser, isLoading, navigate]);

  const handlePlantSelect = (plant: string) => {
    setSelectedPlant(plant);
    navigate('/records');
  };

  const handleBack = () => {
    navigate('/menu');
  };

  const handleMasterData = () => {
    navigate('/master-data');
  };

  if (isLoading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  const availablePlants = Object.keys(PLANTS).filter(plant => allowedPlants.includes(plant));
  const user = authService.getCurrentUser();
  const canAccessMasterData = authService.hasPermission('view_admin_panel') ||
                               authService.hasPermission('manage_master_data') ||
                               user?.role === 'manajer' ||
                               user?.role === 'supervisor';

  return (
    <div className="container">
      <button className="back-button" onClick={handleBack}>
        <ArrowLeft size={24} />
      </button>

      <div className="card">
        <div className="header">
          <h1 className="title">Pilih Plant</h1>
          <p className="subtitle">Pilih plant yang mau diinput</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {availablePlants.length > 0 ? availablePlants.map((plant) => (
            <button
              key={plant}
              className="button button-secondary"
              onClick={() => handlePlantSelect(plant)}
              style={{
                padding: '1.5rem',
                fontSize: '1.25rem',
                fontWeight: 'bold'
              }}
            >
              {plant}
            </button>
          )) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
              Anda tidak memiliki akses ke plant manapun. Silakan hubungi administrator.
            </div>
          )}

          {canAccessMasterData && (
            <div style={{
              marginTop: '1rem',
              paddingTop: '1.5rem',
              borderTop: '2px solid #E5E7EB'
            }}>
              <button
                className="button"
                onClick={handleMasterData}
                style={{
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: 'white',
                  padding: '1.25rem',
                  fontSize: '1.125rem',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  boxShadow: '0 4px 6px rgba(16, 185, 129, 0.3)',
                  border: 'none'
                }}
              >
                <Database size={24} />
                Master Data Management
              </button>
              <p style={{
                textAlign: 'center',
                marginTop: '0.75rem',
                fontSize: '0.875rem',
                color: '#6B7280'
              }}>
                Kelola Areas dan Bagian Sanitasi
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}