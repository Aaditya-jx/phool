# How to set up Cloudinary and get your API credentials

1.  **Create a Cloudinary account:**
    *   Go to [https://cloudinary.com/users/register/free](https://cloudinary.com/users/register/free) and sign up for a free account.

2.  **Find your API credentials:**
    *   After signing up and logging in, you will be redirected to your dashboard.
    *   On the dashboard, you will find your `Cloud Name`, `API Key`, and `API Secret`.

3.  **Update your `.env` file:**
    *   In the `server` directory, create a new file named `.env` if you don't have one already.
    *   Copy the contents of `.env.example` into `.env`.
    *   In the `.env` file, you will find the following lines:
        ```
        # Cloudinary Configuration
        CLOUDINARY_CLOUD_NAME=your_cloud_name
        CLOUDINARY_API_KEY=your_api_key
        CLOUDINARY_API_SECRET=your_api_secret
        ```
    *   Replace `your_cloud_name`, `your_api_key`, and `your_api_secret` with the credentials you found on your Cloudinary dashboard.

4.  **Install dependencies and run the server:**
    *   Open your terminal in the `server` directory.
    *   Run `npm install` to install the new packages.
    *   Run `npm start` or `npm run dev` to start the server.

After following these steps, your application will be able to upload images to Cloudinary.
