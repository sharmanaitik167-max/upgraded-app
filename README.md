# NatvarNand Business Management App

A simple, clean, and user-friendly web application built for the NatvarNand cement business. This app allows the owner to track daily sales, manage customer entries, and export data.

## Features
- **Customer Entry**: Add customer name, phone, product, and purchase amount.
- **Dashboard**: View all entries, search by name or phone, and filter by date.
- **Billing Summary**: Automatically calculates total sales, today's sales, and monthly sales.
- **Data Export**: Export customer data to CSV with one click.
- **Cloud Database (Firebase)**: Data is stored securely in Firebase Firestore. 

## Tech Stack
- React (Vite)
- Tailwind CSS
- Firebase (Firestore)
- Lucide React (Icons)
- Date-fns (Date formatting)

## Setup Instructions

### 1. Run Locally (With Local Storage)
The app is currently configured to fall back to `localStorage` if Firebase is not connected. You can test the app immediately without any setup:

```bash
# Navigate to the app directory
cd app

# Start the development server
npm run dev
```

### 2. Connect to Firebase (Cloud Database)
To ensure your data is synced across devices and backed up, you need to connect the app to your Firebase account.

#### Step 2a: Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **"Add Project"**, name it `NatvarNand`, and complete the setup.
3. In your project dashboard, click the **Web icon (`</>`)** to add a new web app.
4. Register the app (you don't need to set up Firebase Hosting right now).
5. Firebase will provide you with a `firebaseConfig` object containing your keys.

#### Step 2b: Enable Firestore Database
1. In the left menu of the Firebase Console, click **"Firestore Database"**.
2. Click **"Create database"**.
3. Choose **"Start in test mode"** (this allows you to read/write data immediately).
4. Click **Next** and **Enable**.

#### Step 2c: Update Your Code
1. Open the file `src/firebase.js` in your code editor.
2. Replace the `firebaseConfig` variables with the ones you copied from Step 2a.

```javascript
const firebaseConfig = {
  apiKey: "YOUR_REAL_API_KEY",
  authDomain: "YOUR_REAL_AUTH_DOMAIN",
  projectId: "YOUR_REAL_PROJECT_ID",
  storageBucket: "YOUR_REAL_STORAGE_BUCKET",
  messagingSenderId: "YOUR_REAL_MESSAGING_SENDER_ID",
  appId: "YOUR_REAL_APP_ID"
};
```
3. Restart your development server (`npm run dev`) and test adding a customer. The data will now save to the cloud!

## Deployment (How to run on mobile or web)

To make this app accessible anywhere (on your mobile phone or any computer), you should host it online.

The easiest way to host a Vite React app is using **Vercel** or **Netlify**.

### Deploying to Vercel (Free)
1. Go to [Vercel.com](https://vercel.com/) and sign up using your GitHub account.
2. Push this project code to a GitHub repository.
3. In Vercel, click **"Add New"** -> **"Project"**.
4. Import your GitHub repository.
5. Vercel will automatically detect that it's a Vite React app. Click **Deploy**.
6. Once deployed, Vercel will give you a live URL (e.g., `https://natvarnand-app.vercel.app`).
7. You can now open this URL on your mobile phone or computer to use the app!
