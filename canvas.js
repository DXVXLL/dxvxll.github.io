
// Файл отвечающий за рисование карандашом

let pencilCanvas = null;
let ctx = null;
let workspace = null;

export let canvasImageData = null;

let drawnLines = []; 
let currentLine = [];

export function initCanvas(onDrawEnd) {
  pencilCanvas = document.getElementById('pencil-canvas');
  workspace = document.getElementById('workspace');
  
  if (!pencilCanvas || !workspace) return;

  ctx = pencilCanvas.getContext('2d');

  function resizeCanvas() {
    pencilCanvas.width = workspace.clientWidth;
    pencilCanvas.height = workspace.clientHeight;
    redrawCanvas();
  }
  
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  let isDrawing = false;

  pencilCanvas.addEventListener('mousedown', (e) => {
    if (!document.body.classList.contains('mode-pencil')) return;
    isDrawing = true;
    const rect = pencilCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    currentLine = [{ x, y }];
  });

  pencilCanvas.addEventListener('mousemove', (e) => {
    if (!isDrawing || !document.body.classList.contains('mode-pencil')) return;
    const rect = pencilCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const lastPoint = currentLine[currentLine.length - 1];

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    currentLine.push({ x, y });
  });

  window.addEventListener('mouseup', () => {
    if (isDrawing) {
      isDrawing = false;
      if (currentLine.length > 1) {
        drawnLines.push(currentLine);
      }
      canvasImageData = pencilCanvas.toDataURL();
      if (onDrawEnd) onDrawEnd();
    }
  });
}

export function checkAndEraseLineAt(x, y, radius = 25) {
  let lineDeleted = false;

  drawnLines = drawnLines.filter(line => {
    const isHit = line.some(point => {
      const dist = Math.hypot(point.x - x, point.y - y);
      return dist <= radius;
    });

    if (isHit) {
      lineDeleted = true;
      return false; 
    }
    return true;
  });

  if (lineDeleted) {
    redrawCanvas();
    const canvas = document.getElementById('pencil-canvas');
    canvasImageData = canvas ? canvas.toDataURL() : null;
  }
  return lineDeleted;
}

export function redrawCanvas() {
  if (!ctx || !pencilCanvas) return;
  ctx.clearRect(0, 0, pencilCanvas.width, pencilCanvas.height);

  drawnLines.forEach(line => {
    if (line.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(line[0].x, line[0].y);
    for (let i = 1; i < line.length; i++) {
      ctx.lineTo(line[i].x, line[i].y);
    }
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  });
}

export function clearCanvas() {
  drawnLines = [];
  canvasImageData = null;
  if (ctx) {
    ctx.clearRect(0, 0, pencilCanvas.width, pencilCanvas.height);
  }
}

export function getLinesData() { 
  return drawnLines; 
}

export function setLinesData(lines) { 
  drawnLines = lines || []; 
  redrawCanvas(); 
}