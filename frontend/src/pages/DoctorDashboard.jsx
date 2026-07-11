import React, { useState, useEffect } from 'react';
import { UserPlus, Activity, CheckCircle, Clock, Stethoscope, LogIn } from 'lucide-react';

export default function DoctorDashboard() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [doctorName, setDoctorName] = useState(localStorage.getItem('doctorName') || '');
  const [queue, setQueue] = useState([]);
  
  useEffect(() => {
    if (token) fetchQueue();
  }, [token]);

  const login = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.access_token);
        setDoctorName(data.full_name);
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('doctorName', data.full_name);
      } else {
        alert("Invalid login");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const logout = () => {
    setToken('');
    setDoctorName('');
    setQueue([]);
    localStorage.removeItem('token');
    localStorage.removeItem('doctorName');
  };

  const fetchQueue = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/doctor/queue`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setQueue(data);
      } else if (res.status === 401) {
        logout();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const acceptPatient = async (id) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/queue/${id}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        fetchQueue();
      } else {
        alert("Failed to accept patient.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!token) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '3rem 2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(6, 182, 212, 0.2)', color: 'var(--accent-secondary)', marginBottom: '1.5rem' }}>
              <Stethoscope size={32} />
            </div>
            <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Doctor Portal</h1>
            <p style={{ color: 'var(--text-muted)' }}>Secure login required</p>
          </div>
          
          <form onSubmit={login} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>Username</label>
              <input
                className="input-base"
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="doctor"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>Password</label>
              <input
                className="input-base"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="password"
              />
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop: '1rem', background: 'linear-gradient(135deg, var(--accent-secondary), #3b82f6)' }}>
              <LogIn size={20} /> Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>Triage Dashboard</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Welcome back, <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{doctorName}</span></p>
          </div>
          <button onClick={logout} className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)' }}>
            Logout
          </button>
        </div>

        {/* Queue Grid */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock color="var(--accent-primary)" /> Patients Waiting
            <span style={{ background: 'rgba(139, 92, 246, 0.2)', color: 'var(--accent-primary)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '1rem', marginLeft: '0.5rem' }}>
              {queue.length}
            </span>
          </h2>
          <button onClick={fetchQueue} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
            Refresh Queue
          </button>
        </div>

        {queue.length === 0 ? (
          <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', alignItems: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <CheckCircle size={32} />
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>All caught up!</h3>
            <p style={{ color: 'var(--text-muted)' }}>There are currently no patients waiting in the triage queue.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
            {queue.map(p => (
              <div key={p.id} className="glass-panel" style={{ padding: '0', display: 'block' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{p.patient_name}</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Age: {p.age}</p>
                    </div>
                    <span className={`ward-badge ward-${p.ward}`}>
                      {p.ward.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Reported Symptoms</p>
                    <p style={{ fontSize: '0.95rem', lineHeight: 1.5 }}>{p.symptoms}</p>
                  </div>
                  <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <p style={{ color: 'var(--accent-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Activity size={14} /> AI Reasoning
                    </p>
                    <p style={{ fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--text-muted)' }}>{p.reasoning}</p>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.1rem' }}>Status</p>
                      <p style={{ color: 'var(--warning)', fontWeight: 500, fontSize: '0.9rem' }}>{p.assigned_doctor}</p>
                    </div>
                    <button 
                      onClick={() => acceptPatient(p.id)}
                      className="btn-success"
                      style={{ width: '100%' }}
                    >
                      <UserPlus size={18} /> Accept Patient
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
