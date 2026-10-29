
const OLLAMA_API_URL = "http://localhost:11434/api/generate";
const OLLAMA_TAGS = "http://localhost:11434/api/tags";

const modelSelected = document.getElementById("model");
const errorElem = document.getElementById("error");
const answer = document.getElementById("answer");
const imageInput = document.getElementById("imageInput");
const imagePreview = document.getElementById("imagePreview");
const previewContainer = document.getElementById("previewContainer");
const statusElem = document.getElementById("status");
const submitButton = document.getElementById("submitButton");

// Load available Ollama models
async function loadOllamaModels() {
    try {
        const response = await fetch(OLLAMA_TAGS);

        if (!response.ok) {
            throw new Error("Failed to fetch the Ollama model list.");
        }

        const data = await response.json();

        if (data.models && data.models.length > 0) {
            modelSelected.replaceChildren();

            data.models.forEach((model) => {
                const option = document.createElement("option");
                option.value = model.name;
                option.textContent = model.name;
                modelSelected.appendChild(option);
            });
        } else {
            modelSelected.innerHTML =
                '<option value="">No models found</option>';

            throw new Error(
                "No Ollama models found. Install a model first."
            );
        }
    } catch (err) {
        console.error("Error loading models:", err);
        errorElem.textContent = err.message;
        modelSelected.innerHTML =
            '<option value="">Unable to load models</option>';
    }
}

loadOllamaModels();

// Preview the selected image
imageInput.addEventListener("change", () => {
    errorElem.textContent = "";
    statusElem.textContent = "";

    const file = imageInput.files[0];

    if (!file) {
        previewContainer.hidden = true;
        imagePreview.removeAttribute("src");
        return;
    }

    if (!file.type.startsWith("image/")) {
        imageInput.value = "";
        previewContainer.hidden = true;
        errorElem.textContent = "Please select a valid image file.";
        return;
    }

    const reader = new FileReader();

    reader.onload = () => {
        imagePreview.src = reader.result;
        previewContainer.hidden = false;
    };

    reader.onerror = () => {
        errorElem.textContent = "Could not read the selected image.";
        previewContainer.hidden = true;
    };

    reader.readAsDataURL(file);
});

// Send the image and prompt to Ollama

async function getOllamaResponse(event) {
    event.preventDefault();

    errorElem.textContent = "";
    statusElem.textContent = "";
    answer.textContent = "";

    const file = imageInput.files[0];
    const userPrompt = document.getElementById("prompt").value.trim();
    const selectedModel = modelSelected.value;

    // 1. Validate the user's selections
    if (!file) {
        errorElem.textContent = "Please select an image first.";
        return;
    }

    if (!selectedModel) {
        errorElem.textContent = "Please select an AI model.";
        return;
    }

    if (!userPrompt) {
        errorElem.textContent = "Please enter a prompt.";
        return;
    }

    const controller = new AbortController();
    let timeoutId;

    submitButton.disabled = true;
    submitButton.textContent = "Analyzing...";
    statusElem.textContent = "AI is processing your image...";

    try {
        // 2. Convert the image to Base64
        const base64Image = await new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => {
                resolve(reader.result.split(",")[1]);
            };

            reader.onerror = () => {
                reject(new Error("Could not read the image."));
            };

            reader.readAsDataURL(file);
        });

        // 3. Send the image and prompt to Ollama
        const payLoad = {
            model: selectedModel,
            prompt: userPrompt,
            images: [base64Image],
            stream: false
        };

        console.log("Sending image to model:", selectedModel);
        console.log("Image size:", file.size, "bytes");

        timeoutId = setTimeout(() => {
            controller.abort();
        }, 120000);

        const response = await fetch(OLLAMA_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payLoad),
            signal: controller.signal
        });

        // 4. Handle HTTP errors from Ollama
        if (!response.ok) {
            const errorText = await response.text();

            throw new Error(
                `Ollama returned ${response.status}: ${errorText}`
            );
        }

        // 5. Read the AI's response
        const data = await response.json();

        console.log("Full Ollama response:", data);

        if (typeof data.response !== "string" ||
            data.response.trim() === "") {
            throw new Error("Ollama returned no text description.");
        }

        // 6. DISPLAY THE DESCRIPTION ON THE WEBPAGE
        answer.textContent = data.response;

        statusElem.textContent =
            "Image analysis completed successfully!";

    } catch (error) {
        console.error("Image analysis failed:", error);

        if (error.name === "AbortError") {
            errorElem.textContent =
                "The request timed out after 2 minutes. Try a smaller image or another model.";
        } else {
            errorElem.textContent =
                "Analysis failed: " + error.message;
        }

        statusElem.textContent = "";
    } finally {
        clearTimeout(timeoutId);
        submitButton.disabled = false;
        submitButton.textContent = "Analyze Image";
    }
}


document
    .getElementById("promptForm")
    .addEventListener("submit", getOllamaResponse);
