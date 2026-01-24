'use client';
import { useState, useEffect } from 'react';
import { db } from '../firebase'; 
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';

export default function Home() {
  // --- STATES ---
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  
  const [teamName, setTeamName] = useState('');
  const [teamPassword, setTeamPassword] = useState('');
  const [teamId, setTeamId] = useState('');
  
  // TIMER STATES
  const [startedAt, setStartedAt] = useState(null);
  const [pausedAt, setPausedAt] = useState(null);
  const [finishedAt, setFinishedAt] = useState(null); // NEW: To freeze timer
  const [totalPaused, setTotalPaused] = useState(0);

  const [currentTime, setCurrentTime] = useState(Date.now());
  const [currentLevel, setCurrentLevel] = useState(1);
  const [inputValue, setInputValue] = useState('');
  const [message, setMessage] = useState('');
  const [loginError, setLoginError] = useState('');

  // --- ANIMATION STATE (LEVEL 3) ---
  const [flashIndex, setFlashIndex] = useState(0);

  // --- CUSTOM COMPILER STATE (LEVEL 2) ---
  const [code, setCode] = useState(`# ==========================================================
# TECH HEIST : LEVEL 2
# Smart City Autonomous Water Distribution Core
# ==========================================================

#buggy code starts here

zone_levels = [30, 22, 18, 20]
rain_flag = False
leak_flag = True
backup_power = True

print("Zone Levels:", zone_levels)
print("Raining:", rain_flag)
print("Leak Detected:", leak_flag)
print("Backup Power:", backup_power)
print("--------------------------------------------------")

def compute_average(levels):
    total = 0
    for x in levels:
        total = total + x
    return total / len(levels)

def safe_from_rain(rain):
    # Should return True only when NOT raining
    if rain = False:  # <--- BUG HERE
        return True
    else:
        return False

def safe_from_leak(leak):
    # Should return True only when NO leak exists
    if leak == False:
        return True
    return False

def verify_power(power):
    if power == True:
        return True
    else:
        return False

# ------------------ CORE LOGIC ----------------------

avg = compute_average(zone_levels)
print("Average Tank Level:", avg, "%")
print("--------------------------------------------------")

valve_open = False

# Correct logic should use only AND
if avg < 25 and safe_from_rain(rain_flag) or safe_from_leak(leak_flag) and verify_power(backup_power):
    valve_open = True

#buggy code ends here

#-----INTERNAL VERIFICATION SYSTEM (DO NOT MODIFY)-----

def internal_sss():
    correct_avg = avg < 25
    correct_rain = (rain_flag == False)
    correct_leak = (leak_flag == False)
    correct_power = (backup_power == True)
    
    if valve_open == (correct_avg and correct_rain and correct_leak and correct_power):
        return True
    else:
        return False

if internal_sss():
    if valve_open:
        print("MAIN VALVE STATUS : OPEN")
        
        # ---- ASCII Hidden Key Generator ----
        codes = [65,67,67,69,83,83,95,71,82,65,78,84,69,68,95,57,57]
        key = ""
        for c in codes:
            key = key + chr(c)
        
        print("FINAL_ACCESS_KEY :", key)
    else:
        print("MAIN VALVE STATUS : CLOSED")
        print("SYSTEM_LOCKED")
else:
    print("LOGIC_ERROR_DETECTED")
    print("SYSTEM_LOCKED")

print("--------------------------------------------------")
print("END OF CONTROL SESSION")`);

  const [consoleOutput, setConsoleOutput] = useState("Ready to run...");

  // --- CLOCK & ANIMATION ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    // Level 3 Flash Animation
    let flashTimer;
    if (currentLevel === 3) {
      flashTimer = setInterval(() => {
        setFlashIndex((prev) => (prev + 1) % 4);
      }, 1000);
    }
    return () => {
      clearInterval(timer);
      if (flashTimer) clearInterval(flashTimer);
    };
  }, [currentLevel]);

  // --- REALTIME LISTENER ---
  useEffect(() => {
    if (!teamId) return;
    const teamRef = doc(db, 'teams', teamId);
    const unsub = onSnapshot(teamRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setPausedAt(data.pausedAt || null);
        setTotalPaused(data.totalPaused || 0);
        setFinishedAt(data.finishedAt || null); // Listen for finish time
        // Safety: If level changed remotely (rare), sync it
        if (data.currentLevel > currentLevel) setCurrentLevel(data.currentLevel);
      }
    });
    return () => unsub();
  }, [teamId, currentLevel]);

  // --- LOGIN ---
  const handleLogin = async () => {
    if (!teamName || !teamPassword) return;
    setLoading(true); setLoginError('');

    try {
      if (teamPassword !== 'BME2026') {
        setLoginError('>> ERROR: INVALID ACCESS CODE.');
        setLoading(false); return;
      }

      const id = teamName.trim().toUpperCase().replace(/\s+/g, '_');
      setTeamId(id);
      
      const teamRef = doc(db, 'teams', id);
      const teamSnap = await getDoc(teamRef);
      const now = Date.now();

      if (teamSnap.exists()) {
        const data = teamSnap.data();
        setCurrentLevel(data.currentLevel || 1);
        
        let dbStart = data.startedAt;
        if (dbStart && dbStart.seconds) dbStart = dbStart.seconds * 1000;
        setStartedAt(dbStart || now);
        
        setPausedAt(data.pausedAt || null);
        setTotalPaused(data.totalPaused || 0);
        setFinishedAt(data.finishedAt || null);
        
        setIsLoggedIn(true);
        // Intro triggers
        if ((data.currentLevel === 1 && !data.level1_seen) || (data.currentLevel === 2 && !data.level2_seen) || (data.currentLevel === 3 && !data.level3_seen)) {
           setShowIntro(true);
        }
      } else {
        await setDoc(teamRef, {
          name: teamName.toUpperCase(),
          currentLevel: 1,
          startedAt: now,
          pausedAt: null,
          totalPaused: 0,
          finishedAt: null,
          level1_seen: false,
          level2_seen: false,
          level3_seen: false
        });
        setCurrentLevel(1); setStartedAt(now); setPausedAt(null); setTotalPaused(0); setFinishedAt(null);
        setShowIntro(true); setIsLoggedIn(true);
      }
    } catch (error) { console.error(error); setLoginError('>> DATABASE ERROR.'); }
    setLoading(false);
  };

  const startMission = async () => {
    setShowIntro(false);
    const teamRef = doc(db, 'teams', teamId);
    if (currentLevel === 1) await updateDoc(teamRef, { level1_seen: true });
    if (currentLevel === 2) await updateDoc(teamRef, { level2_seen: true });
    if (currentLevel === 3) await updateDoc(teamRef, { level3_seen: true });
  };

  // --- COMPILER RUNNER ---
  const runCode = () => {
    setConsoleOutput(">> Compiling Smart City Core...");
    setTimeout(() => {
      if (code.includes("if rain = False")) {
        setConsoleOutput(`  File "main.py", line 32\n    if rain = False:\n            ^\nSyntaxError: invalid syntax (did you mean '=='?)`);
        return;
      }
      if (code.includes("or safe_from_leak")) {
        setConsoleOutput(`Zone Levels: [30, 22, 18, 20]\nLeak Detected: True\n...\nLOGIC_ERROR_DETECTED\nSYSTEM_LOCKED`);
        return;
      }
      if (code.includes("==") && !code.includes("or safe_from_leak")) {
        setConsoleOutput(`MAIN VALVE STATUS : OPEN\nFINAL_ACCESS_KEY : ACCESS_GRANTED_99\n--------------------------------------------------\nEND OF CONTROL SESSION`);
      } else {
        setConsoleOutput(">> LOGIC MISMATCH. ENSURE ALL CONDITIONS ARE MET.");
      }
    }, 800);
  };

  // --- SUBMIT LOGIC ---
  const handleSubmit = async () => {
    if (pausedAt && !finishedAt) { setMessage('>> SYSTEM PAUSED.'); return; }
    
    const teamRef = doc(db, 'teams', teamId);
    const input = inputValue.trim();
    
    // LEVEL 1: CIRCUIT
    if (currentLevel === 1) {
      if (input === '721') {
        setMessage('>> CIRCUIT FIXED.');
        await updateDoc(teamRef, { currentLevel: 2, level2_seen: false });
        setCurrentLevel(2); setInputValue(''); setShowIntro(true);
      } else { setMessage('>> ERROR: INVALID FREQUENCY.'); }
    }
    // LEVEL 2: COMPILER
    else if (currentLevel === 2) {
      if (input === 'ACCESS_GRANTED_99') {
        setMessage('>> ACCESS GRANTED.');
        await updateDoc(teamRef, { currentLevel: 3, level3_seen: false });
        setCurrentLevel(3); setInputValue(''); setShowIntro(true);
      } else { setMessage('>> ERROR: INCORRECT KEY.'); }
    }
    // LEVEL 3: BINARY CIPHER
    else if (currentLevel === 3) {
      // Triangle(01) -> Circle(11) -> Square(10) -> Triangle(01) = 01111001 = 121
      if (input === '121') {
         setMessage('>> SIGNAL DECODED.');
         await updateDoc(teamRef, { currentLevel: 4 });
         setCurrentLevel(4); setInputValue('');
      } else { setMessage('>> ERROR: INCORRECT DECIMAL VALUE.'); }
    }
    // LEVEL 4: QR HUNT (GATEWAY TO OMEGA BOX)
    else if (currentLevel === 4) {
      if (input === 'OMEGA_PROTOCOL_INIT') { // Code found at QR Location
         setMessage('>> PROTOCOL INITIATED. OMEGA BOX LOCATION REVEALED.');
         await updateDoc(teamRef, { currentLevel: 5 });
         setCurrentLevel(5); setInputValue('');
      } else { setMessage('>> ERROR: INVALID ACCESS CODE.'); }
    }
    // LEVEL 5: OMEGA BOX (FINAL)
    else if (currentLevel === 5) {
      if (input === 'HEIST_COMPLETE_2026') { // Code INSIDE the box
         const finishTime = Date.now();
         await updateDoc(teamRef, { 
           currentLevel: 6, 
           finishedAt: finishTime 
         });
         setFinishedAt(finishTime);
         setCurrentLevel(6);
      } else { setMessage('>> ERROR: INVALID FINAL CODE.'); }
    }
  };

  const getDisplayTime = () => {
    if (!startedAt) return "00:00:00";
    let startMillis = typeof startedAt === 'object' && startedAt.seconds ? startedAt.seconds * 1000 : startedAt;
    
    // STOP TIMER LOGIC:
    // If finished, use finishedAt. If paused, use pausedAt. Otherwise, use now.
    let endPoint = finishedAt || pausedAt || currentTime;
    
    let elapsed = endPoint - startMillis - totalPaused;
    if (elapsed < 0) elapsed = 0;
    
    const s = Math.floor((elapsed / 1000) % 60);
    const m = Math.floor((elapsed / (1000 * 60)) % 60);
    const h = Math.floor((elapsed / (1000 * 60 * 60)));
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  };

  return (
    <main className="dashboard-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1>// TECH-HEIST //</h1>
        {isLoggedIn && (
          <div style={{ textAlign: 'right', fontFamily: 'monospace', color: finishedAt ? '#00ff41' : (pausedAt ? '#ff3333' : '#00ff41') }}>
            TIME: {getDisplayTime()}
            {pausedAt && !finishedAt && <div style={{ fontSize: '0.8rem' }}>[PAUSED]</div>}
            {finishedAt && <div style={{ fontSize: '0.8rem' }}>[MISSION COMPLETE]</div>}
          </div>
        )}
      </div>

      {!isLoggedIn && (
        <div>
          <p> AUTHENTICATION REQUIRED</p>
          <input type="text" placeholder="TEAM NAME" value={teamName} onChange={e=>setTeamName(e.target.value)} />
          <input type="password" placeholder="ACCESS CODE" value={teamPassword} onChange={e=>setTeamPassword(e.target.value)} />
          <button onClick={handleLogin}>{loading ? '...' : 'LOGIN'}</button>
          {loginError && <div className="error-msg">{loginError}</div>}
        </div>
      )}

      {isLoggedIn && showIntro && (
        <div style={{ animation: 'fadeIn 0.5s' }}>
          <h2 style={{ borderBottom: '1px solid #00ff41', paddingBottom: '10px' }}> MISSION BRIEFING</h2>
          {currentLevel === 1 && <p>Fix the circuit to get the buzzer code.</p>}
          {currentLevel === 2 && (
            <>
              <p><strong>OBJECTIVE: SMART CITY WATER TERMINAL</strong></p>
              <p>The core logic for the city's water distribution is corrupted.</p>
              <p>You must restore the Python logic to ensure the valve opens ONLY when safe.</p>
            </>
          )}
          {currentLevel === 3 && (
            <>
              <p><strong>OBJECTIVE: DATA TRANSLATION</strong></p>
              <p>We are receiving an encrypted binary transmission.</p>
              <p><strong>MISSION:</strong> Find the Decoder Sheet at the <strong>Library</strong> and translate the signal.</p>
            </>
          )}
          <button onClick={startMission} style={{ marginTop: '20px' }}>  START </button>
        </div>
      )}

      {isLoggedIn && !showIntro && (
        <div style={{ animation: 'fadeIn 0.5s' }}>
          <div style={{ marginBottom: '20px', opacity: 0.8 }}>
             OPERATIVE: {teamName.toUpperCase()} | LEVEL: {currentLevel === 6 ? 'COMPLETE' : currentLevel}
          </div>

          {pausedAt && !finishedAt ? (
            <div className="clue-box" style={{ borderColor: '#ff3333', color: '#ff3333' }}>⚠ SYSTEM PAUSED ⚠</div>
          ) : (
            <>
              {/* LEVEL 1: CIRCUIT */}
              {currentLevel === 1 && (
                <div>
                  <p> ENTER BUZZER CODE:</p>
                  <input type="number" placeholder="___" value={inputValue} onChange={e=>setInputValue(e.target.value)} />
                  <button onClick={handleSubmit}>VERIFY</button>
                </div>
              )}

              {/* LEVEL 2: COMPILER */}
              {currentLevel === 2 && (
                <div>
                   <div className="clue-box" style={{ marginBottom: '20px', fontSize: '0.9rem', lineHeight: '1.5' }}>
                      <strong style={{ borderBottom: '1px solid #00ff41' }}>SMART CITY WATER DISTRIBUTION CONTROL TERMINAL</strong><br/><br/>
                      <strong>MISSION:</strong> Restore correct system logic.<br/><br/>
                      Main valve must OPEN only if ALL conditions are satisfied:<br/>
                      1. Average tank level &lt; 25%<br/>
                      2. It is NOT raining<br/>
                      3. NO pipeline leak exists<br/>
                      4. Backup power is available<br/><br/>
                      <em>If system logic is fully restored, the CORE will reveal the FINAL ACCESS KEY.</em>
                   </div>

                   <div style={{ border: '1px solid #333', background: '#1e1e1e', borderRadius: '5px', overflow: 'hidden', marginBottom: '20px' }}>
                     <div style={{ background: '#2d2d2d', padding: '10px', display: 'flex', justifyContent: 'space-between' }}>
                       <span style={{ color: '#ccc', fontFamily: 'monospace' }}>water_core.py</span>
                       <button onClick={runCode} style={{ background: '#00ff41', color: 'black', border: 'none', padding: '5px 15px', cursor: 'pointer', fontWeight: 'bold' }}>
                         ▶ RUN CODE
                       </button>
                     </div>
                     <textarea 
                       value={code} onChange={(e) => setCode(e.target.value)}
                       onPaste={(e) => { e.preventDefault(); setConsoleOutput(">> SECURITY ALERT: EXTERNAL DATA INJECTION BLOCKED."); }}
                       onCopy={(e) => { e.preventDefault(); }}
                       onCut={(e) => { e.preventDefault(); }}
                       autoComplete="off" spellCheck="false"
                       style={{ width: '100%', height: '400px', background: '#1e1e1e', color: '#d4d4d4', fontFamily: 'Consolas, monospace', border: 'none', padding: '15px', outline: 'none', resize: 'none' }}
                     />
                     <div style={{ borderTop: '2px solid #333', padding: '15px', background: 'black', color: consoleOutput.includes("ERROR") || consoleOutput.includes("ALERT") ? '#ff3333' : '#ccc', fontFamily: 'monospace', minHeight: '100px', whiteSpace: 'pre-wrap' }}>
                       <strong> TERMINAL OUTPUT:</strong><br/>{consoleOutput}
                     </div>
                   </div>

                  <p> ENTER FINAL ACCESS KEY:</p>
                  <input type="text" placeholder="ACCESS_..." value={inputValue} onChange={e=>setInputValue(e.target.value)} />
                  <button onClick={handleSubmit}>VERIFY KEY</button>
                </div>
              )}

               {/* LEVEL 3: BINARY CIPHER */}
               {currentLevel === 3 && (
                <div>
                  <div className="clue-box" style={{ marginBottom: '20px' }}>
                    <strong> INTERCEPTING SIGNAL...</strong><br/>
                    "Go to the <strong>Library</strong>. Find the Physical Decoder Sheet to translate the sequence below."
                  </div>
                  
                  <div style={{ 
                    display: 'flex', justifyContent: 'center', gap: '20px', margin: '40px 0', background: '#000', padding: '20px', border: '1px dashed #00ff41'
                  }}>
                    {['TRIANGLE', 'CIRCLE', 'SQUARE', 'TRIANGLE'].map((shape, index) => (
                      <div key={index} style={{
                        width: '80px', height: '80px', border: '2px solid #00ff41', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: flashIndex === index ? 1 : 0.2, boxShadow: flashIndex === index ? '0 0 20px #00ff41' : 'none',
                        transition: 'opacity 0.1s', fontSize: '40px'
                      }}>
                        {shape === 'TRIANGLE' && '▲'}
                        {shape === 'CIRCLE' && '●'}
                        {shape === 'SQUARE' && '■'}
                      </div>
                    ))}
                  </div>

                  <p> ENTER DECODED DECIMAL VALUE:</p>
                  <input type="number" placeholder="___" value={inputValue} onChange={e=>setInputValue(e.target.value)} />
                  <button onClick={handleSubmit}>VERIFY CODE</button>
                </div>
              )}

              {/* LEVEL 4: OMEGA GATEWAY (QR HUNT) */}
              {currentLevel === 4 && (
                <div>
                  <div className="clue-box">
                    <strong> SIGNAL DECODED. COORDINATES REVEALED.</strong><br/><br/>
                    "Where the silicon meets the coffee."<br/>
                    <em>(Go to the Cafeteria. Find the QR Code.)</em>
                  </div>
                  <p> ENTER OMEGA ACCESS CODE:</p>
                  <input type="text" placeholder="Ex: OMEGA_..." value={inputValue} onChange={e=>setInputValue(e.target.value)} />
                  <button onClick={handleSubmit}>UNLOCK OMEGA BOX</button>
                </div>
              )}

              {/* LEVEL 5: OMEGA BOX (FINAL) */}
              {currentLevel === 5 && (
                <div>
                  <div className="clue-box" style={{ border: '2px solid #fff', boxShadow: '0 0 20px #fff', color: '#fff' }}>
                    <strong> FINAL OBJECTIVE INITIATED</strong><br/><br/>
                    "The Omega Box is located at the Main Stage."<br/>
                    <em>(Find the box. Open it. Enter the code inside to STOP THE TIMER.)</em>
                  </div>
                  <p> ENTER FINAL COMPLETION CODE:</p>
                  <input type="text" placeholder="HEIST_..." value={inputValue} onChange={e=>setInputValue(e.target.value)} />
                  <button onClick={handleSubmit} style={{ background: '#fff', color: '#000' }}>STOP TIMER</button>
                </div>
              )}

              {/* LEVEL 6: VICTORY */}
              {currentLevel === 6 && (
                <div style={{ textAlign: 'center', animation: 'fadeIn 1s' }}>
                  <h1 style={{ fontSize: '3rem', color: '#fff', textShadow: '0 0 20px #00ff41' }}>MISSION COMPLETE</h1>
                  <div style={{ fontSize: '2rem', margin: '20px 0', fontFamily: 'monospace' }}>
                    FINAL TIME: <span style={{ color: '#00ff41' }}>{getDisplayTime()}</span>
                  </div>
                  <p>System breached. Report to Admin for ranking.</p>
                </div>
              )}

              {message && <div className={message.includes('ERROR') ? 'error-msg' : ''}>{message}</div>}
            </>
          )}
        </div>
      )}
    </main>
  );
}