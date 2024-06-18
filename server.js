// Import necessary modules
import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import ngrok from 'ngrok';

// Initialize Express app
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

// Route to handle webhook requests from DialogFlow
app.post('/webhook', async (req, res) => {
    const orderId = req.body.queryResult.parameters['order-id'];
    console.log(`Received order ID: ${orderId}`);

    // Fetch shipment date from external API
    try {
        const response = await fetch('https://orderstatusapi-dot-organization-project-311520.uc.r.appspot.com/api/getOrderStatus', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId })
        });

        const data = await response.json();
        const shipmentDate = new Date(data.shipmentDate);
        console.log(shipmentDate)
        const formattedDate = shipmentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });

        res.json({
            fulfillmentText: `Your order with ID ${orderId} will be shipped on ${formattedDate}.`
        });
    } catch (error) {
        console.error('Error fetching order status:', error);
        res.json({
            fulfillmentText: `Failed to fetch shipment date for order ID ${orderId}.`
        });
    }
});

// Start the Express server
const server = app.listen(port, async () => {
    console.log(`Server is running on port ${port}`);

    // Start ngrok and create a tunnel to port 3000
    try {
        const url = await ngrok.connect(port);
        console.log(`Ngrok tunnel is active at ${url}`);
    } catch (error) {
        console.error('Error starting ngrok:', error);
    }
});

// Handle server shutdown gracefully
process.on('SIGINT', () => {
    console.log('Shutting down server and ngrok...');
    server.close();
    ngrok.kill();
    process.exit(0);
});
