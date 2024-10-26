// This is a placeholder
// We will use web-workers to simluate a serverside environment (this is a single player game, websockets are not really needed)
// simluation is used to offload tasks like movement and damage calculations off of the main thread

self.addEventListener("message", (event) => {
    if (event.data === "initialize") {
        // Send back a message to confirm connection
        postMessage("connected");
    }
});