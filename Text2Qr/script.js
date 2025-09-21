document.addEventListener('DOMContentLoaded', () => {
    // DOM Element References
    const textInput = document.getElementById('text-input');
    const upiIdInput = document.getElementById('upi-id');
    const upiNameInput = document.getElementById('upi-name');
    const upiAmountInput = document.getElementById('upi-amount');
    const generateBtn = document.getElementById('generate-btn');
    const downloadBtn = document.getElementById('download-btn');
    const qrContainer = document.getElementById('qr-code-container');
    const validationMessage = document.getElementById('validation-message');
    const color1Input = document.getElementById('color1');
    const color2Input = document.getElementById('color2');
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    // Initialize QR Code Styling instance
    const qrCode = new QRCodeStyling({
        width: 250,
        height: 250,
        type: 'svg',
        data: 'https://github.com/vinay-ghate',
        dotsOptions: {
            type: 'rounded'
        },
        backgroundOptions: {
            color: '#ffffff',
        },
        cornersSquareOptions: {
            type: 'extra-rounded'
        }
    });

    // Initial QR code render
    qrCode.append(qrContainer);
    qrContainer.querySelector('#qr-placeholder')?.remove();

    /**
     * Handles tab switching logic.
     */
    tabLinks.forEach(tab => {
        tab.addEventListener('click', () => {
            tabLinks.forEach(item => item.classList.remove('active'));
            tabContents.forEach(item => item.classList.remove('active'));

            const tabId = tab.getAttribute('data-tab');
            const activeTabContent = document.getElementById(tabId);
            tab.classList.add('active');
            activeTabContent.classList.add('active');
            validationMessage.textContent = '';
        });
    });

    /**
     * Main function to generate the QR code.
     */
    const generateQRCode = () => {
        let qrData = '';
        let isValid = false;

        const activeTab = document.querySelector('.tab-content.active').id;
        
        if (activeTab === 'text-url-tab') {
            qrData = textInput.value.trim();
            if (qrData) isValid = true;
        } else if (activeTab === 'upi-tab') {
            const upiId = upiIdInput.value.trim();
            const upiName = upiNameInput.value.trim();
            
            if (upiId && upiName) {
                const upiAmount = upiAmountInput.value.trim();
                let upiString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}`;
                if (upiAmount) {
                    upiString += `&am=${encodeURIComponent(upiAmount)}`;
                }
                upiString += '&cu=INR';
                qrData = upiString;
                isValid = true;
            }
        }
        
        if (!isValid) {
            validationMessage.textContent = 'Please fill in the required fields to generate a QR code.';
            return;
        }
        
        validationMessage.textContent = '';
        
        // Update QR Code with new options
        qrCode.update({
            data: qrData,
            dotsOptions: {
                gradient: {
                    type: 'linear',
                    rotation: 0,
                    colorStops: [
                        { offset: 0, color: color1Input.value },
                        { offset: 1, color: color2Input.value }
                    ]
                }
            }
        });

        downloadBtn.classList.remove('hidden');
    };
    
    generateBtn.addEventListener('click', generateQRCode);
    
    // Event listener for the Download button
    downloadBtn.addEventListener('click', () => {
        qrCode.download({
            name: 'text2qr-code',
            extension: 'png',
            // **NEW**: Adds a 20px white border around the downloaded QR code
            margin: 20 
        });
    });
});