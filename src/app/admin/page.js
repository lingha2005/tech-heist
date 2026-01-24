'use client';
import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, doc, onSnapshot, query, orderBy, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';

export default function AdminDashboard() {
  const [teams, setTeams] = useState([]);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [deletePwd, setDeletePwd] = useState('');

  // Helper to check if the system is currently "Paused"
  // (We check if the first team has a 'pausedAt' timestamp)
  const isSystemPaused = teams.length > 0 && teams[0].pausedAt != null;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);

    const q = query(collection(db, 'teams'), orderBy('currentLevel', 'desc'));
    const unsubscribeTeams = onSnapshot(q, (snapshot) => {
      setTeams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      clearInterval(timer);
      unsubscribeTeams();
    };
  }, []);

  // --- PAUSE / RESUME ALL TEAMS ---
  const togglePause = async () => {
    const now = Date.now();
    const q = query(collection(db, 'teams'));
    const snapshot = await getDocs(q);

    // If currently paused, we want to RESUME. If running, we want to PAUSE.
    // We use the 'isSystemPaused' check to decide the action for everyone.
    const shouldPause = !isSystemPaused; 

    const updates = snapshot.docs.map(async (teamDoc) => {
      const data = teamDoc.data();
      const ref = teamDoc.ref;

      if (shouldPause) {
        // PAUSE EVERYONE
        if (!data.pausedAt) { 
            await updateDoc(ref, { pausedAt: now }); 
        }
      } else {
        // RESUME EVERYONE
        if (data.pausedAt) {
          const pauseDuration = now - data.pausedAt;
          await updateDoc(ref, {
            pausedAt: null,
            totalPaused: (data.totalPaused || 0) + pauseDuration
          });
        }
      }
    });

    await Promise.all(updates);
  };

  // --- NUKE ---
  const handleNuke = async () => {
    if (deletePwd !== 'BME123') {
      alert('ACCESS DENIED');
      return;
    }
    
    if (confirm('DELETE ALL TEAMS?')) {
      const q = query(collection(db, 'teams'));
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      alert('DATABASE WIPED');
      setDeletePwd('');
    }
  };

  // --- TIMER DISPLAY ---
  const getTeamTime = (startedAt, pausedAt, totalPaused) => {
    if (!startedAt) return "00:00:00";

    const now = currentTime;
    let elapsed = now - startedAt - (totalPaused || 0);

    // If currently paused, don't count the time since the pause started
    if (pausedAt) elapsed -= (now - pausedAt);
    if (elapsed < 0) elapsed = 0;

    const seconds = Math.floor((elapsed / 1000) % 60);
    const minutes = Math.floor((elapsed / (1000 * 60)) % 60);
    const hours = Math.floor(elapsed / (1000 * 60 * 60));

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <main style={{ padding: '40px', fontFamily: 'Courier New', color: '#00ff41', background: '#0d0d0d', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #00ff41', paddingBottom: '20px' }}>
        <h1>// MISSION CONTROL //</h1>
        
        {/* THE BUTTON: DYNAMIC COLOR */}
        <button 
          onClick={togglePause}
          style={{
            padding: '15px 30px',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            // Turn RED if paused, GREEN if running
            background: isSystemPaused ? '#ff3333' : '#00ff41', 
            color: 'black',
            border: 'none',
            cursor: 'pointer',
            transition: 'background 0.3s ease'
          }}
        >
          {isSystemPaused ? "▶ RESUME EVENT" : "⏸ PAUSE EVENT"}
        </button>
      </div>
      
      {/* STATUS BANNER */}
      {isSystemPaused && (
        <div style={{ background: '#ff3333', color: 'black', textAlign: 'center', padding: '10px', marginTop: '20px', fontWeight: 'bold' }}>
          ⚠ EVENT PAUSED - TIMERS FROZEN ⚠
        </div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #333', textAlign: 'left', color: '#888' }}>
            <th style={{ padding: '10px' }}>RANK</th>
            <th style={{ padding: '10px' }}>OPERATIVE</th>
            <th style={{ padding: '10px' }}>ACTIVE TIME</th>
            <th style={{ padding: '10px' }}>LEVEL</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team, index) => (
            <tr key={team.id} style={{ borderBottom: '1px solid #222' }}>
              <td style={{ padding: '15px' }}>#{index + 1}</td>
              <td style={{ padding: '15px', fontWeight: 'bold' }}>{team.name}</td>
              <td style={{ padding: '15px', fontFamily: 'monospace', color: team.pausedAt ? '#ff3333' : '#00ff41' }}>
                {getTeamTime(team.startedAt, team.pausedAt, team.totalPaused)}
              </td>
              <td style={{ padding: '15px' }}>LVL {team.currentLevel}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: '50px', borderTop: '1px solid #333', paddingTop: '20px' }}>
        <h3 style={{ color: '#ff3333' }}>⚠ DANGER ZONE</h3>
        <input 
          type="password" 
          placeholder="ENTER ADMIN CODE" 
          value={deletePwd}
          onChange={(e) => setDeletePwd(e.target.value)}
          style={{ padding: '10px', background: 'black', border: '1px solid #333', color: 'white', marginRight: '10px' }}
        />
        <button 
          onClick={handleNuke}
          style={{ padding: '10px 20px', background: '#ff3333', color: 'black', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
        >
          NUKE DATABASE
        </button>
      </div>
    </main>
  );
}