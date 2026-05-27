
// Файл отвечающий за работу с данными картами

import { getLinesData, setLinesData, clearCanvas } from './canvas.js';

export function saveMap() {
  const nodes = [];
  document.querySelectorAll('.map-node').forEach(node => {
    if (!node.classList.contains('node-disappearing')) {
      nodes.push({
        id: node.id,
        left: node.style.left,
        top: node.style.top,
        text: node.querySelector('.node-text')?.textContent || 'Локация',
        color: node.getAttribute('data-color') || '#ffffff',
        icon: node.getAttribute('data-icon') || ''
      });
    }
  });

  const roads = [];
  document.querySelectorAll('.map-road').forEach(road => {
    roads.push({
      from: road.getAttribute('data-from'),
      to: road.getAttribute('data-to'),
      type: road.getAttribute('data-type') || 'normal',
      color: road.getAttribute('data-color') || '#000000'
    });
  });

  const mapData = {
    nodes: nodes,
    roads: roads,
    pencilLines: getLinesData() 
  };

  localStorage.setItem('dmp_map_save', JSON.stringify(mapData));
}

export function loadMap(createNodeFn, drawRoadFn, applyRoadStylesFn, triggerAnimationFn) {
  const rawData = localStorage.getItem('dmp_map_save');
  if (!rawData) {
    clearCanvas();
    return;
  }

  try {
    const mapData = JSON.parse(rawData);

    document.querySelectorAll('.map-node').forEach(n => n.remove());
    document.querySelectorAll('.map-road').forEach(r => r.remove());
    clearCanvas();

    if (mapData.nodes && Array.isArray(mapData.nodes)) {
      mapData.nodes.forEach(node => {
        createNodeFn(node.id, node.left, node.top, node.text, node.color, node.icon);
      });
    }

    if (mapData.roads && Array.isArray(mapData.roads)) {
      mapData.roads.forEach(roadData => {
        const nodeA = document.getElementById(roadData.from);
        const nodeB = document.getElementById(roadData.to);
        if (nodeA && nodeB) {
          const roadElement = drawRoadFn(nodeA, nodeB, true);
          if (roadElement) {
            roadElement.setAttribute('data-type', roadData.type);
            roadElement.setAttribute('data-color', roadData.color);
            applyRoadStylesFn(roadElement);
          }
        }
      });
    }

    if (mapData.pencilLines && Array.isArray(mapData.pencilLines)) {
      setLinesData(mapData.pencilLines);
    }

  } catch (error) {
    console.error("Ошибка при чтении или парсинге файла сохранения карты:", error);
  }
}

export function initFileControls(onImportComplete) {
  const btnExport = document.getElementById('btn-export');
  const btnImport = document.getElementById('btn-import');
  const importFileInput = document.getElementById('import-file');

  btnExport?.addEventListener('click', () => {
    const rawData = localStorage.getItem('dmp_map_save');
    if (!rawData) {
      alert('Карта пуста. Нечего скачивать!');
      return;
    }

    const blob = new Blob([rawData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dmp-map-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  btnImport?.addEventListener('click', () => {
    importFileInput?.click();
  });

  importFileInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const testParse = JSON.parse(event.target.result);
        if (testParse && typeof testParse === 'object') {
          localStorage.setItem('dmp_map_save', event.target.result);
          if (onImportComplete) onImportComplete();
        } else {
          alert('Неверная структура файла карты.');
        }
      } catch (err) {
        alert('Ошибка при чтении JSON-файла.');
      }
    };
    reader.readAsText(file);
    importFileInput.value = '';
  });
}