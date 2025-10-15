import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { authService } from '../utils/authService';

const PlantSelectionKlipingScreen: React.FC = () => {
  const navigate = useNavigate();
  const [plants, setPlants] = useState<string[]>([]);

  useEffect(() => {
    const allowedPlants = authService.getAllowedPlants();
    setPlants(allowedPlants);
  }, []);

  const handlePlantSelect = (plant: string) => {
    navigate('/kliping-records', { state: { plant } });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <button
        onClick={() => navigate('/menu')}
        style={{
          background: 'white',
          border: 'none',
          borderRadius: '16px',
          padding: '12px',
          marginBottom: '20px',
          cursor: 'pointer',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          alignSelf: 'flex-start',
        }}
      >
        <ArrowLeft size={24} color="#10b981" />
      </button>

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            background: 'white',
            borderRadius: '24px',
            padding: '48px',
            maxWidth: '600px',
            width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}
        >
          <h1
            style={{
              fontSize: '36px',
              fontWeight: '700',
              color: '#1a202c',
              marginBottom: '12px',
              textAlign: 'center',
            }}
          >
            Pilih Plant
          </h1>
          <p
            style={{
              fontSize: '16px',
              color: '#718096',
              marginBottom: '40px',
              textAlign: 'center',
            }}
          >
            Pilih plant yang mau diinput
          </p>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {plants.map((plant) => (
              <button
                key={plant}
                onClick={() => handlePlantSelect(plant)}
                style={{
                  padding: '24px',
                  borderRadius: '16px',
                  border: '2px solid #e2e8f0',
                  background: 'white',
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#2d3748',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(16, 185, 129, 0.2)';
                  e.currentTarget.style.borderColor = '#10b981';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                {plant}
              </button>
            ))}
          </div>
        </div>
      </div>

      
    </div>
  );
};

export default PlantSelectionKlipingScreen;
