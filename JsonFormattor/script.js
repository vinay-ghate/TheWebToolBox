document.addEventListener('DOMContentLoaded', () => {
    // DOM Element References
    const jsonInput = document.getElementById('json-input');
    const jsonMinifyInput = document.getElementById('json-minify-input');
    const jsonValidateInput = document.getElementById('json-validate-input');
    const processBtn = document.getElementById('process-btn');
    const copyBtn = document.getElementById('copy-btn');
    const clearBtn = document.getElementById('clear-btn');
    const jsonOutput = document.getElementById('json-output');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    const indentSize = document.getElementById('indent-size');
    const autoFix = document.getElementById('auto-fix');
    const charCount = document.getElementById('char-count');
    const lineCount = document.getElementById('line-count');
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    let currentMode = 'format';

    /**
     * Handles tab switching logic and updates button text
     */
    tabLinks.forEach(tab => {
        tab.addEventListener('click', () => {
            tabLinks.forEach(item => item.classList.remove('active'));
            tabContents.forEach(item => item.classList.remove('active'));

            const tabId = tab.getAttribute('data-tab');
            const activeTabContent = document.getElementById(tabId);
            tab.classList.add('active');
            activeTabContent.classList.add('active');
            
            // Update current mode and button text
            if (tabId === 'format-tab') {
                currentMode = 'format';
                processBtn.textContent = 'Format JSON';
            } else if (tabId === 'minify-tab') {
                currentMode = 'minify';
                processBtn.textContent = 'Minify JSON';
            } else if (tabId === 'validate-tab') {
                currentMode = 'validate';
                processBtn.textContent = 'Validate JSON';
            }
            
            clearMessages();
            copyBtn.classList.add('hidden');
        });
    });

    /**
     * Auto-fixes common JSON errors
     */
    const autoFixJson = (jsonString) => {
        let fixed = jsonString.trim();
        
        // Fix single quotes to double quotes (but preserve quotes inside string values)
        // First, temporarily replace escaped quotes
        const tempMarker = '___TEMP_QUOTE___';
        fixed = fixed.replace(/\\'/g, tempMarker);
        
        // Track if we're inside a string
        let inString = false;
        let result = '';
        
        for (let i = 0; i < fixed.length; i++) {
            const char = fixed[i];
            const prevChar = i > 0 ? fixed[i - 1] : '';
            
            if (char === '"' && prevChar !== '\\') {
                inString = !inString;
                result += char;
            } else if (char === "'" && !inString) {
                // Replace single quotes with double quotes only when not inside a string
                result += '"';
            } else {
                result += char;
            }
        }
        
        fixed = result;
        
        // Restore escaped quotes
        fixed = fixed.replace(new RegExp(tempMarker, 'g'), "\\'");
        
        // Fix unquoted keys (only outside of strings)
        fixed = fixed.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');
        
        // Fix trailing commas
        fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
        
        // Fix missing commas between object/array elements
        fixed = fixed.replace(/}(\s*){/g, '},$1{');
        fixed = fixed.replace(/](\s*)\[/g, '],$1[');
        
        // Fix undefined/null values
        fixed = fixed.replace(/:\s*undefined/g, ': null');
        
        // Fix missing commas after strings/numbers/booleans
        fixed = fixed.replace(/("(?:[^"\\]|\\.)*"|true|false|null|\d+(?:\.\d+)?)\s*\n\s*(")/g, '$1,\n$2');
        
        return fixed;
    };

    /**
     * Validates and parses JSON with error handling
     */
    const parseJson = (jsonString, shouldAutoFix = false) => {
        let processedString = jsonString.trim();
        
        if (!processedString) {
            throw new Error('Please enter some JSON to process');
        }

        if (shouldAutoFix) {
            processedString = autoFixJson(processedString);
        }

        try {
            return JSON.parse(processedString);
        } catch (error) {
            // Provide more helpful error messages
            let errorMsg = error.message;
            
            // Enhanced error detection for common issues
            if (errorMsg.includes('Unexpected token')) {
                const match = errorMsg.match(/position (\d+)/);
                if (match) {
                    const position = parseInt(match[1]);
                    const lines = processedString.substring(0, position).split('\n');
                    const lineNum = lines.length;
                    const colNum = lines[lines.length - 1].length + 1;
                    const problemChar = processedString[position];
                    
                    errorMsg = `Syntax error at Line ${lineNum}, Column ${colNum}`;
                    
                    if (problemChar === "'") {
                        errorMsg += '\n\nIssue: Single quotes are not valid in JSON. Use double quotes instead.';
                    } else if (problemChar === ',') {
                        errorMsg += '\n\nIssue: Trailing comma detected. Remove the extra comma.';
                    } else {
                        errorMsg += `\n\nUnexpected character: "${problemChar}"`;
                    }
                }
            } else if (errorMsg.includes('Unexpected end of JSON input')) {
                errorMsg = 'Incomplete JSON: Missing closing brackets, braces, or quotes.';
            }
            
            if (shouldAutoFix) {
                errorMsg += '\n\n⚠️ Auto-fix attempted but couldn\'t resolve all issues. Please review your JSON manually.';
            } else {
                errorMsg += '\n\n💡 Tip: Enable "Auto-fix common errors" to automatically fix simple issues like single quotes and trailing commas.';
            }
            
            throw new Error(errorMsg);
        }
    };

    /**
     * Formats JSON with syntax highlighting
     */
    const formatJsonWithHighlighting = (obj, indent) => {
        const indentStr = indent === 'tab' ? '\t' : ' '.repeat(parseInt(indent));
        const formatted = JSON.stringify(obj, null, indentStr);
        
        // Apply syntax highlighting
        return formatted
            .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
            .replace(/:\s*"([^"]*)"/g, ': <span class="json-string">"$1"</span>')
            .replace(/:\s*(\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
            .replace(/:\s*(true|false)/g, ': <span class="json-boolean">$1</span>')
            .replace(/:\s*(null)/g, ': <span class="json-null">$1</span>')
            .replace(/([{}[\],])/g, '<span class="json-punctuation">$1</span>');
    };

    /**
     * Updates character and line count statistics
     */
    const updateStats = (text) => {
        const chars = text.length;
        const lines = text.split('\n').length;
        charCount.textContent = `${chars.toLocaleString()} characters`;
        lineCount.textContent = `${lines.toLocaleString()} lines`;
    };

    /**
     * Shows success message
     */
    const showSuccess = (message) => {
        clearMessages();
        successMessage.textContent = message;
        successMessage.classList.add('show');
    };

    /**
     * Shows error message
     */
    const showError = (message) => {
        clearMessages();
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
    };

    /**
     * Clears all messages
     */
    const clearMessages = () => {
        errorMessage.classList.remove('show');
        successMessage.classList.remove('show');
    };

    /**
     * Gets the current active input based on selected tab
     */
    const getCurrentInput = () => {
        switch (currentMode) {
            case 'format':
                return jsonInput;
            case 'minify':
                return jsonMinifyInput;
            case 'validate':
                return jsonValidateInput;
            default:
                return jsonInput;
        }
    };

    /**
     * Main processing function
     */
    const processJson = () => {
        const currentInput = getCurrentInput();
        const inputValue = currentInput.value;
        const shouldAutoFix = autoFix.checked;
        const indent = indentSize.value;

        try {
            const parsedJson = parseJson(inputValue, shouldAutoFix);
            let result = '';
            let successMsg = '';

            switch (currentMode) {
                case 'format':
                    result = formatJsonWithHighlighting(parsedJson, indent);
                    successMsg = 'JSON formatted successfully!';
                    break;
                
                case 'minify':
                    result = JSON.stringify(parsedJson);
                    successMsg = 'JSON minified successfully!';
                    break;
                
                case 'validate':
                    result = formatJsonWithHighlighting(parsedJson, indent);
                    successMsg = '✅ Valid JSON! No errors found.';
                    break;
            }

            jsonOutput.innerHTML = result;
            updateStats(currentMode === 'minify' ? result : JSON.stringify(parsedJson, null, indent === 'tab' ? '\t' : ' '.repeat(parseInt(indent))));
            showSuccess(successMsg);
            copyBtn.classList.remove('hidden');

        } catch (error) {
            jsonOutput.innerHTML = `<code>Error: ${error.message}</code>`;
            updateStats('');
            showError(error.message);
            copyBtn.classList.add('hidden');
        }
    };

    /**
     * Copies the result to clipboard
     */
    const copyResult = async () => {
        try {
            const textToCopy = jsonOutput.textContent || jsonOutput.innerText;
            await navigator.clipboard.writeText(textToCopy);
            showSuccess('Result copied to clipboard!');
        } catch (error) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = jsonOutput.textContent || jsonOutput.innerText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showSuccess('Result copied to clipboard!');
        }
    };

    /**
     * Clears all inputs and outputs
     */
    const clearAll = () => {
        jsonInput.value = '';
        jsonMinifyInput.value = '';
        jsonValidateInput.value = '';
        jsonOutput.innerHTML = '<code>Your formatted JSON will appear here</code>';
        updateStats('');
        clearMessages();
        copyBtn.classList.add('hidden');
    };

    // Event Listeners
    processBtn.addEventListener('click', processJson);
    copyBtn.addEventListener('click', copyResult);
    clearBtn.addEventListener('click', clearAll);

    // Auto-process on Enter (Ctrl+Enter)
    [jsonInput, jsonMinifyInput, jsonValidateInput].forEach(input => {
        input.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                processJson();
            }
        });
    });

    // Initialize stats
    updateStats('');
});