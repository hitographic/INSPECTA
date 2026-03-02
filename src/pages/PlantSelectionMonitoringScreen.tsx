import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { authService } from '../utils/authService';

interface Plant {
  id: number;
  name: string;
}

const PlantSelectionMonitoringScreen: React.FC = () => {
  const navigate = useNavigate();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlants();
  }, []);

  const loadPlants = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      const allPlants = [
        { id: 1, name: 'Plant-1' },
        { id: 2, name: 'Plant-2' },
        { id: 3, name: 'Plant-3' }
      ];

      // Filter plants based on user's allowed_plants
      if (currentUser?.allowed_plants && currentUser.allowed_plants.length > 0) {
        const filteredPlants = allPlants.filter(plant =>
          currentUser.allowed_plants.includes(plant.name)
        );
        setPlants(filteredPlants);
      } else {
        // If no restriction, show all plants
        setPlants(allPlants);
      }
    } catch (error) {
      console.error('Error loading plants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlantSelect = (plantName: string) => {
    navigate('/monitoring-records', { state: { selectedPlant: plantName } });
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            border: '4px solid rgba(255,255,255,0.3)',
            borderTopColor: 'white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
          <p style={{ marginTop: '16px', color: 'white', fontSize: '16px' }}>Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', padding: '20px' }}>
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
        }}
      >
        <ArrowLeft size={24} color="#f97316" />
      </button>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ background: 'white', borderRadius: '24px', padding: '48px 32px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
          <h1 style={{ fontSize: '36px', fontWeight: '700', color: '#1a202c', marginBottom: '8px', textAlign: 'center' }}>
            Pilih Plant
          </h1>
          <p style={{ fontSize: '16px', color: '#718096', marginBottom: '40px', textAlign: 'center' }}>
            Pilih plant yang mau diinput
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {plants.map((plant) => (
              <button
                key={plant.id}
                onClick={() => handlePlantSelect(plant.name)}
                style={{
                  width: '100%',
                  background: 'white',
                  border: '2px solid #e5e7eb',
                  borderRadius: '16px',
                  padding: '24px',
                  fontSize: '24px',
                  fontWeight: '600',
                  color: '#1f2937',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#f97316';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(249,115,22,0.2)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {plant.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlantSelectionMonitoringScreen;
