
// Файл отвечает за кэш DOM эл-тов

export const NODE_SIZE = 120;
export const HALF_NODE = 60;

export let DOM = {};

export function initDOM() {
  DOM = {
   workspace: document.getElementById('workspace'),
   roadsSvg: document.getElementById('roads-svg'),
   pencilCanvas: document.getElementById('pencil-canvas'),

   themeToggle: document.getElementById('theme-toggle'),

   toolLoc: document.getElementById('tool-loc'),
   toolRoad: document.getElementById('tool-road'),
   toolPencil: document.getElementById('tool-pencil'),
   toolDelete: document.getElementById('tool-delete'),

   tabAssetsBtn: document.getElementById('tab-assets-btn'),
   tabSettingsBtn: document.getElementById('tab-settings-btn'),
   contentAssets: document.getElementById('content-assets'),
   contentSettings: document.getElementById('content-settings'),

   roadSettings: document.getElementById('road-settings'),
   nodeSettings: document.getElementById('node-settings'),
   emptySettingsMsg: document.getElementById('settings-empty-msg'),
   propertiesContent: document.getElementById('properties-content'),

   roadType: document.getElementById('road-type'),
   roadColor: document.getElementById('road-color'),
   nodeColor: document.getElementById('node-color'),
   nodeIcon: document.getElementById('node-icon')
  };
}

export const state = {
  currentMode: 'pointer',
  theme: 'light',
  roadStartNode: null,
  selectedRoad: null,
  selectedNode: null,
  draggedNode: null,
  dragOffset: { x: 0, y: 0 },
  ghostNode: null
};