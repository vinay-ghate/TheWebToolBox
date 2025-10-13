document.addEventListener('DOMContentLoaded', () => {
    // DOM Element References
    const mermaidCodeTextarea = document.getElementById('mermaid-code');
    const diagramTypeSelect = document.getElementById('diagram-type');
    const insertTemplateBtn = document.getElementById('insert-template');
    const renderBtn = document.getElementById('render-btn');
    const clearBtn = document.getElementById('clear-btn');
    const importBtn = document.getElementById('import-btn');
    const importFile = document.getElementById('import-file');
    const exportCodeBtn = document.getElementById('export-code-btn');
    const exportSvgBtn = document.getElementById('export-svg-btn');
    const exportPngBtn = document.getElementById('export-png-btn');
    const diagramContainer = document.getElementById('diagram-container');
    const diagramPlaceholder = document.getElementById('diagram-placeholder');
    const errorPanel = document.getElementById('error-panel');
    const errorMessage = document.getElementById('error-message');
    const zoomInBtn = document.getElementById('zoom-in');
    const zoomOutBtn = document.getElementById('zoom-out');
    const zoomResetBtn = document.getElementById('zoom-reset');

    let currentZoom = 1;
    let diagramCounter = 0;

    // Diagram Templates
    const templates = {
        flowchart: `flowchart TD
    A[Start] --> B{Decision?}
    B -->|Yes| C[Process A]
    B -->|No| D[Process B]
    C --> E[End]
    D --> E`,

        sequence: `sequenceDiagram
    participant A as Alice
    participant B as Bob
    A->>B: Hello Bob, how are you?
    B-->>A: Great!
    A-)B: See you later!`,

        class: `classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    class Dog {
        +String breed
        +bark()
    }
    Animal <|-- Dog`,

        state: `stateDiagram-v2
    [*] --> Still
    Still --> [*]
    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]`,

        er: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses
    
    CUSTOMER {
        string name
        string custNumber
        string sector
    }
    ORDER {
        int orderNumber
        string deliveryAddress
    }`,

        gantt: `gantt
    title A Gantt Diagram
    dateFormat  YYYY-MM-DD
    section Section
    A task           :a1, 2014-01-01, 30d
    Another task     :after a1  , 20d
    section Another
    Task in sec      :2014-01-12  , 12d
    another task      : 24d`,

        pie: `pie title Pets adopted by volunteers
    "Dogs" : 386
    "Cats" : 85
    "Rats" : 15`,

        journey: `journey
    title My working day
    section Go to work
      Make tea: 5: Me
      Go upstairs: 3: Me
      Do work: 1: Me, Cat
    section Go home
      Go downstairs: 5: Me
      Sit down: 5: Me`
    };

    /**
     * Show error message
     */
    const showError = (message) => {
        errorMessage.textContent = message;
        errorPanel.classList.add('show');
        setTimeout(() => {
            errorPanel.classList.remove('show');
        }, 5000);
    };

    /**
     * Hide error message
     */
    const hideError = () => {
        errorPanel.classList.remove('show');
    };

    /**
     * Generate unique diagram ID
     */
    const generateDiagramId = () => {
        diagramCounter++;
        return `mermaid-diagram-${diagramCounter}`;
    };

    /**
     * Render mermaid diagram
     */
    const renderDiagram = async () => {
        const code = mermaidCodeTextarea.value.trim();

        if (!code) {
            showError('Please enter mermaid diagram code');
            return;
        }

        hideError();
        diagramContainer.classList.add('loading');

        try {
            // Clear previous diagram
            diagramContainer.innerHTML = '';

            // Create wrapper for better scrolling
            const diagramWrapper = document.createElement('div');
            diagramWrapper.className = 'diagram-wrapper';

            // Generate new diagram ID
            const newDiagramId = generateDiagramId();

            // Create container for the diagram
            const diagramDiv = document.createElement('div');
            diagramDiv.id = newDiagramId;
            diagramDiv.className = 'mermaid';
            diagramDiv.textContent = code;
            
            diagramWrapper.appendChild(diagramDiv);
            diagramContainer.appendChild(diagramWrapper);

            // Render the diagram
            await window.mermaid.run({
                nodes: [diagramDiv]
            });

            // Setup scrollable area for large diagrams
            setupScrollableArea();

            // Reset zoom
            currentZoom = 1;
            const mermaidDiv = diagramContainer.querySelector('.mermaid');
            if (mermaidDiv) {
                mermaidDiv.style.transform = `scale(${currentZoom})`;
                mermaidDiv.style.transformOrigin = 'center center';
            }

        } catch (error) {
            console.error('Mermaid rendering error:', error);
            diagramContainer.innerHTML = '';
            diagramContainer.appendChild(diagramPlaceholder);
            showError(`Diagram rendering failed: ${error.message || 'Invalid syntax'}`);
        } finally {
            diagramContainer.classList.remove('loading');
        }
    };

    /**
     * Insert template based on selected diagram type
     */
    const insertTemplate = () => {
        const selectedType = diagramTypeSelect.value;
        const template = templates[selectedType];

        if (template) {
            mermaidCodeTextarea.value = template;
            mermaidCodeTextarea.focus();
        }
    };

    /**
     * Setup scrollable area for large diagrams
     */
    const setupScrollableArea = () => {
        const mermaidDiv = diagramContainer.querySelector('.mermaid');
        const svgElement = mermaidDiv?.querySelector('svg');
        
        if (svgElement) {
            // Get SVG dimensions
            const bbox = svgElement.getBBox();
            const svgWidth = bbox.width;
            const svgHeight = bbox.height;
            
            // Add generous padding around the diagram for scrolling (3-4x the diagram size)
            const scrollPadding = Math.max(svgWidth * 2, svgHeight * 2, 800);
            
            // Set wrapper dimensions to create scrollable area
            const wrapper = diagramContainer.querySelector('.diagram-wrapper');
            if (wrapper) {
                wrapper.style.width = `${svgWidth + scrollPadding}px`;
                wrapper.style.height = `${svgHeight + scrollPadding}px`;
            }
            
            // Center the view on the diagram
            setTimeout(() => {
                const containerRect = diagramContainer.getBoundingClientRect();
                const scrollLeft = (svgWidth + scrollPadding - containerRect.width) / 2;
                const scrollTop = (svgHeight + scrollPadding - containerRect.height) / 2;
                diagramContainer.scrollLeft = Math.max(0, scrollLeft);
                diagramContainer.scrollTop = Math.max(0, scrollTop);
            }, 100);
        }
    };

    /**
     * Clear the editor
     */
    const clearEditor = () => {
        mermaidCodeTextarea.value = '';
        diagramContainer.innerHTML = '';
        diagramContainer.appendChild(diagramPlaceholder);
        hideError();
        currentZoom = 1;
    };

    /**
     * Import diagram from file
     */
    const importDiagram = () => {
        importFile.click();
    };

    /**
     * Handle file import
     */
    const handleFileImport = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            mermaidCodeTextarea.value = e.target.result;
        };
        reader.onerror = () => {
            showError('Failed to read file');
        };
        reader.readAsText(file);

        // Clear the input
        event.target.value = '';
    };

    /**
     * Export diagram code to file
     */
    const exportCode = () => {
        const code = mermaidCodeTextarea.value.trim();
        if (!code) {
            showError('No diagram code to export');
            return;
        }

        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'diagram.mmd';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    /**
     * Export diagram as SVG
     */
    const exportSvg = () => {
        const svgElement = diagramContainer.querySelector('svg');
        if (!svgElement) {
            showError('No diagram to export. Please render a diagram first.');
            return;
        }

        // Clone the SVG to avoid modifying the original
        const svgClone = svgElement.cloneNode(true);

        // Add dark background to SVG
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', '100%');
        rect.setAttribute('height', '100%');
        rect.setAttribute('fill', '#1a1a2e');
        svgClone.insertBefore(rect, svgClone.firstChild);

        const svgData = new XMLSerializer().serializeToString(svgClone);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'diagram.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    /**
     * Export diagram as PNG
     */
    const exportPng = async () => {
        const svgElement = diagramContainer.querySelector('svg');
        if (!svgElement) {
            showError('No diagram to export. Please render a diagram first.');
            return;
        }

        try {
            // Clone the SVG to avoid modifying the original
            const svgClone = svgElement.cloneNode(true);

            // Get the actual SVG bounding box to capture the entire diagram
            const bbox = svgElement.getBBox();

            // Use the viewBox or bbox to get actual diagram dimensions
            const viewBox = svgElement.getAttribute('viewBox');
            let svgWidth, svgHeight, offsetX = 0, offsetY = 0;

            if (viewBox) {
                const [x, y, width, height] = viewBox.split(' ').map(Number);
                svgWidth = width;
                svgHeight = height;
                offsetX = x;
                offsetY = y;
            } else {
                // Use bbox for actual content dimensions with padding
                const padding = 40;
                offsetX = Math.max(0, bbox.x - padding);
                offsetY = Math.max(0, bbox.y - padding);
                svgWidth = bbox.width + (2 * padding);
                svgHeight = bbox.height + (2 * padding);
            }

            // Set explicit dimensions and viewBox to center the content
            svgClone.setAttribute('width', svgWidth);
            svgClone.setAttribute('height', svgHeight);
            svgClone.setAttribute('viewBox', `${offsetX} ${offsetY} ${svgWidth} ${svgHeight}`);

            // Ensure proper namespace
            svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            svgClone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

            // Add dark background to SVG
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('width', '100%');
            rect.setAttribute('height', '100%');
            rect.setAttribute('fill', '#1a1a2e');
            svgClone.insertBefore(rect, svgClone.firstChild);

            // Convert SVG to string
            const svgData = new XMLSerializer().serializeToString(svgClone);

            // Create canvas with proper dimensions
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const scale = 2; // Higher resolution

            canvas.width = svgWidth * scale;
            canvas.height = svgHeight * scale;

            // Create image from SVG data URL
            const img = new Image();
            const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);

            await new Promise((resolve, reject) => {
                img.onload = () => {
                    try {
                        // Set high quality rendering
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';

                        // Fill with dark background
                        ctx.fillStyle = '#1a1a2e';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);

                        // Draw the SVG at full resolution
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                        // Convert to PNG and download
                        canvas.toBlob((blob) => {
                            if (blob) {
                                const downloadUrl = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = downloadUrl;
                                a.download = 'diagram.png';
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(downloadUrl);
                                resolve();
                            } else {
                                reject(new Error('Failed to create PNG blob'));
                            }
                        }, 'image/png', 1.0);
                    } catch (error) {
                        reject(error);
                    }
                };

                img.onerror = () => {
                    reject(new Error('Failed to load SVG image'));
                };

                img.src = svgDataUrl;
            });

        } catch (error) {
            console.error('PNG export error:', error);
            showError('Failed to export PNG. Please try SVG export instead.');
        }
    };

    /**
     * Zoom functions
     */
    const zoomIn = () => {
        const mermaidDiv = diagramContainer.querySelector('.mermaid');
        if (mermaidDiv && currentZoom < 3) {
            currentZoom += 0.2;
            mermaidDiv.style.transform = `scale(${currentZoom})`;
            mermaidDiv.style.transformOrigin = 'center center';
            updateScrollableArea();
        }
    };

    const zoomOut = () => {
        const mermaidDiv = diagramContainer.querySelector('.mermaid');
        if (mermaidDiv && currentZoom > 0.4) {
            currentZoom -= 0.2;
            mermaidDiv.style.transform = `scale(${currentZoom})`;
            mermaidDiv.style.transformOrigin = 'center center';
            updateScrollableArea();
        }
    };

    const zoomReset = () => {
        const mermaidDiv = diagramContainer.querySelector('.mermaid');
        if (mermaidDiv) {
            currentZoom = 1;
            mermaidDiv.style.transform = `scale(${currentZoom})`;
            mermaidDiv.style.transformOrigin = 'center center';
            setupScrollableArea(); // Reset to original scroll area
        }
    };

    /**
     * Update scrollable area when zooming
     */
    const updateScrollableArea = () => {
        const mermaidDiv = diagramContainer.querySelector('.mermaid');
        const svgElement = mermaidDiv?.querySelector('svg');
        const wrapper = diagramContainer.querySelector('.diagram-wrapper');
        
        if (svgElement && wrapper) {
            const bbox = svgElement.getBBox();
            const scaledWidth = bbox.width * currentZoom;
            const scaledHeight = bbox.height * currentZoom;
            
            // Maintain generous padding for scrolling at any zoom level
            const scrollPadding = Math.max(scaledWidth * 2, scaledHeight * 2, 800);
            
            wrapper.style.width = `${scaledWidth + scrollPadding}px`;
            wrapper.style.height = `${scaledHeight + scrollPadding}px`;
        }
    };

    // Event Listeners
    renderBtn.addEventListener('click', renderDiagram);
    clearBtn.addEventListener('click', clearEditor);
    insertTemplateBtn.addEventListener('click', insertTemplate);
    importBtn.addEventListener('click', importDiagram);
    importFile.addEventListener('change', handleFileImport);
    exportCodeBtn.addEventListener('click', exportCode);
    exportSvgBtn.addEventListener('click', exportSvg);
    exportPngBtn.addEventListener('click', () => exportPng().catch(console.error));
    zoomInBtn.addEventListener('click', zoomIn);
    zoomOutBtn.addEventListener('click', zoomOut);
    zoomResetBtn.addEventListener('click', zoomReset);

    // Keyboard shortcuts
    mermaidCodeTextarea.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'Enter':
                    e.preventDefault();
                    renderDiagram();
                    break;
                case 's':
                    e.preventDefault();
                    exportCode();
                    break;
                case 'o':
                    e.preventDefault();
                    importDiagram();
                    break;
            }
        }
    });

    // Auto-render on template change
    diagramTypeSelect.addEventListener('change', () => {
        if (mermaidCodeTextarea.value.trim() === '' ||
            Object.values(templates).includes(mermaidCodeTextarea.value.trim())) {
            insertTemplate();
        }
    });

    // Initial render with default template
    renderDiagram();
});