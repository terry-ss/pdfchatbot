document.addEventListener("DOMContentLoaded", function () {
    const messagesContainer = document.getElementById("messages") as HTMLElement;
    const fileInput = document.getElementById("fileInput") as HTMLInputElement;
    const userInput = document.getElementById("userInput") as HTMLInputElement;
    const sendMessageButton = document.getElementById("sendMessage") as HTMLButtonElement;
    const clearMessagesButton = document.getElementById("clearMessages") as HTMLButtonElement;
    const clearPDFInfoButton = document.getElementById("clearPDFInfo") as HTMLButtonElement;
    const pdfFileNameElement = document.getElementById("pdfFileName") as HTMLElement;
    const fileInputLabel = document.getElementById("fileInputLabel") as HTMLElement;

    // Define the API endpoint URL
    const apiUrl = "http://localhost:5000";

    // Style the file input
    fileInputLabel.addEventListener("click", () => {
        fileInput.click();
    });

    fileInput.addEventListener("change", (event) => {
        const file = fileInput.files[0];
        if (file) {
            // Update the "PDF File" section to display the uploaded file name
			showLoadingAnimation();
			const formData = new FormData();
			formData.append("pdf", file);
			fetch(`${apiUrl}/upload-pdf`, {
				method: "POST",
				body: formData,
			})
            .then((response) => response.json())
            .then((data) => {
                const fileName = data.filename;
                pdfFileNameElement.innerText = ` ${fileName}`;
				hideLoadingAnimation();
            })
			.catch((error) => {
				console.error('Fetch error:', error);
				hideLoadingAnimation();
			 })
			
        } else {
            // Disable the "Send" button if no file is selected
            sendMessageButton.disabled = true;
            // Clear the "PDF File" section when no file is selected
            pdfFileNameElement.innerText = "";
        }
    });
	
	function showLoadingAnimation() {
	  const loadingElement = document.createElement('div');
	  loadingElement.textContent = 'Loading...'; // You can replace this with your loading animation HTML/CSS
	  loadingElement.classList.add('loading-animation'); // Add your CSS class for the loading animation

	  // Append the loading element to the body or any other appropriate location
	  document.body.appendChild(loadingElement);

	  // You can also use CSS to style and position the loading animation
	}

	function hideLoadingAnimation() {
	  const loadingElement = document.querySelector('.loading-animation');
	  if (loadingElement) {
		loadingElement.remove(); // Remove the loading element when the fetch is complete
	  }
	}

    sendMessageButton.addEventListener("click", () => {
        const userMessage = userInput.value;

        if (userMessage === null || userMessage.trim() === "") {
            console.log("alert");
            return; // Do not proceed further
        }
        if (fileInput.files.length === 0) {
            // Display a warning if no file is uploaded
            alert("PDFファイルを選んでください");
            return; // Do not proceed further
        }

        // Send the user message to the backend and display the response
		displayMessage(userMessage, "user");
		showLoadingAnimation();
        fetch(`${apiUrl}/generate-response`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ user_message: userMessage }),
        })
        .then((response) => response.json())
        .then((data) => {
            const botResponse = data.response;
            hideLoadingAnimation()
            displayMessage(botResponse, "bot");
        })
		.catch((error) => {
			console.error('Fetch error:', error);
			hideLoadingAnimation();
		 });

        userInput.value = "";
    });

    clearMessagesButton.addEventListener("click", (event) => {
        addRippleEffect(event);
        // Clear chat messages in the frontend
        messagesContainer.innerHTML = "";

        // Send a request to the backend to clear chat messages
        fetch(`${apiUrl}/clear-messages`, {
            method: "POST",
        });
    });

    clearPDFInfoButton.addEventListener("click", (event) => {
        addRippleEffect(event);
        fileInput.value = ""; // Clear the file input
        pdfFileNameElement.innerText = "";
		
		fetch(`${apiUrl}/clear-pdf-info`, {
            method: "POST",
        });
		
		messagesContainer.innerHTML = "";
		fetch(`${apiUrl}/clear-messages`, {
            method: "POST",
        });
    });

    // Capture "Enter" key press in the chat input field
    function handleInputKeyDown(event: KeyboardEvent) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendMessageButton.click(); // Simulate a click on the "Send" button
        }
    }

    // Attach the event listener to the input element
    userInput.addEventListener("keydown", handleInputKeyDown);

    function displayMessage(message: string, sender: "user" | "bot" | "system") {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message", sender);
        messageDiv.innerText = message;
        messagesContainer.appendChild(messageDiv);
    }

     function addRippleEffect(event: MouseEvent) {
            const button = event.target as HTMLElement;
            const ripple = document.createElement("span");
            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = event.clientX - rect.left - size / 2;
            const y = event.clientY - rect.top - size / 2;

            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;

            ripple.classList.add("ripple");
            const existingRipple = button.getElementsByClassName("ripple");
            if (existingRipple.length > 0) {
                button.removeChild(existingRipple[0]);
            }
            button.appendChild(ripple);

            ripple.addEventListener("animationend", () => {
                ripple.remove();
            });
			
			
        }
});
