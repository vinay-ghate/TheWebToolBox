// Wait for the HTML document to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {
    
    // Get the container element where the cards will be placed
    const toolGrid = document.getElementById('tool-grid');

    /**
     * Creates and displays the tool cards on the page from the fetched data.
     * @param {Array} toolData - An array of tool objects.
     */
    const createToolCards = (toolData) => {
        if (!toolGrid) {
            console.error("The element with ID 'tool-grid' was not found!");
            return;
        }

        // Loop through each tool object in the data array
        toolData.forEach(tool => {
            // Create an anchor tag 'a' to make the entire card clickable
            const cardLink = document.createElement('a');
            cardLink.href = tool.url;
            cardLink.className = 'tool-card'; // Use the class from your style.css

            // Create the div for the background image
            const cardBackground = document.createElement('div');
            cardBackground.className = 'card-background';
            cardBackground.style.backgroundImage = `url('${tool.imageUrl}')`;

            // Create the div that holds the text content
            const cardContent = document.createElement('div');
            cardContent.className = 'card-content';
            
            // Set the inner HTML for the title and description
            cardContent.innerHTML = `
                <h2 class="card-title">${tool.title}</h2>
                <p class="card-description">${tool.description}</p>
            `;

            // Append the background and content divs to the main card link
            cardLink.appendChild(cardBackground);
            cardLink.appendChild(cardContent);

            // Append the fully constructed card to the grid container
            toolGrid.appendChild(cardLink);
        });
    };
    
    // Fetch the tool data from the JSON file
    fetch('tools.json')
        .then(response => {
            // Check if the network response was successful
            if (!response.ok) {
                // If not, throw an error to be caught by the .catch() block
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            // If successful, parse the JSON from the response
            return response.json();
        })
        .then(data => {
            // Once the data is parsed, call the function to create the cards
            createToolCards(data);
        })
        .catch(error => {
            // If any error occurs in the fetch chain, it will be caught here
            console.error('There has been a problem with your fetch operation:', error);
            // Display an error message to the user inside the grid container
            if (toolGrid) {
                 toolGrid.innerHTML = `<p style="color: #ff8a80;">Failed to load tools. Please check the console for errors.</p>`;
            }
        });
});