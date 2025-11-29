# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/869f6244-fef8-4967-a5e1-a3413f6607ef

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/869f6244-fef8-4967-a5e1-a3413f6607ef) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## Testing in Android Studio

This project includes Capacitor support, which allows you to test the app as a native Android application in Android Studio.

### Prerequisites

1. **Android Studio**: Download and install [Android Studio](https://developer.android.com/studio)
2. **Node.js & npm**: Make sure you have Node.js installed
3. **Android SDK**: Android Studio will guide you through SDK installation on first launch

### Steps to Test in Android Studio

1. **Install dependencies** (if not already done):
   ```sh
   npm install
   ```

2. **Build the web app and sync with Android**:
   ```sh
   npm run build:android
   ```

3. **Open the Android project in Android Studio**:
   ```sh
   npm run cap:android
   ```
   This will automatically open Android Studio with the Android project.

4. **Run the app**:
   - In Android Studio, wait for Gradle sync to complete
   - Select an emulator or connected device from the device dropdown
   - Click the "Run" button (green play icon) or press `Shift + F10`

### Development Workflow

When you make changes to your web code:

1. Make your changes in the `src/` directory
2. Rebuild and sync:
   ```sh
   npm run build:android
   ```
3. In Android Studio, click "Run" again to see your changes

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run build:android` | Build web app and sync to Android |
| `npm run cap:android` | Open project in Android Studio |
| `npm run cap:sync` | Sync web assets to all platforms |

### Troubleshooting

- **Gradle sync issues**: Try `File > Sync Project with Gradle Files` in Android Studio
- **Emulator not starting**: Ensure virtualization is enabled in BIOS and you have enough disk space
- **White screen**: Make sure you ran `npm run build:android` before opening in Android Studio

For more information, visit the [Capacitor documentation](https://capacitorjs.com/docs).

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Capacitor (for native Android/iOS support)

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/869f6244-fef8-4967-a5e1-a3413f6607ef) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
