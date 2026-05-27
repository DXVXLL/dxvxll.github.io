
// Файл отвечающий за поиск оптимального пути между локациями

const gridSize = 60;
const nodeSize = 120;

export function findSmartPath(startX, startY, endX, endY, customNodeCoords = null) {
  const startGrid = { x: Math.round(startX / gridSize), y: Math.round(startY / gridSize) };
  const endGrid = { x: Math.round(endX / gridSize), y: Math.round(endY / gridSize) };

  const blockedCells = new Set();
  const bufferCells = new Set();

  document.querySelectorAll('.map-node').forEach(node => {
    let nX = parseInt(node.style.left);
    let nY = parseInt(node.style.top);

    if (customNodeCoords && node.id === customNodeCoords.id) {
      nX = customNodeCoords.x;
      nY = customNodeCoords.y;
    }

    const gX = Math.round(nX / gridSize);
    const gY = Math.round(nY / gridSize);

    for (let x = 0; x < 2; x++) {
      for (let y = 0; y < 2; y++) {
        blockedCells.add(`${gX + x},${gY + y}`);
      }
    }

    for (let x = -1; x <= 2; x++) {
      for (let y = -1; y <= 2; y++) {
        const key = `${gX + x},${gY + y}`;
        if (!blockedCells.has(key)) {
          bufferCells.add(key);
        }
      }
    }
  });

  const isStartOrEnd = (x, y) => {
    return (x >= startGrid.x - 1 && x <= startGrid.x + 2 && y >= startGrid.y - 1 && y <= startGrid.y + 2) ||
           (x >= endGrid.x - 1 && x <= endGrid.x + 2 && y >= endGrid.y - 1 && y <= endGrid.y + 2);
  };

  const queue = [ { x: startGrid.x, y: startGrid.y, cost: 0 } ];
  const distances = {};
  const parentMap = {};
  
  const startKey = `${startGrid.x},${startGrid.y}`;
  distances[startKey] = 0;

  const directions = [
    { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }
  ];

  const minX = Math.min(startGrid.x, endGrid.x) - 15;
  const maxX = Math.max(startGrid.x, endGrid.x) + 15;
  const minY = Math.min(startGrid.y, endGrid.y) - 15;
  const maxY = Math.max(startGrid.y, endGrid.y) + 15;

  let found = false;

  while (queue.length > 0) {
    queue.sort((a, b) => a.cost - b.cost);
    const current = queue.shift();
    const cx = current.x;
    const cy = current.y;
    const currentKey = `${cx},${cy}`;

    if (cx === endGrid.x && cy === endGrid.y) {
      found = true;
      break;
    }

    if (current.cost > distances[currentKey]) continue;

    for (const dir of directions) {
      const nx = cx + dir.x;
      const ny = cy + dir.y;
      const nextKey = `${nx},${ny}`;

      if (nx < minX || nx > maxX || ny < minY || ny > maxY) continue;
      if (blockedCells.has(nextKey) && !isStartOrEnd(nx, ny)) continue;

      let moveCost = 1; 
      if (bufferCells.has(nextKey) && !isStartOrEnd(nx, ny)) {
        moveCost = 5; 
      }

      const newCost = current.cost + moveCost;

      if (distances[nextKey] === undefined || newCost < distances[nextKey]) {
        distances[nextKey] = newCost;
        parentMap[nextKey] = currentKey;
        queue.push({ x: nx, y: ny, cost: newCost });
      }
    }
  }

  const points = [];
  if (found) {
    let currentKey = `${endGrid.x},${endGrid.y}`;
    while (currentKey) {
      const [gridX, gridY] = currentKey.split(',').map(Number);
      points.unshift(`${gridX * gridSize},${gridY * gridSize}`);
      currentKey = parentMap[currentKey];
    }
  } else {
    points.push(`${startX},${startY}`);
    points.push(`${startX},${endY}`);
    points.push(`${endX},${endY}`);
    points.push(`${endX},${endY}`);
  }

  return points.join(' ');
}

export function getSnappedCoords(rawX, rawY) {
  return {
    x: Math.floor((rawX - nodeSize / 2) / gridSize) * gridSize,
    y: Math.floor((rawY - nodeSize / 2) / gridSize) * gridSize
  };
}