
// Файл отвечает за пользовательский интерфейс

import { DOM, state, NODE_SIZE } from './state.js';
import { saveMap } from './storage.js';

export function createGhostNode() {
  const ghost = document.createElement('div');
  ghost.classList.add('map-node-preview');
  Object.assign(ghost.style, {
    position: 'absolute',
    width: `${NODE_SIZE}px`,
    height: `${NODE_SIZE}px`,
    border: '3px dashed #00ecc1',
    borderRadius: '4px',
    backgroundColor: 'rgba(0, 236, 193, 0.15)',
    pointerEvents: 'none',
    zIndex: '2',
    display: 'none'
  });
  DOM.workspace.appendChild(ghost);
  state.ghostNode = ghost;
}

export function createDeleteParticles(x, y) {
  const particleCount = 12;
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.classList.add('delete-particle');
    
    const size = Math.random() * 8 + 6;
    const angle = Math.random() * Math.PI * 2;
    const velocity = Math.random() * 70 + 40;
    const dx = Math.cos(angle) * velocity;
    const dy = Math.sin(angle) * velocity;
    
    Object.assign(particle.style, {
      width: `${size}px`,
      height: `${size}px`,
      left: `${x - size / 2}px`,
      top: `${y - size / 2}px`
    });
    
    particle.style.setProperty('--dx', `${dx}px`);
    particle.style.setProperty('--dy', `${dy}px`);
    particle.style.setProperty('--line-dy', `${dy}px`);

    particle.addEventListener('animationend', () => particle.remove());
    fragment.appendChild(particle);
  }
  DOM.workspace.appendChild(fragment);
}

export function switchTab(tabName) {
  const isAssets = tabName === 'assets';
  DOM.tabAssetsBtn?.classList.toggle('active', isAssets);
  DOM.tabSettingsBtn?.classList.toggle('active', !isAssets);
  DOM.contentAssets?.classList.toggle('active', isAssets);
  DOM.contentSettings?.classList.toggle('active', !isAssets);
}

export function applyRoadStyles(road, isInitializing = false) {
  const type = road.getAttribute('data-type') || 'normal';
  const color = road.getAttribute('data-color') || '#000000';
  const isDark = document.body.classList.contains('dark-theme');
  
  let finalColor = color;
  if (isDark && color === '#000000') {
      finalColor = '#5a637d'; 
  } else if (!isDark && color === '#5a637d') {
      finalColor = '#000000';
  }

  road.style.setProperty('--road-color', finalColor);

  if (!isInitializing) {
      road.style.stroke = ''; 
      if (road === state.selectedRoad) {
        road.style.stroke = '#00acc1';
      }
  }
  
  road.classList.remove('type-dashed', 'type-wide');
  if (type === 'dashed') road.classList.add('type-dashed');
  if (type === 'wide') road.classList.add('type-wide');
}

export function resetSelection() {
  if (state.selectedRoad) {
    const prevRoad = state.selectedRoad;
    state.selectedRoad = null;
    prevRoad.classList.remove('selected-road');
    applyRoadStyles(prevRoad);
  }
  if (state.selectedNode) {
    state.selectedNode.classList.remove('selected');
    state.selectedNode = null;
  }
  
  if (DOM.roadSettings) DOM.roadSettings.style.display = 'none';
  if (DOM.nodeSettings) DOM.nodeSettings.style.display = 'none';
  if (DOM.emptySettingsMsg) DOM.emptySettingsMsg.style.display = 'block';
  if (DOM.propertiesContent) DOM.propertiesContent.innerHTML = '';
}

export function setEngineMode(modeName) {
  if (state.currentMode === modeName) {
    modeName = 'pointer';
  }

  state.currentMode = modeName;
  
  if (state.roadStartNode) {
    state.roadStartNode.style.borderColor = '#000000';
    state.roadStartNode = null;
  }

  DOM.toolLoc?.classList.toggle('active', modeName === 'select');
  DOM.toolRoad?.classList.toggle('active', modeName === 'road');
  DOM.toolPencil?.classList.toggle('active', modeName === 'pencil');
  DOM.toolDelete?.classList.toggle('active', modeName === 'delete');

  const isDark = document.body.classList.contains('dark-theme');
  document.body.className = isDark ? `dark-theme mode-${modeName}` : `mode-${modeName}`;
  
  if (state.ghostNode) {
    state.ghostNode.style.display = (modeName === 'select') ? 'block' : 'none';
  }
  
  resetSelection();
}

export function toggleTheme() {
  const body = document.body;
  const isDark = body.classList.contains('dark-theme');
  
  if (isDark) {
    body.classList.remove('dark-theme');
    state.theme = 'light';
    if (DOM.themeToggle) DOM.themeToggle.textContent = '☀️';
  } else {
    body.classList.add('dark-theme');
    state.theme = 'dark';
    if (DOM.themeToggle) DOM.themeToggle.textContent = '🌙';
  }
  localStorage.setItem('map-constructor-theme', state.theme);

  const allRoads = document.querySelectorAll('.map-road');
  allRoads.forEach(road => applyRoadStyles(road));
}

export function initStaticListeners() {
  DOM.tabAssetsBtn?.addEventListener('click', () => switchTab('assets'));
  DOM.tabSettingsBtn?.addEventListener('click', () => switchTab('settings'));
  DOM.themeToggle?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleTheme();
   });

  DOM.nodeColor?.addEventListener('change', (e) => {
    if (state.selectedNode) {
      state.selectedNode.style.backgroundColor = e.target.value;
      state.selectedNode.setAttribute('data-color', e.target.value);
      saveMap();
    }
  });

  DOM.nodeIcon?.addEventListener('change', (e) => {
    if (state.selectedNode) {
      state.selectedNode.setAttribute('data-icon', e.target.value);
      const iconDisplay = state.selectedNode.querySelector('.node-icon-display');
      if (iconDisplay) iconDisplay.textContent = e.target.value;
      saveMap();
    }
  });

  DOM.roadType?.addEventListener('change', (e) => {
    if (state.selectedRoad) {
      state.selectedRoad.setAttribute('data-type', e.target.value);
      applyRoadStyles(state.selectedRoad);
      saveMap();
    }
  });

  DOM.roadColor?.addEventListener('change', (e) => {
    if (state.selectedRoad) {
      state.selectedRoad.setAttribute('data-color', e.target.value);
      applyRoadStyles(state.selectedRoad);
      saveMap();
    }
  });

  DOM.toolLoc?.addEventListener('click', () => setEngineMode('select'));
  DOM.toolRoad?.addEventListener('click', () => setEngineMode('road'));
  DOM.toolPencil?.addEventListener('click', () => setEngineMode('pencil'));
  DOM.toolDelete?.addEventListener('click', () => setEngineMode('delete'));

  const savedTheme = localStorage.getItem('map-constructor-theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
    state.theme = 'dark';
    if (DOM.themeToggle) DOM.themeToggle.textContent = '🌙';
  }
}