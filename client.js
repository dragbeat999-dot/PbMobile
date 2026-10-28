// Ambil script asli dari pbmobile
import('https://pbmobile.app/static/client.js')
  .then(() => {
    console.log("Script asli PB berhasil dimuat!");
  })
  .catch(err => console.error(err));

// --- SUNTIKAN CHEAT KITA ---
setTimeout(() => {
  const ui = document.createElement('div');
  ui.style.cssText = 'position:fixed; top:20px; left:20px; z-index:999999; background:rgba(15,15,20,0.9); color:#fff; padding:12px; border-radius:10px; font-family:monospace; border:1px solid #0f0; box-shadow:0 0 15px #0f0; width:220px; pointer-events:auto;';
  ui.innerHTML = `
      <div style="font-weight:bold; color:#0f0; text-align:center; margin-bottom:8px;">🪱 INJECTOR v8</div>
      <label style="display:flex; justify-content:space-between; margin:8px 0;"><span>Aimbot</span><input type="checkbox" id="ws-aim" checked></label>
      <label style="display:flex; justify-content:space-between; margin:8px 0;"><span>ESP Box</span><input type="checkbox" id="ws-esp" checked></label>
      <label style="display:flex; justify-content:space-between; margin:8px 0;"><span>Auto HS</span><input type="checkbox" id="ws-head"></label>
      <div style="margin:8px 0;">
          <div style="display:flex; justify-content:space-between; font-size:10px;"><span>Smooth</span><span id="val-smooth">5</span></div>
          <input type="range" id="ws-smooth" min="1" max="20" step="1" value="5" style="width:100%;">
      </div>
      <div id="ws-status" style="color:#ffaa00; margin-top:8px; font-size:10px; text-align:center;">Menunggu 3D Engine...</div>
  `;
  document.body.appendChild(ui);

  const espCanvas = document.createElement('canvas');
  espCanvas.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; pointer-events:none; z-index:999998;';
  document.body.appendChild(espCanvas);
  const espCtx = espCanvas.getContext('2d');

  let aimEnabled = true, espEnabled = true, headshotEnabled = false, smoothness = 5;
  document.getElementById('ws-aim').onchange = e => aimEnabled = e.target.checked;
  document.getElementById('ws-esp').onchange = e => espEnabled = e.target.checked;
  document.getElementById('ws-head').onchange = e => headshotEnabled = e.target.checked;
  document.getElementById('ws-smooth').oninput = e => {
      smoothness = parseInt(e.target.value);
      document.getElementById('val-smooth').innerText = e.target.value;
  };

  let scene, camera, THREE;
  function findEngine() {
      if (window.THREE) {
          THREE = window.THREE;
          if (!THREE.WebGLRenderer.__wsPatched) {
              const origRender = THREE.WebGLRenderer.prototype.render;
              THREE.WebGLRenderer.prototype.render = function(s, c) {
                  window.__GAME_SCENE = s;
                  window.__GAME_CAMERA = c;
                  return origRender.apply(this, arguments);
              };
              THREE.WebGLRenderer.__wsPatched = true;
          }
      }
      
      scene = window.__GAME_SCENE;
      camera = window.__GAME_CAMERA;

      if (scene && camera) {
          document.getElementById('ws-status').innerText = 'ENGINE HIJACKED!';
          document.getElementById('ws-status').style.color = '#0f0';
          runAimLoop();
      } else {
          setTimeout(findEngine, 1000);
      }
  }
  
  let isLooping = false;
  function runAimLoop() {
      if (isLooping) return;
      isLooping = true;
      
      function loop() {
          requestAnimationFrame(loop);
          if (!scene || !camera) return;
          
          espCanvas.width = window.innerWidth;
          espCanvas.height = window.innerHeight;
          espCtx.clearRect(0, 0, espCanvas.width, espCanvas.height);

          const camPos = new THREE.Vector3();
          camera.getWorldPosition(camPos);
          
          let closestEnemy = null;
          let minDist = 9999;
          let enemies = [];

          scene.traverse(obj => {
              if ((obj.isMesh || obj.isGroup) && obj.visible) {
                  const p = new THREE.Vector3();
                  obj.getWorldPosition(p);
                  const d = p.distanceTo(camPos);
                  
                  if (d > 2 && d < 100) {
                      let screenPos = p.clone().project(camera);
                      if (screenPos.z < 1) {
                          let x = (screenPos.x * .5 + .5) * window.innerWidth;
                          let y = (-(screenPos.y * .5 + .5)) * window.innerHeight;
                          enemies.push({ pos: p, dist: d, x: x, y: y });
                          if (d < minDist) { minDist = d; closestEnemy = p; }
                      }
                  }
              }
          });

          if (espEnabled) {
              espCtx.lineWidth = 2;
              espCtx.strokeStyle = '#ff0000';
              espCtx.font = '12px monospace';
              espCtx.fillStyle = '#ff0000';
              enemies.forEach(enemy => {
                  const boxSize = Math.max(20, (100 - enemy.dist));
                  espCtx.strokeRect(enemy.x - (boxSize/2), enemy.y - (boxSize/2), boxSize, boxSize);
                  espCtx.fillText('[' + Math.floor(enemy.dist) + 'm]', enemy.x + (boxSize/2) + 5, enemy.y);
              });
          }

          if (aimEnabled && closestEnemy) {
              const targetPos = closestEnemy.clone();
              if (headshotEnabled) targetPos.y += 0.15;
              
              const dummyCam = camera.clone();
              dummyCam.lookAt(targetPos);
              const targetQuat = dummyCam.quaternion.clone();
              camera.quaternion.slerp(targetQuat, 1 / smoothness);
          }
      }
      loop();
  }

  setTimeout(findEngine, 3000);
}, 1000);
