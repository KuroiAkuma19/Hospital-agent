import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, AlertCircle, Activity, CheckCircle, Clock } from 'lucide-react';

export default function PatientChat() {
  const [phase, setPhase] = useState('details'); // details, chat, complete
  const [patientDetails, setPatientDetails] = useState({ name: '', age: '' });
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [queueStatus, setQueueStatus] = useState('waiting');
  
  const endOfMessagesRef = useRef(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (phase === 'complete' && result?.queue_id) {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/queue/${result.queue_id}/status`);
          if (res.ok) {
            const data = await res.json();
            setQueueStatus(data.status);
            if (data.assigned_doctor) {
              setResult(prev => ({...prev, assigned_doctor: data.assigned_doctor}));
            }
            if (data.status === 'accepted') {
              clearInterval(interval);
            }
          }
        } catch (err) {
          console.error(err);
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [phase, result]);

  const handleDetailsSubmit = (e) => {
    e.preventDefault();
    if (patientDetails.name && patientDetails.age) {
      setPhase('chat');
      setMessages([{ role: 'assistant', content: `Hello ${patientDetails.name}. I am the AI Triage Assistant. Please describe your symptoms or the reason for your visit today.` }]);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_name: patientDetails.name,
          age: parseInt(patientDetails.age),
          chat_history: newMessages
        })
      });
      const data = await response.json();
      
      if (data.triage_complete) {
        setResult(data);
        setPhase('complete');
      } else {
        setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
      }
    } catch (error) {
      console.error(error);
      setMessages([...newMessages, { role: 'assistant', content: "I'm having trouble connecting to the server. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  if (phase === 'details') {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '3rem 2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.2)', color: 'var(--accent-primary)', marginBottom: '1.5rem' }}>
              <Activity size={32} />
            </div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>AI Triage Portal</h1>
            <p style={{ color: 'var(--text-muted)' }}>Enter your details to begin the triage process.</p>
          </div>
          
          <form onSubmit={handleDetailsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>Full Name</label>
              <input
                className="input-base"
                type="text"
                required
                value={patientDetails.name}
                onChange={e => setPatientDetails({...patientDetails, name: e.target.value})}
                placeholder="John Doe"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>Age</label>
              <input
                className="input-base"
                type="number"
                required
                min="0"
                max="150"
                value={patientDetails.age}
                onChange={e => setPatientDetails({...patientDetails, age: e.target.value})}
                placeholder="30"
              />
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
              Start Triage
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (phase === 'complete' && result) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '0' }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.2))', padding: '3rem 2rem', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
            <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Triage Complete</h1>
            <p style={{ color: 'var(--text-muted)' }}>Your information has been routed to the appropriate department.</p>
          </div>
          
          <div style={{ padding: '2.5rem 2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Assigned Ward</p>
                <h3 style={{ fontSize: '1.25rem' }}>{result.ward.replace('_', ' ')}</h3>
              </div>
              <span className={`ward-badge ward-${result.ward}`}>
                {result.ward.replace('_', ' ')}
              </span>
            </div>
            
            <div style={{ marginBottom: '2rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Assigned Doctor</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={20} color="var(--text-muted)" />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{result.assigned_doctor}</h3>
              </div>
            </div>

            <div style={{ padding: '1.5rem', borderRadius: '16px', background: queueStatus === 'accepted' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', border: `1px solid ${queueStatus === 'accepted' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {queueStatus === 'accepted' ? <CheckCircle size={24} color="var(--success)" /> : <Clock size={24} color="var(--warning)" />}
                <div>
                  <h4 style={{ color: queueStatus === 'accepted' ? 'var(--success)' : 'var(--warning)', marginBottom: '0.25rem' }}>
                    {queueStatus === 'accepted' ? 'Doctor Ready' : 'Waiting in Queue'}
                  </h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {queueStatus === 'accepted' 
                      ? 'The doctor has accepted your case. Please proceed to the examination room.'
                      : 'You are currently in the queue. A doctor will review your case shortly.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Chat Phase
  return (
    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '2rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', flex: 1, maxHeight: '90vh' }}>
        
        {/* Header */}
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(15, 23, 42, 0.4)' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={20} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem' }}>AI Triage Agent</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Powered by Groq</p>
          </div>
        </div>

        {/* Chat Messages Area */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: '1rem', flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
              <div style={{ flexShrink: 0, width: '36px', height: '36px', borderRadius: '50%', background: m.role === 'user' ? 'var(--bg-input)' : 'rgba(139, 92, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {m.role === 'user' ? <User size={18} color="var(--text-muted)" /> : <Bot size={18} color="var(--accent-primary)" />}
              </div>
              <div style={{ 
                maxWidth: '80%', 
                padding: '1rem 1.25rem', 
                borderRadius: '16px', 
                background: m.role === 'user' ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' : 'var(--bg-input)',
                color: m.role === 'user' ? 'white' : 'var(--text-main)',
                border: m.role === 'user' ? 'none' : '1px solid var(--border)',
                borderTopRightRadius: m.role === 'user' ? '4px' : '16px',
                borderTopLeftRadius: m.role === 'user' ? '16px' : '4px',
                lineHeight: 1.6
              }}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flexShrink: 0, width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={18} color="var(--accent-primary)" />
              </div>
              <div style={{ padding: '1rem 1.25rem', borderRadius: '16px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderTopLeftRadius: '4px', color: 'var(--text-muted)' }}>
                <span style={{ display: 'inline-flex', gap: '4px' }}>
                  <span className="dot-pulse">●</span>
                  <span className="dot-pulse" style={{ animationDelay: '0.2s' }}>●</span>
                  <span className="dot-pulse" style={{ animationDelay: '0.4s' }}>●</span>
                </span>
              </div>
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--border)', background: 'rgba(15, 23, 42, 0.4)' }}>
          <form onSubmit={sendMessage} style={{ display: 'flex', gap: '1rem' }}>
            <input 
              type="text" 
              className="input-base"
              value={input} 
              onChange={e => setInput(e.target.value)}
              placeholder="Describe your symptoms..."
              disabled={loading}
              style={{ background: 'var(--bg-base)' }}
            />
            <button type="submit" className="btn-primary" disabled={loading || !input.trim()}>
              <Send size={20} />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
