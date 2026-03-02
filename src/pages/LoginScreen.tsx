import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { Eye, EyeOff } from 'lucide-react';
import { authService } from '../utils/authService';


export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setCurrentUser } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    authService.initializeDefaultUsers();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await authService.login(username, password);

      if (user) {
        setCurrentUser(user.username);

        navigate('/menu');
      } else {
        setError('NIK atau Password salah!');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <div className="header" style={{ textAlign: 'center' }}>
          <img
            src={`${import.meta.env.BASE_URL}ISS.svg`}
            alt="ISS Track Logo"
            style={{
              width: '250px',
              height: 'auto',
              marginBottom: '1rem',
            }}
          />
        </div>


        <form onSubmit={handleLogin}>
          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="label">NIK</label>
            <input
              type="text"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan NIK"
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan Password"
                required
                autoComplete="current-password"
                style={{ paddingRight: '3rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6B7280'
                }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="button button-primary"
            disabled={!username || !password || loading}
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>

          <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#F3F4F6', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
            <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Default Password: Ind0f00d25</p>
          </div>
        </form>
      </div>
    </div>
  );
}