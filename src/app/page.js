'use client';
import { useState, useEffect } from 'react';
import { db } from '../firebase'; 
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';

export default function Home() {
  // --- STATES ---
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  
  const [teamName, setTeamName] = useState('');
  const [teamPassword, setTeamPassword] = useState('');
  const [teamId, setTeamId] = useState('');
  
  // TIMER STATES
  const [startedAt, setStartedAt] = useState(null);
  const [pausedAt, setPausedAt] = useState(null);
  const [finishedAt, setFinishedAt] = useState(null);
  const [totalPaused, setTotalPaused] = useState(0);

  const [currentTime, setCurrentTime] = useState(Date.now());
  const [currentLevel, setCurrentLevel] = useState(1);
  
  // ACCESS STATES FOR FIREWALLS
  const [level2Access, setLevel2Access] = useState(false); // Bakery Firewall
  const [level3Access, setLevel3Access] = useState(false); // Dance Mirror Firewall
  const [level4Access, setLevel4Access] = useState(false); // Trees Gateway
  
  const [inputValue, setInputValue] = useState('');
  const [message, setMessage] = useState('');
  const [loginError, setLoginError] = useState('');

  // --- ANIMATION STATE ---
  const [flashIndex, setFlashIndex] = useState(0);

  // --- SLIDING PUZZLE STATE (UPGRADED DIFFICULTY) ---
  // 0 represents the empty space. Solved state: [1, 2, 3, 4, 5, 6, 7, 8, 0]
  // Current starting state is a verified 12-move solve.
  const [puzzle, setPuzzle] = useState([4, 1, 2, 6, 0, 5, 7, 8, 3]);
  const isPuzzleSolved = JSON.stringify(puzzle) === JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 0]);

  // --- CUSTOM COMPILER STATE (LEVEL 2) ---
  const [code, setCode] = useState(`# ==========================================================
# TECH HEIST : LEVEL 2
# Smart City Autonomous Water Distribution Core
# ==========================================================

#buggy code starts here

zone_levels = [30, 22, 18, 20]
rain_flag = False
leak_flag = True
backup_power = true

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
    if rain = False:  
        return True
    else:
        return False

def safe_from_leak(leak):
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
        
        codes = [65,67,67,69,83,83,95,71,82,65,78,84,69,68,95,57,57]
        key = ""
        for c in codes:
            key = key + chr(c)
        
        print("KEY :", key)
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
    
    let flashTimer;
    if (currentLevel === 1 && !showWelcome && !showIntro) {
      flashTimer = setInterval(() => {
        setFlashIndex((prev) => (prev + 1) % 3); 
      }, 1000);
    }
    return () => {
      clearInterval(timer);
      if (flashTimer) clearInterval(flashTimer);
    };
  }, [currentLevel, showWelcome, showIntro]);

  // --- REALTIME LISTENER ---
  useEffect(() => {
    if (!teamId) return;
    const teamRef = doc(db, 'teams', teamId);
    const unsub = onSnapshot(teamRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setPausedAt(data.pausedAt || null);
        setTotalPaused(data.totalPaused || 0);
        setFinishedAt(data.finishedAt || null); 
        setLevel2Access(data.level2_access_granted || false);
        setLevel3Access(data.level3_access_granted || false);
        setLevel4Access(data.level4_access_granted || false);
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
        setLevel2Access(data.level2_access_granted || false);
        setLevel3Access(data.level3_access_granted || false);
        setLevel4Access(data.level4_access_granted || false);
        
        let dbStart = data.startedAt;
        if (dbStart && dbStart.seconds) dbStart = dbStart.seconds * 1000;
        setStartedAt(dbStart || now);
        
        setPausedAt(data.pausedAt || null);
        setTotalPaused(data.totalPaused || 0);
        setFinishedAt(data.finishedAt || null);
        
        setIsLoggedIn(true);
        
        if (!data.welcome_seen) {
           setShowWelcome(true);
        } else if ((data.currentLevel === 1 && !data.level1_seen) || (data.currentLevel === 2 && data.level2_access_granted && !data.level2_seen) || (data.currentLevel === 3 && data.level3_access_granted && !data.level3_seen)) {
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
          welcome_seen: false,
          level2_access_granted: false,
          level3_access_granted: false, 
          level4_access_granted: false, 
          level1_seen: false,
          level2_seen: false,
          level3_seen: false
        });
        setCurrentLevel(1); setStartedAt(now); setPausedAt(null); setTotalPaused(0); setFinishedAt(null); 
        setLevel2Access(false); setLevel3Access(false); setLevel4Access(false);
        setShowWelcome(true); setIsLoggedIn(true);
      }
    } catch (error) { console.error(error); setLoginError('>> DATABASE ERROR.'); }
    setLoading(false);
  };

  const proceedFromWelcome = async () => {
    setShowWelcome(false);
    const teamRef = doc(db, 'teams', teamId);
    await updateDoc(teamRef, { welcome_seen: true });
    
    if (currentLevel === 1) setShowIntro(true);
  };

  const startMission = async () => {
    setShowIntro(false);
    const teamRef = doc(db, 'teams', teamId);
    if (currentLevel === 1) await updateDoc(teamRef, { level1_seen: true });
    if (currentLevel === 2 && level2Access) await updateDoc(teamRef, { level2_seen: true });
    if (currentLevel === 3 && level3Access) await updateDoc(teamRef, { level3_seen: true });
  };

  // --- SLIDING PUZZLE LOGIC ---
  const handleTileClick = (index) => {
    if (isPuzzleSolved) return;
    const emptyIndex = puzzle.indexOf(0);
    
    // Check if clicked tile is adjacent to the empty space (0)
    const isAdjacent =
      [emptyIndex - 1, emptyIndex + 1, emptyIndex - 3, emptyIndex + 3].includes(index) &&
      !(emptyIndex % 3 === 0 && index === emptyIndex - 1) &&
      !(emptyIndex % 3 === 2 && index === emptyIndex + 1);

    if (isAdjacent) {
      const newPuzzle = [...puzzle];
      newPuzzle[emptyIndex] = newPuzzle[index];
      newPuzzle[index] = 0;
      setPuzzle(newPuzzle);
    }
  };

  // --- COMPILER RUNNER ---
  const runCode = () => {
    setConsoleOutput(">> Compiling Smart City Core...");
    setTimeout(() => {
      if (!code.includes("backup_power = True")) {
        setConsoleOutput(`  File "main.py", line 11\n    backup_power = true\nNameError: name 'true' is not defined. Did you mean: 'True'?`);
        return;
      }
      if (!code.includes("for x in levels:")) {
        setConsoleOutput(`  File "main.py", line 21\n    for x in levels\n                  ^\nSyntaxError: expected ':'`);
        return;
      }
      if (code.includes("if rain = False:")) {
        setConsoleOutput(`  File "main.py", line 27\n    if rain = False:\n            ^\nSyntaxError: invalid syntax. Maybe you meant '==' instead of '='?`);
        return;
      }
      if (code.includes("or safe_from_leak")) {
        setConsoleOutput(`Zone Levels: [30, 22, 18, 20]\nLeak Detected: True\n...\nLOGIC_ERROR_DETECTED\nSYSTEM_LOCKED\n>> HINT: A safe system requires ALL conditions to be met.`);
        return;
      }

      setConsoleOutput(`MAIN VALVE STATUS : OPEN\nFINAL_ACCESS_KEY : ACCESS_GRANTED_99\n--------------------------------------------------\nEND OF CONTROL SESSION`);
    }, 800);
  };

  // --- SUBMIT LOGIC ---
  const handleSubmit = async () => {
    if (pausedAt && !finishedAt) { setMessage('>> SYSTEM PAUSED.'); return; }
    
    const teamRef = doc(db, 'teams', teamId);
    const input = inputValue.trim().toUpperCase(); 
    
    // LEVEL 1: BINARY CIPHER
    if (currentLevel === 1) {
      const cleanInput = input.replace(/[-\s]/g, '');
      if (cleanInput === '2083252') {
         setMessage('>> SIGNAL DECODED.');
         await updateDoc(teamRef, { currentLevel: 2 });
         setCurrentLevel(2); setInputValue(''); 
      } else { setMessage('>> ERROR: INCORRECT DECIMAL SEQUENCE.'); }
    }
    // LEVEL 2: COMPILER (Protected by Bakery Gateway)
    else if (currentLevel === 2) {
      if (!level2Access) {
        if (input === 'M4CHIN8_M4STER_1978') {
           setMessage('>> PHYSICAL FIREWALL BYPASSED.');
           await updateDoc(teamRef, { level2_access_granted: true, level2_seen: false });
           setLevel2Access(true); setInputValue(''); setShowIntro(true); 
        } else { setMessage('>> ERROR: INVALID ACCESS CODE.'); }
      } else {
        if (input === 'ACCESS_GRANTED_99') {
          setMessage('>> ACCESS GRANTED.');
          await updateDoc(teamRef, { currentLevel: 3 });
          setCurrentLevel(3); setInputValue(''); 
        } else { setMessage('>> ERROR: INCORRECT KEY.'); }
      }
    }
    // LEVEL 3: TINKERCAD (Protected by Dance Mirror Gateway)
    else if (currentLevel === 3) {
      if (!level3Access) {
        if (input === 'BIO_MED_4578') {
           setMessage('>> MIRROR PROTOCOL BYPASSED.');
           await updateDoc(teamRef, { level3_access_granted: true, level3_seen: false });
           setLevel3Access(true); setInputValue(''); setShowIntro(true); 
        } else { setMessage('>> ERROR: INVALID ACCESS CODE.'); }
      } else {
        if (input === '42') {
          setMessage('>> CIRCUIT FIXED. FINAL COORDINATES REVEALED.');
          await updateDoc(teamRef, { currentLevel: 4 });
          setCurrentLevel(4); setInputValue('');
        } else { setMessage('>> ERROR: INVALID FREQUENCY.'); }
      }
    }
    // LEVEL 4: OMEGA BOX (Protected by TreesGateway)
    else if (currentLevel === 4) {
      if (!level4Access) {
        if (input === 'OMEGA_PROTOCOL_INIT') { 
           setMessage('>> PROTOCOL INITIATED. OMEGA BOX LOCATION REVEALED.');
           await updateDoc(teamRef, { level4_access_granted: true });
           setLevel4Access(true); setInputValue('');
        } else { setMessage('>> ERROR: INVALID ACCESS CODE.'); }
      } else {
        if (input === 'HEIST_COMPLETE_2026') { 
           const finishTime = Date.now();
           await updateDoc(teamRef, { 
             currentLevel: 5, 
             finishedAt: finishTime 
           });
           setFinishedAt(finishTime);
           setCurrentLevel(5);
        } else { setMessage('>> ERROR: INVALID FINAL CODE.'); }
      }
    }
  };

  const getDisplayTime = () => {
    if (!startedAt) return "00:00:00";
    let startMillis = typeof startedAt === 'object' && startedAt.seconds ? startedAt.seconds * 1000 : startedAt;
    
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

      {/* --- LOGIN SCREEN --- */}
      {!isLoggedIn && (
        <div>
          <p> AUTHENTICATION REQUIRED</p>
          <input type="text" placeholder="TEAM NAME" value={teamName} onChange={e=>setTeamName(e.target.value)} />
          <input type="password" placeholder="ACCESS CODE" value={teamPassword} onChange={e=>setTeamPassword(e.target.value)} />
          <button onClick={handleLogin}>{loading ? '...' : 'LOGIN'}</button>
          {loginError && <div className="error-msg">{loginError}</div>}
        </div>
      )}

      {/* --- WELCOME PAGE --- */}
      {isLoggedIn && showWelcome && (
        <div style={{ animation: 'fadeIn 0.5s', textAlign: 'center', marginTop: '30px' }}>
          <h1 style={{ color: '#00ff41', textShadow: '0 0 20px #00ff41', fontSize: '2.5rem', marginBottom: '20px' }}>
            WELCOME TO OPERATION OMEGA
          </h1>
          
          <div className="clue-box" style={{ margin: '0 auto 30px auto', maxWidth: '600px', textAlign: 'left', background: '#111', padding: '30px', border: '1px solid #333' }}>
            
            {/* HEADING & DESCRIPTION */}
            <p style={{ color: '#00ff41', fontWeight: 'bold', fontSize: '1.2rem', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '15px' }}>
              SYSTEM DIRECTIVE_
            </p>
            <p style={{ color: '#ccc', lineHeight: '1.6', marginBottom: '25px' }}>
              The Omega Mainframe, the core of our smart-city grid, has been compromised. As elite operatives, your mission is to track down the corrupted nodes, decipher intercepted signals, and restore the system. You must navigate both this digital terminal and the physical campus to succeed.
            </p>
            
            {/* RULES SECTION */}
            <p style={{ color: '#00ff41', fontWeight: 'bold', marginBottom: '10px' }}>
              RULES OF ENGAGEMENT
            </p>
            <div style={{ color: '#ccc', lineHeight: '1.8', paddingLeft: '15px', marginBottom: '25px' }}>
              <p><strong>(1) One Device Per Team:</strong> Logging in on multiple phones will crash your timer.</p>
              <p><strong>(2) Asset Integrity:</strong> Do not move or damage physical QR codes/clues.</p>
              <p><strong>(3) No Sabotage:</strong> Interfering with other teams is strictly prohibited.</p>
              <p><strong>(4) The Clock is God:</strong> The timer determines the final winner.</p>
            </div>
            
            {/* WARNING SECTION */}
            <div style={{ padding: '15px', background: 'rgba(255, 51, 51, 0.1)', borderLeft: '3px solid #ff3333' }}>
              <p style={{ color: '#ff3333', fontWeight: 'bold', marginBottom: '5px' }}>
                ⚠ WARNING
              </p>
              <p style={{ color: '#ff3333', lineHeight: '1.5', fontStyle: 'italic' }}>
                Move swiftly but safely. Running in restricted areas is prohibited. Press 'INITIALIZE SYSTEM' only when your team is ready to deploy. The clock starts immediately.
              </p>
            </div>

          </div>
          <button onClick={proceedFromWelcome} style={{ fontSize: '1.2rem', padding: '15px 40px', fontWeight: 'bold' }}>
             INITIALIZE SYSTEM
          </button>
        </div>
      )}

      {/* --- LEVEL INTRO SCREEN --- */}
      {isLoggedIn && !showWelcome && showIntro && (
        <div style={{ animation: 'fadeIn 0.5s' }}>
          <h2 style={{ borderBottom: '1px solid #00ff41', paddingBottom: '10px' }}> MISSION BRIEFING</h2>
          {currentLevel === 1 && (
            <>
              <p><strong>OBJECTIVE: SIGNAL INTERCEPTION</strong></p>
              <p>We are receiving an encrypted symbolic transmission. Find the decoder sheet to decrypt it.</p>
              <p><strong>DECODER SHEET LOCATION:</strong></p>
              <blockquote style={{ fontStyle: 'italic', borderLeft: '3px solid #00ff41', paddingLeft: '10px', color: '#ccc' }}>
                "Some answers hide in plain sight, right where everyone looks, but nobody truly sees. Behind the sheet that dictates your day, sometimes pinned sometimes pasted."
              </blockquote>
            </>
          )}
          {currentLevel === 2 && level2Access && (
            <>
              <p><strong>OBJECTIVE: SMART CITY WATER TERMINAL</strong></p>
              <p>The core logic for the city's water distribution is corrupted.</p>
              <p>You must restore the Python logic to ensure the valve opens ONLY when safe.</p>
            </>
          )}
          {currentLevel === 3 && level3Access && (
            <p>An Alarm system has been breached!!! but the circuit hardware is in a secured vault...Access the virtual circuit and debug it to restore its function!.</p>
          )}
          <button onClick={startMission} style={{ marginTop: '20px' }}>  ENTER LEVEL  </button>
        </div>
      )}

      {/* --- THE MAIN GAME DASHBOARD --- */}
      {isLoggedIn && !showWelcome && !showIntro && (
        <div style={{ animation: 'fadeIn 0.5s' }}>
          <div style={{ marginBottom: '20px', opacity: 0.8 }}>
             OPERATIVE: {teamName.toUpperCase()} | LEVEL: {currentLevel === 5 ? 'COMPLETE' : currentLevel}
          </div>

          {pausedAt && !finishedAt ? (
            <div className="clue-box" style={{ borderColor: '#ff3333', color: '#ff3333' }}>⚠ SYSTEM PAUSED ⚠</div>
          ) : (
            <>
               {/* === LEVEL 1: BINARY CIPHER === */}
               {currentLevel === 1 && (
                <div>
                  <div className="clue-box" style={{ marginBottom: '20px' }}>
                    <strong> INCOMING TRANSMISSION...</strong><br/><br/>
                    <em>"ENCRYPTED MESSAGE INCOMING"</em><br/>
                    <span style={{ fontSize: '0.85rem' }}>(Use the decoder sheet to decrypt the message.)</span>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '40px 0', background: '#000', padding: '30px 20px', border: '1px dashed #00ff41'
                  }}>
                    <div style={{ display: 'flex', gap: '20px', fontSize: '2rem', letterSpacing: '8px', color: '#fff' }}>
                      {['◼▲●◆', '▲◆◼●', '●●▲◼'].map((group, index) => (
                        <span key={index} style={{
                          opacity: flashIndex === index ? 1 : 0.3,
                          textShadow: flashIndex === index ? '0 0 20px #00ff41' : 'none',
                          transition: 'opacity 0.2s, text-shadow 0.2s'
                        }}>
                          {group}
                        </span>
                      ))}
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#888', letterSpacing: '3px', marginTop: '20px', fontFamily: 'monospace' }}>
                      [ DATA_FLOW : &lt;&lt;&lt; RTL &lt;&lt;&lt; ]
                    </div>
                  </div>

                  <p> ENTER DECODED DECIMAL SEQUENCE:</p>
                  <input type="text" placeholder="Ex: 123456" value={inputValue} onChange={e=>setInputValue(e.target.value)} />
                  <button onClick={handleSubmit}>VERIFY CODE</button>
                </div>
              )}

              {/* === LEVEL 2: COMPILER (Protected by Bakery Gateway) === */}
              {currentLevel === 2 && (
                <div>
                  {!level2Access ? (
                    // 1. The Bakery Gateway (Firewall)
                    <div>
                      <div className="clue-box">
                        <strong> SIGNAL DECODED. ACCESS CODE NEEDED FOR LEVEL 2.</strong><br/><br/>
                        "Every system needs fuel. Not the kind that powers machines; the kind that powers humans. The clue waits where students gather, where the air smells sweet, and where tired minds get rebooted with amazing donuts so tasty that even super star starts singing sahanaaaa saaral thoorutho!"<br/>
                        <br/><span style={{ fontSize: '0.85rem' }}>(firewall breach required!)</span>
                      </div>
                      <p> ENTER OVERRIDE ACCESS CODE:</p>
                      <input type="text" placeholder="Ex: CODE_123" value={inputValue} onChange={e=>setInputValue(e.target.value)} />
                      <button onClick={handleSubmit}>BYPASS FIREWALL</button>
                    </div>
                  ) : (
                    // 2. The Python Compiler (Unlocked)
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
                </div>
              )}

              {/* === LEVEL 3: TINKERCAD CIRCUIT (Protected by Dance Mirror Gateway) === */}
              {currentLevel === 3 && (
                <div>
                  {!level3Access ? (
                    // 1. The Dance Mirror Gateway (Firewall)
                    <div>
                      <div className="clue-box">
                        <strong> SYSTEM LOCKED. ACCESS KEY REQUIRED.</strong><br/><br/>
                        "Before the stage lights ever turn on, there’s one place where performers face their biggest critic. Not a person…  but a reflection. A wall that copies you perfectly… but only if you dare to look."<br/>
                        <em>"Find the glass that captures the motion."</em><br/>
                        <br/><span style={{ fontSize: '0.85rem' }}>(Find the QR Code and scan it to reveal the access key)</span>
                      </div>
                      <p> ENTER ACCESS CODE:</p>
                      <input type="text" placeholder="Ex: CODE_123" value={inputValue} onChange={e=>setInputValue(e.target.value)} />
                      <button onClick={handleSubmit}>BYPASS FIREWALL</button>
                    </div>
                  ) : (
                    // 2. The Tinkercad Simulation (Unlocked)
                    <div>
                      <div className="clue-box" style={{ marginBottom: '20px' }}>
                        <strong> VIRTUAL HARDWARE OVERRIDE</strong><br/><br/>
                        "Physical components secured. Access the virtual circuit below and debug it.
                        The circuit doesn’t speak in words. It speaks in pulses. Listen carefully for exactly 60 seconds…The rhythm is your key."<br/><br/>
                        <a 
                          href="https://www.tinkercad.com/things/3pnxJwAFLmx-brave-lahdi/editel?returnTo=https%3A%2F%2Fwww.tinkercad.com%2Fdashboard&sharecode=DorYvwPPZl5s1DR5wQZInJObiER7EeDy8A1nXYPDAm0" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{ color: '#00ff41', textDecoration: 'underline', fontWeight: 'bold' }}
                        >
                          [ OPEN CIRCUIT ]
                        </a>
                      </div>
                      <p> ENTER CODE:</p>
                      <input type="number" placeholder="___" value={inputValue} onChange={e=>setInputValue(e.target.value)} />
                      <button onClick={handleSubmit}>VERIFY</button>
                    </div>
                  )}
                </div>
              )}

              {/* === LEVEL 4: OMEGA BOX (Protected by TreesGateway) === */}
              {currentLevel === 4 && (
                <div>
                  {!level4Access ? (
                    // 1. The Trees Gateway (Firewall)
                    <div>
                      <div className="clue-box">
                        <strong> SIGNAL DECODED. FINAL COORDINATES REVEALED.</strong><br/><br/>
                        "The last access point is hidden where the campus breathes. Not in a classroom… not in a corridor… Look for the swaying green giants standing in rows."<br/>
                        <em>(Find the QR Code to unlock the Access Code.)</em>
                      </div>
                      <p> ENTER OMEGA ACCESS CODE:</p>
                      <input type="text" placeholder="Ex: OMEGA_..." value={inputValue} onChange={e=>setInputValue(e.target.value)} />
                      <button onClick={handleSubmit}>UNLOCK OMEGA BOX</button>
                    </div>
                  ) : (
                    // 2. The Omega Box (Unlocked) with Sliding Puzzle
                    <div>
                      <div className="clue-box" style={{ border: '2px solid #fff', boxShadow: '0 0 20px #fff', color: '#fff', lineHeight: '1.6' }}>
                        <strong> FINAL OBJECTIVE INITIATED</strong><br/><br/>
                        "The final asset is not hidden in a place, but guarded by a human firewall."<br/><br/>
                        "Solve the system bypass puzzle to decrypt the vocal passphrase. Once you have the word, you must find the Overseer—the one who watches the operatives, evaluates your logic, and judges this very event."<br/><br/>
                        <em style={{ color: '#00ff41' }}>
                          (Find the Overseer and surrender the passphrase to them to receive the OMEGA BOX.)
                        </em>
                      </div>

                      {/* --- SLIDING PUZZLE COMPONENT --- */}
                      <div style={{ margin: '30px auto', width: 'max-content', textAlign: 'center' }}>
                        <div style={{ 
                          display: 'grid', gridTemplateColumns: 'repeat(3, 80px)', gap: '5px', 
                          background: '#333', padding: '10px', borderRadius: '5px', border: isPuzzleSolved ? '2px solid #00ff41' : '2px solid transparent',
                          boxShadow: isPuzzleSolved ? '0 0 20px #00ff41' : 'none', transition: 'all 0.3s'
                        }}>
                          {puzzle.map((tile, index) => (
                            <div
                              key={index}
                              onClick={() => handleTileClick(index)}
                              style={{
                                width: '80px', height: '80px',
                                background: tile === 0 ? '#111' : (isPuzzleSolved ? '#00ff41' : '#222'),
                                color: isPuzzleSolved ? '#000' : '#00ff41',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '2rem', fontWeight: 'bold', 
                                cursor: tile === 0 || isPuzzleSolved ? 'default' : 'pointer',
                                border: tile === 0 ? 'none' : '1px solid #00ff41',
                                transition: 'background 0.3s, color 0.3s'
                              }}
                            >
                              {tile !== 0 ? tile : ''}
                            </div>
                          ))}
                        </div>
                        
                        {isPuzzleSolved && (
                          <div style={{ marginTop: '20px', padding: '15px', background: '#00ff41', color: '#000', fontWeight: 'bold', fontSize: '1.2rem', animation: 'fadeIn 0.5s' }}>
                            &gt;&gt; PASSPHRASE DECRYPTED: CYBER_SYNAPSE
                          </div>
                        )}
                      </div>

                      <p> ENTER FINAL COMPLETION CODE (From inside the Box):</p>
                      <input type="text" placeholder="HEIST_..." value={inputValue} onChange={e=>setInputValue(e.target.value)} />
                      <button onClick={handleSubmit} style={{ background: '#fff', color: '#000', fontWeight: 'bold' }}>STOP TIMER</button>
                    </div>
                  )}
                </div>
              )}

              {/* === LEVEL 5: VICTORY === */}
              {currentLevel === 5 && (
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