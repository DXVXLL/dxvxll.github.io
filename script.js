import { findSmartPath, getSnappedCoords } from './pathfinding.js';
import { initCanvas, clearCanvas, checkAndEraseLineAt } from './canvas.js';
import { saveMap, loadMap, initFileControls } from './storage.js';
import { DOM, state, HALF_NODE, initDOM } from './state.js';
import { 
  createGhostNode, 
  createDeleteParticles, 
  resetSelection, 
  applyRoadStyles, 
  switchTab, 
  initStaticListeners,
  setEngineMode
} from './ui.js';

document.addEventListener('DOMContentLoaded', () => {

  initDOM();
  createGhostNode();
  initCanvas(() => saveMap());
  initFileControls(() => triggerGlobalLoad());
  initStaticListeners(); 
  
  setEngineMode('pointer');

  /* 1. Настройки объектов */

  function openNodeSettings(node) {
    resetSelection();
    state.selectedNode = node;
    node.classList.add('selected');

    if (DOM.emptySettingsMsg) DOM.emptySettingsMsg.style.display = 'none';
    if (DOM.roadSettings) DOM.roadSettings.style.display = 'none';
    if (DOM.nodeSettings) DOM.nodeSettings.style.display = 'block';

    if (DOM.nodeColor) DOM.nodeColor.value = node.getAttribute('data-color') || '#ffffff';
    if (DOM.nodeIcon) DOM.nodeIcon.value = node.getAttribute('data-icon') || '';

    if (DOM.propertiesContent) {
      const textDiv = node.querySelector('.node-text');
      DOM.propertiesContent.innerHTML = `
        <div class="setting-group" style="margin-top: 15px; margin-bottom: 15px;">
          <label style="display:block; margin-bottom:5px; font-weight:bold;">Название локации:</label>
          <input type="text" id="prop-node-name" value="${textDiv ? textDiv.textContent : ''}" style="width:100%; padding:6px; border:2px solid #000; font-weight:bold;">
        </div>
        <button id="btn-clear-canvas" style="width:100%; padding:8px; background:#fff; border:2px solid #000; font-weight:bold; cursor:pointer; margin-bottom:15px;">🧹 Стереть рисунки карандаша</button>
      `;

      document.getElementById('prop-node-name')?.addEventListener('input', (e) => {
        if (textDiv) textDiv.textContent = e.target.value;
        saveMap();
      });

      document.getElementById('btn-clear-canvas')?.addEventListener('click', () => {
        if (confirm('Стереть наброски карандаша с карты?')) {
          clearCanvas();
          saveMap();
        }
      });
    }
    switchTab('settings');
  }

  function openRoadSettings(road) {
    resetSelection();
    state.selectedRoad = road;
    road.classList.add('selected-road');
    applyRoadStyles(road);

    if (DOM.emptySettingsMsg) DOM.emptySettingsMsg.style.display = 'none';
    if (DOM.nodeSettings) DOM.nodeSettings.style.display = 'none';
    if (DOM.roadSettings) DOM.roadSettings.style.display = 'block';
    if (DOM.propertiesContent) DOM.propertiesContent.innerHTML = '';

    if (DOM.roadType) DOM.roadType.value = road.getAttribute('data-type') || 'normal';
    if (DOM.roadColor) DOM.roadColor.value = road.getAttribute('data-color') || '#000000';

    switchTab('settings');
  }

  /* 2. Обнволение и отрисовка дорог */

  function updateNodeRoads(node, customX = null, customY = null) {
    const nodeId = node.id;
    const connectedRoads = DOM.roadsSvg.querySelectorAll(`[data-from="${nodeId}"], [data-to="${nodeId}"]`);

    connectedRoads.forEach(road => {
      road.classList.remove('road-appearing', 'road-dashed-appearing');
      const nodeA = document.getElementById(road.getAttribute('data-from'));
      const nodeB = document.getElementById(road.getAttribute('data-to'));

      if (nodeA && nodeB) {
        const xA = (nodeA === node ? (customX !== null ? customX : parseInt(nodeA.style.left)) : parseInt(nodeA.style.left));
        const yA = (nodeA === node ? (customY !== null ? customY : parseInt(nodeA.style.top)) : parseInt(nodeA.style.top));
        const xB = (nodeB === node ? (customX !== null ? customX : parseInt(nodeB.style.left)) : parseInt(nodeB.style.left));
        const yB = (nodeB === node ? (customY !== null ? customY : parseInt(nodeB.style.top)) : parseInt(nodeB.style.top));

        const customCoordsInfo = (customX !== null) ? { id: node.id, x: customX, y: customY } : null;
        const smartPoints = findSmartPath(xA + HALF_NODE, yA + HALF_NODE, xB + HALF_NODE, yB + HALF_NODE, customCoordsInfo);
        road.setAttribute('points', smartPoints);
      }
    });
  }

  function triggerRoadAnimation(polyline) {
    const length = polyline.getTotalLength() || 200; 
    const type = polyline.getAttribute('data-type') || 'normal';

    if (type === 'dashed') {
      let dashPattern = "";
      for (let i = 0; i < Math.ceil(length / 24) + 2; i++) dashPattern += "10 14 ";
      polyline.style.strokeDasharray = `${dashPattern} ${length}`;
      polyline.style.strokeDashoffset = length;
      polyline.classList.add('road-dashed-appearing');
    } else {
      polyline.style.strokeDasharray = length;
      polyline.style.strokeDashoffset = length;
      polyline.classList.add('road-appearing');
    }
    
    polyline.addEventListener('animationend', () => {
      polyline.classList.remove('road-appearing', 'road-dashed-appearing');
      polyline.style.strokeDasharray = '';
      polyline.style.strokeDashoffset = '';
      applyRoadStyles(polyline);
    }, { once: true });
  }

  function drawRoad(nodeA, nodeB, skipAnimation = false) {
  const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  polyline.classList.add('map-road');
  polyline.setAttribute('data-from', nodeA.id);
  polyline.setAttribute('data-to', nodeB.id);
    polyline.setAttribute('data-type', 'normal');
    polyline.setAttribute('data-color', '#000000');
    polyline.setAttribute('stroke', '#000000');
    polyline.setAttribute('stroke-width', '4');
    polyline.style.pointerEvents = 'auto';

    const smartPoints = findSmartPath(parseInt(nodeA.style.left) + HALF_NODE, parseInt(nodeA.style.top) + HALF_NODE, parseInt(nodeB.style.left) + HALF_NODE, parseInt(nodeB.style.top) + HALF_NODE);
    polyline.setAttribute('points', smartPoints);

    DOM.roadsSvg.appendChild(polyline);
    applyRoadStyles(polyline, true);

    if (!skipAnimation) {
      requestAnimationFrame(() => triggerRoadAnimation(polyline));
    }
    return polyline;
  }

  /* 3. Создание локаций */

  function createNodeOnWorkspace(id, left, top, text = 'Локация', color = '#ffffff', icon = '') {
    const newNode = document.createElement('div');
    newNode.classList.add('map-node');
    newNode.id = id;
    newNode.setAttribute('data-color', color);
    newNode.setAttribute('data-icon', icon);
    newNode.style.left = left;
    newNode.style.top = top;
    newNode.style.backgroundColor = color;
    
    newNode.innerHTML = `
      <div class="node-icon-display">${icon}</div>
      <div class="node-text">${text}</div>
    `;

    newNode.addEventListener('mousedown', function(event) {
      // Перетаскивать можно и обычным курсором, и инструментом локации
      if (state.currentMode !== 'pointer' && state.currentMode !== 'select') return;
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT') return;

      state.draggedNode = newNode;
      const rect = DOM.workspace.getBoundingClientRect();
      state.dragOffset.x = event.clientX - rect.left - parseInt(newNode.style.left);
      state.dragOffset.y = event.clientY - rect.top - parseInt(newNode.style.top);
      newNode.style.opacity = '0.6';
      
      const targetCoords = getSnappedCoords(parseInt(newNode.style.left) + HALF_NODE, parseInt(newNode.style.top) + HALF_NODE);
      if (state.ghostNode) {
        state.ghostNode.style.left = `${targetCoords.x}px`;
        state.ghostNode.style.top = `${targetCoords.y}px`;
        state.ghostNode.style.display = 'block';
      }

      event.stopPropagation();
    });

    DOM.workspace.appendChild(newNode);
  }

  /* 4. События связанные с мышью */

  document.addEventListener('mousemove', function(event) {
    const rect = DOM.workspace.getBoundingClientRect();
    const rawX = event.clientX - rect.left;
    const rawY = event.clientY - rect.top;

    if (state.currentMode === 'select' && !state.draggedNode && state.ghostNode) {
      const targetCoords = getSnappedCoords(rawX, rawY);
      state.ghostNode.style.left = `${targetCoords.x}px`;
      state.ghostNode.style.top = `${targetCoords.y}px`;
    }

    if (state.draggedNode) {
      let nodeX = rawX - state.dragOffset.x;
      let nodeY = rawY - state.dragOffset.y;

      state.draggedNode.style.left = `${nodeX}px`;
      state.draggedNode.style.top = `${nodeY}px`;

      const targetCoords = getSnappedCoords(nodeX + HALF_NODE, nodeY + HALF_NODE);
      if (state.ghostNode) {
        state.ghostNode.style.left = `${targetCoords.x}px`;
        state.ghostNode.style.top = `${targetCoords.y}px`;
      }

      updateNodeRoads(state.draggedNode, targetCoords.x, targetCoords.y);
    }
  });

  document.addEventListener('mouseup', function() {
    if (state.draggedNode) {
      const currentX = parseInt(state.draggedNode.style.left);
      const currentY = parseInt(state.draggedNode.style.top);
      const coords = getSnappedCoords(currentX + HALF_NODE, currentY + HALF_NODE);

      state.draggedNode.style.left = `${coords.x}px`;
      state.draggedNode.style.top = `${coords.y}px`;
      state.draggedNode.style.opacity = '';

      if (state.currentMode !== 'select' && state.ghostNode) {
        state.ghostNode.style.display = 'none';
      }

      updateNodeRoads(state.draggedNode);
      state.draggedNode = null;
      saveMap();
    }
  });

  DOM.workspace.addEventListener('mousedown', function(event) {
    const targetId = event.target.id;
    if (event.target === DOM.workspace || targetId === 'pencil-canvas' || targetId === 'roads-svg') {
      resetSelection();
    }

    if (state.currentMode === 'delete' && (targetId === 'pencil-canvas' || event.target === DOM.workspace)) {
      const rect = DOM.pencilCanvas.getBoundingClientRect();
      const canvasX = event.clientX - rect.left;
      const canvasY = event.clientY - rect.top;
      
      if (checkAndEraseLineAt(canvasX, canvasY, 25)) {
        const workspaceRect = DOM.workspace.getBoundingClientRect();
        createDeleteParticles(event.clientX - workspaceRect.left, event.clientY - workspaceRect.top);
        saveMap();
      }
    }
  });

  DOM.workspace.addEventListener('click', function(event) {
    const clickedNode = event.target.closest('.map-node');
    const clickedRoad = event.target.closest('.map-road');
    const rect = DOM.workspace.getBoundingClientRect();
    const rawX = event.clientX - rect.left;
    const rawY = event.clientY - rect.top;

    if (state.currentMode === 'delete') {
      if (clickedNode) {
        event.stopPropagation();
        createDeleteParticles(parseInt(clickedNode.style.left) + HALF_NODE, parseInt(clickedNode.style.top) + HALF_NODE);
        clickedNode.classList.add('node-disappearing');
        DOM.roadsSvg.querySelectorAll(`[data-from="${clickedNode.id}"], [data-to="${clickedNode.id}"]`).forEach(r => r.remove());
        resetSelection();

        clickedNode.addEventListener('animationend', () => {
          clickedNode.remove();
          saveMap();
        });
      } else if (clickedRoad) {
        event.stopPropagation();
        createDeleteParticles(rawX, rawY);
        clickedRoad.remove();
        resetSelection();
        saveMap();
      }
      return;
    }

    if (state.currentMode === 'road') {
      if (clickedNode) {
        event.stopPropagation();
        if (!state.roadStartNode) {
          state.roadStartNode = clickedNode;
          clickedNode.style.borderColor = '#00acc1'; 
        } else {
          if (clickedNode !== state.roadStartNode) {
            drawRoad(state.roadStartNode, clickedNode, false);
            saveMap();
          }
          state.roadStartNode.style.borderColor = '#000000';
          state.roadStartNode = null;
        }
      }
      return;
    }

    if (state.currentMode === 'pointer' || state.currentMode === 'select') {
      if (clickedNode) {
        event.stopPropagation();
        openNodeSettings(clickedNode);
        return;
      }
      if (clickedRoad) {
        event.stopPropagation();
        openRoadSettings(clickedRoad);
        return;
      }

      if (state.currentMode === 'select' && (event.target === DOM.workspace || event.target.id === 'pencil-canvas' || event.target.id === 'roads-svg')) {
        const coords = getSnappedCoords(rawX, rawY);
        createNodeOnWorkspace('node-' + Date.now(), `${coords.x}px`, `${coords.y}px`);
        saveMap();
      }
    }
  });

  function triggerGlobalLoad() {
    loadMap(createNodeOnWorkspace, drawRoad, applyRoadStyles, triggerRoadAnimation);
  }

  triggerGlobalLoad();
});