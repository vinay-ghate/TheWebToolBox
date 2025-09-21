# 🛠️ The Web Tool Box

Welcome to **The Web Tool Box**! This is a lovingly curated collection of small, simple, and fun utilities built with pure HTML, CSS, and JavaScript. No backends, no complex frameworks, just pure creative coding vibes.

This project is all about "vibe coding" — building things for the joy of it, learning as we go, and creating a fun, collaborative space for developers and users alike.

## 🚀 Live Demo

You can view the live project hosted on GitHub Pages here:

**[https://github.com/vinay-ghate/TheWebToolBox](https://vinay-ghate.github.io/TheWebToolBox/)**

## ✨ Features

* **Pure Vanilla Stack:** No frameworks or libraries. Just pure HTML, CSS, and JavaScript.
* **Dynamic Loading:** Tools are loaded dynamically from a simple `tools.json` file.
* **Fully Responsive:** A clean, square-grid UI that looks great on desktop and mobile devices.
* **Easy to Extend:** Add your own tool by creating a folder and adding one entry to the JSON file.

## 💻 Tech Stack

* **HTML5**
* **CSS3** (with modern features like CSS Grid and Variables)
* **Vanilla JavaScript** (using the Fetch API for dynamic data loading)

## 🔧 Getting Started

To get a local copy up and running, follow these simple steps.

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/vinay-ghate/TheWebToolBox
    ```
2.  **Navigate to the project directory:**
    ```sh
    cd TheWebToolBox
    ```
3.  **Run a local server:**
    Because this project uses the `fetch()` API to load `tools.json`, you cannot run it by simply opening `index.html` in your browser from the file system (`file:///...`). You need a simple local server.

    The easiest way is to use the **Live Server** extension in Visual Studio Code. Simply right-click on the `index.html` file and choose "Open with Live Server".

## ➕ How to Add a New Tool

Adding a new tool to the toolbox is incredibly simple:

1.  **Create the Tool's Folder:**
    Add a new folder for your tool inside the main project directory (e.g., `NewCoolTool/`). Place your tool's `index.html` and other assets inside it.

2.  **Update the `tools.json` file:**
    Open the `tools.json` file and add a new object to the array for your tool. Make sure to follow the existing format:

    ```json
    {
      "id": 3,
      "title": "My New Tool",
      "description": "A short, exciting description of what this new tool does.",
      "url": "NewCoolTool/index.html",
      "imageUrl": "https://path/to/an/awesome/image.png",
      "category": "Generator"
    }
    ```
    And that's it! Your new tool will now appear on the main page.

## 👤 Author

This project was created with joy by **Vinay**.

* **LinkedIn:** [linkedin.com/in/vinay-ghate](https://www.linkedin.com/in/vinay-ghate/)

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.
