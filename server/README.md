# Phoolishh Loveee - Backend

This is the backend for the Phoolishh Loveee e-commerce application. It is built with Node.js, Express, and MongoDB.

## Prerequisites

- Node.js
- npm
- MongoDB

## Getting Started

1.  **Clone the repository**

2.  **Navigate to the `server` directory**
    ```
    cd server
    ```

3.  **Install dependencies**
    ```
    npm install
    ```

4.  **Create a `.env` file** in the `server` directory and add the following environment variables:
    ```
    # MongoDB Connection String
    MONGO_URI=your_mongodb_connection_string

    # JWT Secret for token generation
    JWT_SECRET=your_jwt_secret

    # Razorpay API Keys
    RAZORPAY_KEY_ID=your_razorpay_key_id
    RAZORPAY_KEY_SECRET=your_razorpay_key_secret

    # Port
    PORT=5000
    ```

5.  **Run the server**
    ```
    npm run dev
    ```
    The server will be running on http://localhost:5000

## API Endpoints

A detailed list of API endpoints can be found in the route files within the `routes` directory.

-   **Auth**: `/api/auth`
-   **Products**: `/api/products`
-   **Cart**: `/api/cart`
-   **Orders**: `/api/orders`
