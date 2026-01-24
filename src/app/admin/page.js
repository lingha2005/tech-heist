'use client';
import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, doc, onSnapshot, query, orderBy, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';

export default function AdminDashboard() {
  const [teams, setTeams] = useState([]);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [deletePwd, setDeletePwd] = useState('');

  // Helper to check if the system is currently "Paused"
  const isSystemPaused = teams.length > 0 && teams[0].pausedAt != null;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);

    // Sort teams by Level (Descending) first, then by Finish Time/Start Time could be added
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

    const shouldPause = !isSystemPaused; 

    const updates = snapshot.docs.map(async (teamDoc) => {
      const data = teamDoc.data();
      const ref = teamDoc.ref;

      // Don't pause teams that have already finished
      if (data.finishedAt) return;

      if (shouldPause) {
        if (!data.pausedAt) { 
            await updateDoc(ref, { pausedAt: now }); 
        }
      } else {
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

  // --- TIMER DISPLAY LOGIC (UPDATED) ---
  const getTeamTime = (startedAt, pausedAt, totalPaused, finishedAt) => {
    if (!startedAt) return "00:00:00";

    // 1. Determine the "End Point" for the calculation
    // If Finished: Stop at finish time.
    // If Paused: Stop at pause time.
    // Otherwise: Use current live time.
    let endPoint = finishedAt || pausedAt || currentTime;

    // 2. Calculate raw elapsed time
    let elapsed = endPoint - startedAt - (totalPaused || 0);

    // 3. Safety check
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
        
        <button 
          onClick={togglePause}
          style={{
            padding: '15px 30px',
            fontSize: '1.2rem',
            fontWeight: 'bold',
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
            <th style={{ padding: '10px' }}>FINAL TIME</th>
            <th style={{ padding: '10px' }}>STATUS</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team, index) => {
            // Determine row color based on status
            let timeColor = '#00ff41';
            let statusText = `LVL ${team.currentLevel}`;
            
            if (team.finishedAt) {
                timeColor = '#fff'; // White for finished
                statusText = '🏆 MISSION COMPLETE';
            } else if (team.pausedAt) {
                timeColor = '#ff3333'; // Red for paused
            }

            return (
              <tr key={team.id} style={{ borderBottom: '1px solid #222', background: team.finishedAt ? 'rgba(255, 255, 255, 0.1)' : 'transparent' }}>
                <td style={{ padding: '15px' }}>#{index + 1}</td>
                <td style={{ padding: '15px', fontWeight: 'bold' }}>{team.name}</td>
                <td style={{ padding: '15px', fontFamily: 'monospace', fontSize: '1.2rem', color: timeColor }}>
                  {getTeamTime(team.startedAt, team.pausedAt, team.totalPaused, team.finishedAt)}
                </td>
                <td style={{ padding: '15px', fontWeight: team.finishedAt ? 'bold' : 'normal' }}>
                  {statusText}
                </td>
              </tr>
            );
          })}
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