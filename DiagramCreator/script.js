class DiagramCreator {
    constructor() {
        this.canvas = document.getElementById('diagram-canvas');
        this.canvasContainer = document.getElementById('canvas-container');
        this.placeholder = document.getElementById('canvas-placeholder');
        this.propertiesPanel = document.getElementById('properties-panel');
        
        this.elements = [];
        this.selectedElement = null;
        this.draggedElement = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.elementCounter = 0;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupToolbar();
        this.setupCanvas();
    }
    
    setupEventListeners() {
        // Tool items
        document.querySelectorAll('.tool-item').forEach(item => {
            item.addEventListener('dragstart', this.handleToolDragStart.bind(this));
            item.addEventListener('click', this.handleToolClick.bind(this));
        });
        
        // Canvas events
        this.canvas.addEventListener('drop', this.handleCanvasDrop.bind(this));
        this.canvas.addEventListener('dragover', this.handleCanvasDragOver.bind(this));
        this.canvas.addEventListener('click', this.handleCanvasClick.bind(this));
        
        // Controls
        document.getElementById('clear-canvas').addEventListener('click', this.clearCanvas.bind(this));
        
        // Canvas zoom and pan
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
        this.canvas.addEventListener('mousedown', this.handleCanvasMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleCanvasMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleCanvasMouseUp.bind(this));
        
        // Properties panel
        document.getElementById('close-properties').addEventListener('click', this.closeProperties.bind(this));
        document.getElementById('element-text').addEventListener('input', this.updateElementText.bind(this));
        document.getElementById('element-color').addEventListener('change', this.updateElementColor.bind(this));
        document.getElementById('element-size').addEventListener('input', this.updateElementSize.bind(this));
        document.getElementById('element-rotation').addEventListener('input', this.updateElementRotation.bind(this));
        document.getElementById('element-width').addEventListener('input', this.updateElementWidth.bind(this));
        document.getElementById('element-height').addEventListener('input', this.updateElementHeight.bind(this));
        document.getElementById('delete-element').addEventListener('click', this.deleteElement.bind(this));
        
        // Export/Import
        document.getElementById('export-btn').addEventListener('click', this.exportDiagram.bind(this));
        document.getElementById('import-btn').addEventListener('click', () => document.getElementById('import-file').click());
        document.getElementById('import-file').addEventListener('change', this.importDiagram.bind(this));
        document.getElementById('export-image-btn').addEventListener('click', this.exportImage.bind(this));
    }
    
    setupToolbar() {
        document.querySelectorAll('.tool-item').forEach(item => {
            item.draggable = true;
        });
    }
    
    setupCanvas() {
        this.updateCanvasSize();
        window.addEventListener('resize', this.updateCanvasSize.bind(this));
    }
    
    updateCanvasSize() {
        const rect = this.canvasContainer.getBoundingClientRect();
        this.canvas.setAttribute('width', rect.width);
        this.canvas.setAttribute('height', rect.height);
    }
    
    handleToolDragStart(e) {
        const shapeType = e.target.closest('.tool-item').dataset.shape;
        e.dataTransfer.setData('text/plain', shapeType);
    }
    
    handleToolClick(e) {
        const shapeType = e.target.closest('.tool-item').dataset.shape;
        this.createElementAtCenter(shapeType);
    }
    
    handleCanvasDragOver(e) {
        e.preventDefault();
    }
    
    handleCanvasDrop(e) {
        e.preventDefault();
        const shapeType = e.dataTransfer.getData('text/plain');
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.createElement(shapeType, x, y);
    }
    
    handleCanvasClick(e) {
        const clickedElement = e.target.closest('[data-element-id]');
        if (clickedElement) {
            this.selectElement(clickedElement.dataset.elementId);
        } else {
            this.deselectElement();
        }
    }
    
    createElement(type, x, y) {
        const id = `element-${++this.elementCounter}`;
        const element = {
            id,
            type,
            x,
            y,
            text: this.getDefaultText(type),
            color: '#56ffc5',
            size: 60,
            width: 90,
            height: 60,
            rotation: 0
        };
        
        this.elements.push(element);
        this.renderElement(element);
        this.hidePlaceholder();
    }
    
    createElementAtCenter(type) {
        const rect = this.canvas.getBoundingClientRect();
        const x = rect.width / 2;
        const y = rect.height / 2;
        this.createElement(type, x, y);
    }
    
    getDefaultText(type) {
        const defaults = {
            rectangle: 'Rectangle',
            circle: 'Circle',
            diamond: 'Decision',
            triangle: 'Triangle',
            button: 'Button',
            input: 'Input Field',
            text: 'Text Label',
            image: 'Image',
            container: 'Container',
            header: 'Header',
            sidebar: 'Sidebar',
            footer: 'Footer',
            card: 'Card',
            modal: 'Modal',
            navbar: 'Navigation',
            grid: 'Grid Layout',
            arrow: '',
            line: ''
        };
        return defaults[type] || 'Element';
    }
    
    renderElement(element) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('data-element-id', element.id);
        group.setAttribute('transform', `translate(${element.x}, ${element.y}) rotate(${element.rotation || 0})`);
        group.style.cursor = 'move';
        
        const shape = this.createShape(element);
        group.appendChild(shape);
        
        if (element.text && element.type !== 'arrow' && element.type !== 'line') {
            const text = this.createText(element);
            group.appendChild(text);
        }
        
        this.setupElementEvents(group, element);
        
        // Add to main group or canvas
        const mainGroup = this.canvas.querySelector('#main-group');
        if (mainGroup) {
            mainGroup.appendChild(group);
        } else {
            this.canvas.appendChild(group);
        }
    }
    
    createShape(element) {
        const size = this.getSizeValue(element.size);
        const width = element.width || 90;
        const height = element.height || 60;
        
        switch (element.type) {
            case 'rectangle':
                return this.createRectangle(width, height, element.color);
            case 'circle':
                return this.createCircle(size, element.color);
            case 'diamond':
                return this.createDiamond(size, element.color);
            case 'triangle':
                return this.createTriangle(size, element.color);
            case 'button':
                return this.createButton(width, height, element.color);
            case 'input':
                return this.createInput(width, height, element.color);
            case 'text':
                return this.createTextBox(width, height, element.color);
            case 'image':
                return this.createImageBox(width, height, element.color);
            case 'container':
                return this.createContainer(width, height, element.color);
            case 'header':
                return this.createHeader(width, height, element.color);
            case 'sidebar':
                return this.createSidebar(width, height, element.color);
            case 'footer':
                return this.createFooter(width, height, element.color);
            case 'card':
                return this.createCard(width, height, element.color);
            case 'modal':
                return this.createModal(width, height, element.color);
            case 'navbar':
                return this.createNavbar(width, height, element.color);
            case 'grid':
                return this.createGrid(width, height, element.color);
            case 'arrow':
                return this.createArrow(size, element.color);
            case 'line':
                return this.createLine(size, element.color);
            default:
                return this.createRectangle(width, height, element.color);
        }
    }
    
    getSizeValue(size) {
        return typeof size === 'number' ? size : 60;
    }
    
    getContrastTextColor(backgroundColor) {
        // Convert hex to RGB
        const hex = backgroundColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // Calculate luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        // Return black for light colors, white for dark colors
        return luminance > 0.5 ? '#0a1628' : '#e0e0e0';
    }
    
    isFilledShape(type) {
        return ['button', 'header', 'footer', 'navbar'].includes(type);
    }
    
    handleWheel(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.1, Math.min(3, this.zoom * zoomFactor));
        
        // Zoom towards mouse position
        this.panX = mouseX - (mouseX - this.panX) * (newZoom / this.zoom);
        this.panY = mouseY - (mouseY - this.panY) * (newZoom / this.zoom);
        this.zoom = newZoom;
        
        this.updateCanvasTransform();
    }
    
    handleCanvasMouseDown(e) {
        // Check if clicking on empty canvas (not on an element)
        if (!e.target.closest('[data-element-id]') && e.button === 0) {
            e.preventDefault();
            this.isPanning = true;
            this.lastPanX = e.clientX;
            this.lastPanY = e.clientY;
            this.canvas.style.cursor = 'grabbing';
        }
    }
    
    handleCanvasMouseMove(e) {
        if (this.isPanning) {
            const deltaX = e.clientX - this.lastPanX;
            const deltaY = e.clientY - this.lastPanY;
            this.panX += deltaX;
            this.panY += deltaY;
            this.lastPanX = e.clientX;
            this.lastPanY = e.clientY;
            this.updateCanvasTransform();
        }
    }
    
    handleCanvasMouseUp(e) {
        this.isPanning = false;
        this.canvas.style.cursor = 'default';
    }
    
    updateCanvasTransform() {
        const g = this.canvas.querySelector('#main-group') || this.createMainGroup();
        g.setAttribute('transform', `translate(${this.panX}, ${this.panY}) scale(${this.zoom})`);
    }
    
    createMainGroup() {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.id = 'main-group';
        
        // Move all existing elements to the group
        const elements = Array.from(this.canvas.querySelectorAll('[data-element-id]'));
        elements.forEach(el => g.appendChild(el));
        
        this.canvas.appendChild(g);
        return g;
    }
    
    createRectangle(width, height, color) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', width);
        rect.setAttribute('height', height);
        rect.setAttribute('x', -width * 0.5);
        rect.setAttribute('y', -height * 0.5);
        rect.setAttribute('fill', 'none');
        rect.setAttribute('stroke', color);
        rect.setAttribute('stroke-width', '2');
        rect.setAttribute('rx', '4');
        return rect;
    }
    
    createCircle(size, color) {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('r', size * 0.5);
        circle.setAttribute('fill', 'none');
        circle.setAttribute('stroke', color);
        circle.setAttribute('stroke-width', '2');
        return circle;
    }
    
    createDiamond(size, color) {
        const diamond = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const points = `0,-${size * 0.5} ${size * 0.5},0 0,${size * 0.5} -${size * 0.5},0`;
        diamond.setAttribute('points', points);
        diamond.setAttribute('fill', 'none');
        diamond.setAttribute('stroke', color);
        diamond.setAttribute('stroke-width', '2');
        return diamond;
    }
    
    createTriangle(size, color) {
        const triangle = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const points = `0,-${size * 0.5} ${size * 0.5},${size * 0.5} -${size * 0.5},${size * 0.5}`;
        triangle.setAttribute('points', points);
        triangle.setAttribute('fill', 'none');
        triangle.setAttribute('stroke', color);
        triangle.setAttribute('stroke-width', '2');
        return triangle;
    }
    
    createButton(width, height, color) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', width);
        rect.setAttribute('height', height);
        rect.setAttribute('x', -width * 0.5);
        rect.setAttribute('y', -height * 0.5);
        rect.setAttribute('fill', color);
        rect.setAttribute('stroke', color);
        rect.setAttribute('stroke-width', '2');
        rect.setAttribute('rx', '8');
        return rect;
    }
    
    createInput(width, height, color) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', width);
        rect.setAttribute('height', height);
        rect.setAttribute('x', -width * 0.5);
        rect.setAttribute('y', -height * 0.5);
        rect.setAttribute('fill', 'none');
        rect.setAttribute('stroke', color);
        rect.setAttribute('stroke-width', '2');
        rect.setAttribute('rx', '4');
        return rect;
    }
    
    createTextBox(width, height, color) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', width);
        rect.setAttribute('height', height);
        rect.setAttribute('x', -width * 0.5);
        rect.setAttribute('y', -height * 0.5);
        rect.setAttribute('fill', 'none');
        rect.setAttribute('stroke', 'none');
        return rect;
    }
    
    createImageBox(width, height, color) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', width);
        rect.setAttribute('height', height);
        rect.setAttribute('x', -width * 0.5);
        rect.setAttribute('y', -height * 0.5);
        rect.setAttribute('fill', 'none');
        rect.setAttribute('stroke', color);
        rect.setAttribute('stroke-width', '2');
        rect.setAttribute('stroke-dasharray', '5,5');
        return rect;
    }
    
    createArrow(size, color) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', -size * 0.5);
        line.setAttribute('y1', 0);
        line.setAttribute('x2', size * 0.5);
        line.setAttribute('y2', 0);
        line.setAttribute('stroke', color);
        line.setAttribute('stroke-width', '2');
        line.setAttribute('marker-end', 'url(#arrowhead)');
        return line;
    }
    
    createLine(size, color) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', -size * 0.5);
        line.setAttribute('y1', 0);
        line.setAttribute('x2', size * 0.5);
        line.setAttribute('y2', 0);
        line.setAttribute('stroke', color);
        line.setAttribute('stroke-width', '2');
        return line;
    }
    
    createContainer(width, height, color) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', width);
        rect.setAttribute('height', height);
        rect.setAttribute('x', -width * 0.5);
        rect.setAttribute('y', -height * 0.5);
        rect.setAttribute('fill', 'none');
        rect.setAttribute('stroke', color);
        rect.setAttribute('stroke-width', '2');
        rect.setAttribute('stroke-dasharray', '8,4');
        rect.setAttribute('rx', '8');
        return rect;
    }
    
    createHeader(width, height, color) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', width);
        rect.setAttribute('height', height);
        rect.setAttribute('x', -width * 0.5);
        rect.setAttribute('y', -height * 0.5);
        rect.setAttribute('fill', color);
        rect.setAttribute('stroke', color);
        rect.setAttribute('stroke-width', '2');
        rect.setAttribute('rx', '4');
        return rect;
    }
    
    createSidebar(width, height, color) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', width);
        rect.setAttribute('height', height);
        rect.setAttribute('x', -width * 0.5);
        rect.setAttribute('y', -height * 0.5);
        rect.setAttribute('fill', 'none');
        rect.setAttribute('stroke', color);
        rect.setAttribute('stroke-width', '2');
        rect.setAttribute('rx', '4');
        return rect;
    }
    
    createFooter(width, height, color) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', width);
        rect.setAttribute('height', height);
        rect.setAttribute('x', -width * 0.5);
        rect.setAttribute('y', -height * 0.5);
        rect.setAttribute('fill', color);
        rect.setAttribute('stroke', color);
        rect.setAttribute('stroke-width', '2');
        rect.setAttribute('rx', '4');
        return rect;
    }
    
    createCard(width, height, color) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Card background
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', width);
        rect.setAttribute('height', height);
        rect.setAttribute('x', -width * 0.5);
        rect.setAttribute('y', -height * 0.5);
        rect.setAttribute('fill', 'rgba(86, 255, 197, 0.1)');
        rect.setAttribute('stroke', color);
        rect.setAttribute('stroke-width', '2');
        rect.setAttribute('rx', '8');
        g.appendChild(rect);
        
        // Card header
        const header = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        header.setAttribute('width', width * 0.9);
        header.setAttribute('height', height * 0.2);
        header.setAttribute('x', -width * 0.45);
        header.setAttribute('y', -height * 0.4);
        header.setAttribute('fill', color);
        header.setAttribute('rx', '2');
        g.appendChild(header);
        
        return g;
    }
    
    createModal(width, height, color) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Modal backdrop
        const backdrop = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        backdrop.setAttribute('width', width * 1.2);
        backdrop.setAttribute('height', height * 1.2);
        backdrop.setAttribute('x', -width * 0.6);
        backdrop.setAttribute('y', -height * 0.6);
        backdrop.setAttribute('fill', 'rgba(0, 0, 0, 0.3)');
        backdrop.setAttribute('rx', '4');
        g.appendChild(backdrop);
        
        // Modal content
        const modal = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        modal.setAttribute('width', width);
        modal.setAttribute('height', height);
        modal.setAttribute('x', -width * 0.5);
        modal.setAttribute('y', -height * 0.5);
        modal.setAttribute('fill', 'rgba(86, 255, 197, 0.2)');
        modal.setAttribute('stroke', color);
        modal.setAttribute('stroke-width', '2');
        modal.setAttribute('rx', '8');
        g.appendChild(modal);
        
        return g;
    }
    
    createNavbar(width, height, color) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Navbar background
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', width);
        rect.setAttribute('height', height);
        rect.setAttribute('x', -width * 0.5);
        rect.setAttribute('y', -height * 0.5);
        rect.setAttribute('fill', color);
        rect.setAttribute('stroke', color);
        rect.setAttribute('stroke-width', '2');
        rect.setAttribute('rx', '4');
        g.appendChild(rect);
        
        // Menu items
        const itemWidth = width * 0.15;
        const itemHeight = height * 0.4;
        const spacing = width * 0.25;
        for (let i = 0; i < 3; i++) {
            const item = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            item.setAttribute('width', itemWidth);
            item.setAttribute('height', itemHeight);
            item.setAttribute('x', -width * 0.4 + i * spacing);
            item.setAttribute('y', -itemHeight * 0.5);
            item.setAttribute('fill', 'rgba(10, 22, 40, 0.8)');
            item.setAttribute('rx', '2');
            g.appendChild(item);
        }
        
        return g;
    }
    
    createGrid(width, height, color) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Grid container
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', width);
        rect.setAttribute('height', height);
        rect.setAttribute('x', -width * 0.5);
        rect.setAttribute('y', -height * 0.5);
        rect.setAttribute('fill', 'none');
        rect.setAttribute('stroke', color);
        rect.setAttribute('stroke-width', '2');
        rect.setAttribute('rx', '4');
        g.appendChild(rect);
        
        // Grid lines
        const cellWidth = width / 3;
        const cellHeight = height / 3;
        for (let i = 1; i < 3; i++) {
            // Vertical lines
            const vLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            vLine.setAttribute('x1', -width * 0.5 + i * cellWidth);
            vLine.setAttribute('y1', -height * 0.5);
            vLine.setAttribute('x2', -width * 0.5 + i * cellWidth);
            vLine.setAttribute('y2', height * 0.5);
            vLine.setAttribute('stroke', color);
            vLine.setAttribute('stroke-width', '1');
            vLine.setAttribute('opacity', '0.5');
            g.appendChild(vLine);
            
            // Horizontal lines
            const hLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            hLine.setAttribute('x1', -width * 0.5);
            hLine.setAttribute('y1', -height * 0.5 + i * cellHeight);
            hLine.setAttribute('x2', width * 0.5);
            hLine.setAttribute('y2', -height * 0.5 + i * cellHeight);
            hLine.setAttribute('stroke', color);
            hLine.setAttribute('stroke-width', '1');
            hLine.setAttribute('opacity', '0.5');
            g.appendChild(hLine);
        }
        
        return g;
    }
    
    createText(element) {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        
        // Use contrast color for filled shapes, element color for others
        const textColor = this.isFilledShape(element.type) 
            ? this.getContrastTextColor(element.color)
            : element.color;
        
        text.setAttribute('fill', textColor);
        text.setAttribute('font-family', 'Poppins, sans-serif');
        text.setAttribute('font-size', '12');
        text.setAttribute('font-weight', '500');
        text.textContent = element.text;
        return text;
    }
    
    setupElementEvents(group, element) {
        group.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            this.startDrag(e, element);
        });
        
        group.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.selectElement(element.id);
            document.getElementById('element-text').focus();
        });
    }
    
    startDrag(e, element) {
        this.isDragging = true;
        this.draggedElement = element;
        const rect = this.canvas.getBoundingClientRect();
        this.dragOffset.x = e.clientX - rect.left - element.x;
        this.dragOffset.y = e.clientY - rect.top - element.y;
        
        document.addEventListener('mousemove', this.handleDrag.bind(this));
        document.addEventListener('mouseup', this.stopDrag.bind(this));
    }
    
    handleDrag(e) {
        if (!this.isDragging || !this.draggedElement) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const newX = e.clientX - rect.left - this.dragOffset.x;
        const newY = e.clientY - rect.top - this.dragOffset.y;
        
        this.draggedElement.x = newX;
        this.draggedElement.y = newY;
        
        this.updateElementPosition(this.draggedElement);
    }
    
    stopDrag() {
        this.isDragging = false;
        this.draggedElement = null;
        document.removeEventListener('mousemove', this.handleDrag.bind(this));
        document.removeEventListener('mouseup', this.stopDrag.bind(this));
    }
    
    updateElementPosition(element) {
        const group = this.canvas.querySelector(`[data-element-id="${element.id}"]`);
        if (group) {
            group.setAttribute('transform', `translate(${element.x}, ${element.y}) rotate(${element.rotation || 0})`);
        }
    }
    
    selectElement(elementId) {
        this.selectedElement = this.elements.find(el => el.id === elementId);
        if (this.selectedElement) {
            this.showProperties();
            this.updatePropertiesPanel();
        }
    }
    
    deselectElement() {
        this.selectedElement = null;
        this.hideProperties();
    }
    
    showProperties() {
        this.propertiesPanel.classList.add('active');
    }
    
    hideProperties() {
        this.propertiesPanel.classList.remove('active');
    }
    
    closeProperties() {
        this.deselectElement();
    }
    
    updatePropertiesPanel() {
        if (!this.selectedElement) return;
        
        document.getElementById('element-text').value = this.selectedElement.text;
        document.getElementById('element-color').value = this.selectedElement.color;
        document.getElementById('element-size').value = this.selectedElement.size;
        document.getElementById('element-rotation').value = this.selectedElement.rotation || 0;
        document.getElementById('size-value').textContent = `${this.selectedElement.size}px`;
        document.getElementById('rotation-value').textContent = `${this.selectedElement.rotation || 0}°`;
        
        // Show/hide dimension controls based on shape type
        const showDimensions = this.supportsDimensions(this.selectedElement.type);
        document.getElementById('dimensions-group').style.display = showDimensions ? 'block' : 'none';
        document.getElementById('height-group').style.display = showDimensions ? 'block' : 'none';
        
        if (showDimensions) {
            document.getElementById('element-width').value = this.selectedElement.width || 90;
            document.getElementById('element-height').value = this.selectedElement.height || 60;
            document.getElementById('width-value').textContent = `${this.selectedElement.width || 90}px`;
            document.getElementById('height-value').textContent = `${this.selectedElement.height || 60}px`;
        }
    }
    
    supportsDimensions(type) {
        return ['rectangle', 'button', 'input', 'text', 'image', 'container', 'header', 'sidebar', 'footer', 'card', 'modal', 'navbar', 'grid'].includes(type);
    }
    
    updateElementText(e) {
        if (!this.selectedElement) return;
        
        this.selectedElement.text = e.target.value;
        this.rerenderElement(this.selectedElement);
    }
    
    updateElementColor(e) {
        if (!this.selectedElement) return;
        
        this.selectedElement.color = e.target.value;
        this.rerenderElement(this.selectedElement);
    }
    
    updateElementSize(e) {
        if (!this.selectedElement) return;
        
        this.selectedElement.size = parseInt(e.target.value);
        document.getElementById('size-value').textContent = `${this.selectedElement.size}px`;
        this.rerenderElement(this.selectedElement);
    }
    
    updateElementRotation(e) {
        if (!this.selectedElement) return;
        
        this.selectedElement.rotation = parseInt(e.target.value);
        document.getElementById('rotation-value').textContent = `${this.selectedElement.rotation}°`;
        this.rerenderElement(this.selectedElement);
    }
    
    updateElementWidth(e) {
        if (!this.selectedElement) return;
        
        this.selectedElement.width = parseInt(e.target.value);
        document.getElementById('width-value').textContent = `${this.selectedElement.width}px`;
        this.rerenderElement(this.selectedElement);
    }
    
    updateElementHeight(e) {
        if (!this.selectedElement) return;
        
        this.selectedElement.height = parseInt(e.target.value);
        document.getElementById('height-value').textContent = `${this.selectedElement.height}px`;
        this.rerenderElement(this.selectedElement);
    }
    
    rerenderElement(element) {
        const oldGroup = this.canvas.querySelector(`[data-element-id="${element.id}"]`);
        if (oldGroup) {
            oldGroup.remove();
        }
        this.renderElement(element);
    }
    
    deleteElement() {
        if (!this.selectedElement) return;
        
        const elementIndex = this.elements.findIndex(el => el.id === this.selectedElement.id);
        if (elementIndex > -1) {
            this.elements.splice(elementIndex, 1);
        }
        
        const group = this.canvas.querySelector(`[data-element-id="${this.selectedElement.id}"]`);
        if (group) {
            group.remove();
        }
        
        this.deselectElement();
        
        if (this.elements.length === 0) {
            this.showPlaceholder();
        }
    }
    
    clearCanvas() {
        this.elements = [];
        this.selectedElement = null;
        this.canvas.querySelectorAll('[data-element-id]').forEach(el => el.remove());
        this.hideProperties();
        this.showPlaceholder();
    }
    
    hidePlaceholder() {
        this.placeholder.style.display = 'none';
    }
    
    showPlaceholder() {
        this.placeholder.style.display = 'flex';
    }
    
    exportDiagram() {
        const data = {
            elements: this.elements,
            version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'diagram.json';
        a.click();
        URL.revokeObjectURL(url);
    }
    
    importDiagram(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                this.clearCanvas();
                this.elements = data.elements || [];
                this.elements.forEach(element => this.renderElement(element));
                if (this.elements.length > 0) {
                    this.hidePlaceholder();
                }
            } catch (error) {
                alert('Error importing diagram: Invalid file format');
            }
        };
        reader.readAsText(file);
    }
    
    exportImage() {
        if (this.elements.length === 0) {
            alert('No elements to export');
            return;
        }
        
        // Calculate bounds of all elements
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        this.elements.forEach(element => {
            const size = this.getSizeValue(element.size);
            const padding = size;
            
            minX = Math.min(minX, element.x - padding);
            minY = Math.min(minY, element.y - padding);
            maxX = Math.max(maxX, element.x + padding);
            maxY = Math.max(maxY, element.y + padding);
        });
        
        const width = maxX - minX + 40; // Add some padding
        const height = maxY - minY + 40;
        
        // Create a new SVG with just the elements
        const exportSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        exportSvg.setAttribute('width', width);
        exportSvg.setAttribute('height', height);
        exportSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        
        // Add background
        const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bg.setAttribute('width', '100%');
        bg.setAttribute('height', '100%');
        bg.setAttribute('fill', '#0a1628');
        exportSvg.appendChild(bg);
        
        // Add defs for markers
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', 'arrowhead');
        marker.setAttribute('markerWidth', '10');
        marker.setAttribute('markerHeight', '7');
        marker.setAttribute('refX', '9');
        marker.setAttribute('refY', '3.5');
        marker.setAttribute('orient', 'auto');
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
        polygon.setAttribute('fill', '#56ffc5');
        marker.appendChild(polygon);
        defs.appendChild(marker);
        exportSvg.appendChild(defs);
        
        // Clone and adjust elements
        this.elements.forEach(element => {
            const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            const adjustedX = element.x - minX + 20;
            const adjustedY = element.y - minY + 20;
            group.setAttribute('transform', `translate(${adjustedX}, ${adjustedY}) rotate(${element.rotation || 0})`);
            
            const shape = this.createShape(element);
            group.appendChild(shape);
            
            if (element.text && element.type !== 'arrow' && element.type !== 'line') {
                const text = this.createText(element);
                group.appendChild(text);
            }
            
            exportSvg.appendChild(group);
        });
        
        // Convert to image
        const svgData = new XMLSerializer().serializeToString(exportSvg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        canvas.width = width;
        canvas.height = height;
        
        img.onload = () => {
            ctx.drawImage(img, 0, 0);
            
            const link = document.createElement('a');
            link.download = 'diagram.png';
            link.href = canvas.toDataURL();
            link.click();
        };
        
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        img.src = url;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new DiagramCreator();
});