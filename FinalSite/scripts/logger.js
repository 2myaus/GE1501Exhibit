async function sendLog(elapsedMillis, buttonPresses) {
    const data = {
        elapsedMillis,
        buttonPresses
    };

    try {
        const response = await fetch('http://localhost:8080', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const text = await response.text();
        console.log("Server response:", text);
    } catch (error) {
        console.error("Error sending data:", error);
    }
}

// Example usage:
// sendLog(1234, 5);
