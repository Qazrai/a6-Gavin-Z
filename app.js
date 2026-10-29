const OLLAMA_API_URL = "http://localhost:11434/api/generate";
const OLLAMA_TAGS = "http://localhost:11434/api/tags";

const modelSelected = document.getElementById("model");
const errorElem = document.getElementById("error");
const answer = document.getElementById("answer");

async function loadOllamaModels(){

    try{

        const response = await fetch(OLLAMA_TAGS);

        if(!response.ok){
            errorElem.innerHTML = "Failed to fetch model list";
            throw new Error("Failed to fetch model list");
        }

        const data = await response.json();

        if(data.models && data.models.length>0){

            const optionsHtml = data.models.map((model)=>
                `<option value = "${model.name}">${model.name}</option>`

        ).join("");

        modelSelected.innerHTML = optionsHtml;

        }

        else{
            modelSelected.innerHTML = "<option disabled> No model found </option>"
        }
    }

    catch(err){
        console.Error("Error loading models", err);
        errorElem.innerHTML = err.message;
        modelSelected.innerHTML = `<option disabled>${err.message}</option>`
    }
    
}

loadOllamaModels();


async function getOllamaResponse(event){

    event.preventDefault();

     const userPrompt = document.getElementById("prompt").value

     const payLoad = {

        model : modelSelected.value,
        prompt : userPrompt,
        stream : false

     }

    try{

        const response = await fetch (OLLAMA_API_URL , {

            method : "POST",
            headers : {"Content-Type": "application/json"},
            body : JSON.stringify(payLoad),

        });

        if(!response.ok){

            throw new Error ( `Error:${response.status} - ${response.statusText}`);

        }

        const data = await response.json();

        console.log(modelSelected.value + "OUTPUT", data);

        answer.innerHTML = `<p>${modelSelected.value} output:</p>${data.response}`

    }

    catch(error){

        console.error("ERROR communication with Ollama", error);

    }
}

document.getElementById("promptForm").addEventListener("submit",getOllamaResponse)