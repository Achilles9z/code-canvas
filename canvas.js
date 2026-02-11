// ========== STATE ==========
let files = [];
const roofColors = ['red', 'yellow', 'orange'];

// ========== PAGE NAVIGATION ==========
document.addEventListener('DOMContentLoaded', () => {
  // Benzene button → opens canvas
  document.getElementById('enter-canvas-btn')?.addEventListener('click', () => {
    document.getElementById('benzene-page').classList.add('hidden');
    document.getElementById('canvas-page').classList.remove('hidden');
    
    // Load existing files
    chrome.storage.local.get(['files'], (result) => {
      if (result.files) files = result.files;
      renderFiles();
    });
  });

  // Add tab button - ALWAYS VISIBLE
  document.getElementById('add-tab-btn')?.addEventListener('click', addNewTab);
  
  // Load initial state
  chrome.storage.local.get(['files'], (result) => {
    if (result.files) files = result.files;
  });
});

// ========== ADD NEW TAB ==========
function addNewTab() {
  const colorIndex = files.length % roofColors.length;
  
  files.push({
    id: Date.now(),
    title: 'untitled code',
    content: '',
    roofColor: roofColors[colorIndex],
    x: 50 + (files.length * 40),
    y: 50 + (files.length * 40),
    width: 320,
    height: 240
  });
  
  saveFiles();
  renderFiles();
}

// ========== RENDER ALL TABS ==========
function renderFiles() {
  const canvas = document.getElementById('canvas');
  if (!canvas) return;
  
  canvas.innerHTML = '';
  files.forEach(file => canvas.appendChild(createCodeWindow(file)));
  
  // Button ALWAYS visible
  const addButton = document.getElementById('add-tab-btn');
  if (addButton) {
    addButton.style.display = 'flex';
  }
}

// ========== CREATE SINGLE CODE WINDOW ==========
function createCodeWindow(file) {
  const div = document.createElement('div');
  div.className = 'code-window';
  div.style.cssText = `
    left: ${file.x || 50}px;
    top: ${file.y || 50}px;
    width: ${file.width || 320}px;
    height: ${file.height || 240}px;
  `;
  div.id = 'window-' + file.id;

  // Header with colored roof
  const header = document.createElement('div');
  header.className = `window-header ${file.roofColor || 'red'}`;
  
  // ===== TITLE WITH RENAME FEATURE =====
  const titleSpan = document.createElement('span');
  titleSpan.className = 'window-title';
  titleSpan.textContent = file.title || 'untitled code';
  
  // Double click to rename
  titleSpan.title = 'Double click to rename';
  titleSpan.style.cursor = 'pointer';
  
  titleSpan.ondblclick = (e) => {
    e.stopPropagation();
    
    const input = document.createElement('input');
    input.type = 'text';
    input.value = file.title || 'untitled code';
    input.className = 'rename-input';
    input.style.width = '150px';
    input.style.background = '#2d2d2d';
    input.style.color = 'white';
    input.style.border = '1px solid #007acc';
    input.style.borderRadius = '4px';
    input.style.padding = '4px 8px';
    input.style.fontSize = '12px';
    input.style.fontFamily = 'Courier New, monospace';
    
    titleSpan.replaceWith(input);
    input.focus();
    input.select();
    
    const saveRename = () => {
      const newTitle = input.value.trim() || 'untitled code';
      file.title = newTitle;
      titleSpan.textContent = newTitle;
      input.replaceWith(titleSpan);
      saveFiles();
    };
    
    input.onblur = saveRename;
    input.onkeydown = (e) => {
      if (e.key === 'Enter') {
        saveRename();
      }
      if (e.key === 'Escape') {
        input.replaceWith(titleSpan);
      }
    };
  };
  
  const controlsDiv = document.createElement('div');
  controlsDiv.className = 'window-controls';
  
  const closeBtn = document.createElement('button');
  closeBtn.className = 'close-btn';
  closeBtn.textContent = '×';
  closeBtn.setAttribute('aria-label', 'Close');
  
  controlsDiv.appendChild(closeBtn);
  header.appendChild(titleSpan);
  header.appendChild(controlsDiv);
  
  // Text area
  const textarea = document.createElement('textarea');
  textarea.placeholder = 'Write your code here...';
  textarea.value = file.content || '';
  textarea.oninput = (e) => {
    file.content = e.target.value;
    saveFiles();
  };

  // ===== DRAG FUNCTIONALITY =====
  let isDragging = false;
  let startX, startY, startLeft, startTop;

  header.onmousedown = (e) => {
    // Don't start drag if clicking on input or button
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
    
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startLeft = parseInt(div.style.left) || 50;
    startTop = parseInt(div.style.top) || 50;
    e.preventDefault();
  };

  document.onmousemove = (e) => {
    if (!isDragging) return;
    
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    
    div.style.left = Math.max(0, startLeft + dx) + 'px';
    div.style.top = Math.max(0, startTop + dy) + 'px';
    
    file.x = parseInt(div.style.left);
    file.y = parseInt(div.style.top);
  };

  document.onmouseup = () => {
    if (isDragging) {
      isDragging = false;
      saveFiles();
    }
  };

  // ===== CLOSE BUTTON =====
  closeBtn.onclick = (e) => {
    e.stopPropagation();
    files = files.filter(f => f.id !== file.id);
    saveFiles();
    renderFiles();
  };

  div.appendChild(header);
  div.appendChild(textarea);
  return div;
}

// ========== SAVE TO CHROME STORAGE ==========
function saveFiles() {
  chrome.storage.local.set({ files });
}