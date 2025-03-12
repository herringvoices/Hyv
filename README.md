# Hyv
Hyv is live! Check it out at [https://hy-hyv.buzz](https://hy-hyv.buzz)
## Project Overview

When your Friday plans suddenly fall through and you're left wondering who’s available to hang out, Hyv comes to the rescue. This dynamic platform makes it effortless to connect with friends for last-minute get-togethers by showcasing real-time availability and simplifying event coordination.

Hyv is built to:
- **Display Availability:** Users can set "Windows" indicating when they're free, ensuring friends know exactly when to reach out.
- **View Shared Availability:** Compare your open windows to your friends’ schedules, quickly spotting overlapping times.
- **Manage Friend Networks:** Organize contacts into customizable categories and tag along trusted friends for quick invites.
- **Coordinate Hangouts:** Easily send and respond to hangout requests, making spontaneous meet-ups both seamless and fun.

With Hyv, transforming a dull, empty Friday into a lively social experience is just a tap away.

## Features

### User Authentication
- **Secure Login/Register:** JWT and HTTPS Cookie-based authentication using ASP.NET Identity for secure account creation and login.

### Friend Management
- **Friend Search:** Easily find and add new friends by username.
- **Manage Friends:** Organize your contacts with customizable friend categories and quickly add trusted friends as Tagalongs.

### Availability Windows
- **Create Windows:** Clearly communicate your available times, preferred activities, and notice requirements.
- **Drag-and-Drop Presets:** Quickly set up availability windows by dragging saved presets directly onto your calendar.
- **Visibility Control:** Precisely manage who sees your availability using your friend categories.

### Hangout Coordination
- **Request and Manage Hangouts:** Effortlessly send, receive, approve, or reject hangout requests.
- **Join Existing Hangouts:** View ongoing hangouts on the calendar and click to request joining.
- **Open Hangouts:** Allow your hangouts to be open for friends to request to join.

### Calendar Integration
- **Interactive Calendar:** Intuitively manage your windows, presets, and hangouts directly through a user-friendly calendar interface, including drag-and-drop preset functionality and easy scheduling adjustments.

### Secure Authentication
- **Robust Security:** Authentication powered by JWT tokens and secure HTTPS Cookies, integrated seamlessly with ASP.NET Identity.

## Tech Stack

### Backend

- **ASP.NET Core Web API:** Handles backend logic and RESTful API operations.
- **Entity Framework Core:** ORM for streamlined database interactions.
- **PostgreSQL:** Cloud-hosted database for reliable data management.
- **ASP.NET Identity:** User authentication and management.
- **JWT and HTTPS Cookies:** Secure session handling and authentication.
- **Cloudinary:** Cloud-based media storage solution for images and media.

### Frontend

- **React (with Vite):** Fast and dynamic frontend application.
- **React Router:** SPA routing and navigation.
- **Tailwind CSS:** Utility-first CSS framework for rapid UI styling.
- **Radix UI:** Accessible and customizable UI components.
- **FullCalendar (Core, Daygrid, Interaction):** Feature-rich calendar with interactive drag-and-drop capabilities.
- **FontAwesome React:** Integrated iconography.
- **Framer Motion:** Animations for dynamic UI interactions.
- **Fetch API:** Simplified data fetching and API interactions.

### Infrastructure & Deployment

- **Azure App Service:** Hosting the ASP.NET Core backend.
- **Azure Database for PostgreSQL:** Reliable managed PostgreSQL database.
- **Azure Static Web Apps:** Deploying and hosting the React frontend.
- **Cloudinary:** Cloud-hosted image and media management.
- **GitHub Actions:** Automated deployment through CI/CD pipelines.

## Local Development Setup

Follow these steps to set up Hyv locally for development and contribution:

### Prerequisites
- [.NET 8 SDK](https://dotnet.microsoft.com/en-us/download/dotnet/8.0)
- [Node.js (LTS)](https://nodejs.org/en/download/)
- [PostgreSQL](https://www.postgresql.org/download/)

### PostgreSQL Setup

1. **Install PostgreSQL:**
   - Follow instructions specific to your OS from the [official PostgreSQL website](https://www.postgresql.org/download/).

2. **Create Database and User:**
   - Open your terminal or command prompt and access PostgreSQL:
     ```bash
     psql -U postgres
     ```
   - Run these commands to create a database and user (replace placeholders accordingly):
     ```sql
     CREATE DATABASE your_database_name;
     CREATE USER your_postgres_username WITH ENCRYPTED PASSWORD 'your_postgres_password';
     GRANT ALL PRIVILEGES ON DATABASE your_database_name TO your_postgres_username;
     ```

### Backend Setup

1. **Clone the repository:**
   ```bash
   git clone <your-repo-link>
   cd Hyv/api
   ```

2. **Restore dependencies:**
   ```bash
   dotnet restore
   ```

3. **Configure Environment Variables:**
   - Create `.env` file in the backend directory (`Hyv/api`).
   - Add the following:
     ```env
     # Local PostgreSQL Information
     POSTGRES_HOST=localhost
     POSTGRES_DB=your_database_name
     POSTGRES_USER=your_postgres_username
     POSTGRES_PASSWORD=your_postgres_password
     POSTGRES_SSL_MODE=Disable

     JWT_SECRET=your_jwt_secret
     ```

4. **Database Migration:**
   ```bash
   dotnet ef database update
   ```

5. **Run the backend:**
   ```bash
   dotnet run
   ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd ../client
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   - Create `.env` file in the frontend directory.
   - Add your backend API URL:
     ```env
     VITE_API_URL=http://localhost:5000
     ```

4. **Start the frontend application:**
   ```bash
   npm run dev
   ```

The application should now be running locally and accessible via your browser at `http://localhost:5173`.

## API Documentation

### Authentication (`/api/Auth`)

- **POST `/api/Auth/login`:** Authenticate user.
  - **Body:** `LoginDto` (username, password)
  - **Returns:** JWT token and user details on success.
- **POST `/api/Auth/register`:** Register a new user.
  - **Body:** `RegisterDto` (username, email, password, etc.)
  - **Returns:** Newly created user details.

### Users (`/api/User`)

- **GET `/api/User/{id}`:** Retrieve user details by ID.
  - **Returns:** User details.
- **GET `/api/User`:** Search users.
  - Parameters: `query` (optional, string), `friends` (optional, boolean), `nonFriends` (optional, boolean), `categoryId` (optional, int)
  - **Returns:** List of users matching criteria.
- **DELETE `/api/User/delete-all`:** Delete all users (admin only).
  - **Returns:** Confirmation message.

### Friends (`/api/Friend`)

- **GET `/api/Friend`:** Retrieve friends.
  - Parameters: `search` (optional, string)
  - **Returns:** List of friends.
- **DELETE `/api/Friend/{friendId}`:** Remove friend.
  - **Returns:** Confirmation message.
- **POST `/api/Friend/{userIdToBlock}/block`:** Block a user.
  - **Returns:** Confirmation message.

### Friend Requests (`/api/FriendRequest`)

- **POST `/api/FriendRequest`:** Send friend request.
  - Body: `RecipientId` (string)
  - **Returns:** Confirmation message.
- **GET `/api/FriendRequest/pending`:** Get pending friend requests.
  - Parameters: `userIsSender` (optional, boolean)
  - **Returns:** List of pending friend requests.
- **DELETE `/api/FriendRequest/all`:** Delete all friend requests.
  - **Returns:** Confirmation message.
- **POST `/api/FriendRequest/{requestId}/respond`:** Respond to a friend request.
  - Parameters: `accepted` (boolean)
  - **Returns:** Confirmation message.

### Friendship Categories (`/api/FriendshipCategory`)

- **POST `/api/FriendshipCategory`:** Create category.
  - Parameters: `name` (string)
  - **Returns:** Confirmation message.
- **GET `/api/FriendshipCategory`:** Retrieve categories.
  - **Returns:** List of categories.
- **PUT `/api/FriendshipCategory/{id}`:** Update category.
  - Parameters: `name` (string)
  - **Returns:** Confirmation message.
- **DELETE `/api/FriendshipCategory/{id}`:** Delete category.
  - **Returns:** Confirmation message.

### Category Members (`/api/CategoryMember`)

- **POST `/api/CategoryMember`:** Add user to category.
  - Parameters: `categoryId` (int), `friendId` (string)
  - **Returns:** Confirmation message.
- **DELETE `/api/CategoryMember`:** Remove user from category.
  - Parameters: `categoryId` (int), `friendId` (string)
  - **Returns:** Confirmation message.

### Tagalongs (`/api/Tagalong`)

- **POST `/api/Tagalong`:** Send tagalong request.
  - Body: `RecipientId` (string)
  - **Returns:** Confirmation message.
- **GET `/api/Tagalong/pending`:** Retrieve pending requests.
  - Parameters: `userIsSender` (optional, boolean)
  - **Returns:** List of pending tagalong requests.
- **POST `/api/Tagalong/{requestId}/respond`:** Respond to tagalong request.
  - Parameters: `accepted` (boolean)
  - **Returns:** Confirmation message.
- **DELETE `/api/Tagalong/{tagalongId}`:** Remove specific tagalong.
  - **Returns:** Confirmation message.

### Hangouts (`/api/Hangout`)

- **POST `/api/Hangout/request`:** Create hangout request.
  - Body: `HangoutRequestCreateDto`
  - **Returns:** Newly created hangout request.
- **GET `/api/Hangout/pending-requests`:** Get pending requests.
  - **Returns:** List of pending hangout requests.
- **POST `/api/Hangout/request/recipient/{id}/accept`:** Accept request.
  - Parameters: `newWindow` (optional, boolean)
  - **Returns:** Updated hangout details.
- **POST `/api/Hangout/request/recipient/{id}/reject`:** Reject request.
  - **Returns:** Confirmation message.
- **POST `/api/Hangout/{hangoutId}/join-request`:** Send join request.
  - **Returns:** Confirmation message.
- **POST `/api/Hangout/join-request/{joinRequestId}/accept`:** Accept join request.
  - Parameters: `newWindow` (optional, boolean)
  - **Returns:** Confirmation message.
- **POST `/api/Hangout/join-request/{joinRequestId}/reject`:** Reject join request.
  - **Returns:** Confirmation message.
- **DELETE `/api/Hangout/{hangoutId}/leave`:** Leave hangout.
  - **Returns:** Confirmation message.
- **DELETE `/api/Hangout/{hangoutId}`:** Delete hangout.
  - **Returns:** Confirmation message.
- **GET `/api/Hangout`:** Retrieve hangouts within date range.
  - Parameters: `start` (DateTime), `end` (DateTime)
  - **Returns:** List of hangouts.
- **GET `/api/Hangout/past`:** Get past hangouts.
  - **Returns:** List of past hangouts.
- **GET `/api/Hangout/upcoming`:** Get upcoming hangouts.
  - **Returns:** List of upcoming hangouts.

### Presets (`/api/Preset`)

- **POST `/api/Preset`:** Create preset.
  - Body: `PresetDto`
  - **Returns:** Newly created preset.
- **GET `/api/Preset`:** Retrieve user's presets.
  - **Returns:** List of presets.
- **GET `/api/Preset/{id}`:** Retrieve preset by ID.
  - **Returns:** Preset details.
- **PUT `/api/Preset/{id}`:** Update preset.
  - Body: `PresetDto`
  - **Returns:** Updated preset.
- **DELETE `/api/Preset/{id}`:** Delete preset.
  - **Returns:** Confirmation message.
- **DELETE `/api/Preset/all`:** Delete all presets.
  - **Returns:** Confirmation message.

### Windows (`/api/Window`)

- **POST `/api/Window`:** Create availability window.
  - Body: `WindowDto`
  - **Returns:** Newly created window.
- **GET `/api/Window`:** Retrieve user's windows.
  - Parameters: `start` (DateTime), `end` (DateTime)
  - **Returns:** List of windows.
- **GET `/api/Window/hive`:** Retrieve friends' windows.
  - Parameters: `start` (optional, DateTime), `end` (optional, DateTime), `categoryId` (optional, int)
  - **Returns:** List of hive windows.
- **PUT `/api/Window/{id}`:** Update window.
  - Body: `WindowDto`
  - **Returns:** Updated window.
- **DELETE `/api/Window/{id}`:** Delete window.
  - **Returns:** Confirmation message.

### Notifications (`/api/Notification`)

- **GET `/api/Notification/pending-counts`:** Retrieve counts of pending notifications.
  - **Returns:** Counts of notifications.