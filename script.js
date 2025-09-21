// Wait for the HTML document to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {
    
    const toolContainer = document.getElementById('tool-container');

    // Function to generate the tool blocks on the page
    const createToolBlocks = (toolsData) => {
        if (!toolContainer) {
            console.error("Tool container not found!");
            return;
        }

        // Loop through each tool in the toolsData array
        toolsData.forEach(tool => {
            // Create an anchor tag 'a' to make the entire block clickable
            const block = document.createElement('a');
            block.className = 'tool-block'; // Add the 'tool-block' class for styling
            block.href = tool.url; // Set the link for the tool

            // Set the background image dynamically using an inline style
            block.style.backgroundImage = `url('${tool.imageUrl}')`;

            // Create the inner content for the block
            block.innerHTML = `
                <div class="block-content">
                    <h2>${tool.title}</h2>
                    <p>${tool.description}</p>
                </div>
            `;

            // Append the newly created block to the tool container
            toolContainer.appendChild(block);
        });
    };
    
    // Fetch the tool data from the JSON file
    fetch('tools.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json(); // Parse the JSON
        })
        .then(data => {
            createToolBlocks(data); // Call the function to create blocks with the loaded data
        })
        .catch(error => {
            console.error('There has been a problem with your fetch operation:', error);
            toolContainer.innerHTML = '<p style="color: #e94560;">Sorry, could not load the tools. Please check the console for errors.</p>';
        });
});