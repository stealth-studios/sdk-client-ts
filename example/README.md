<div align="center">
    <h1>Stealth SDK TypeScript Example</h1>
</div>

This is an example of how to use the Stealth Studios SDK in TypeScript.
It is used to create a simple Discord chatbot that responds to your messages and is capable of reacting to them if you ask it to.
It can optionally be expanded to support ROBLOX Data Stores through the Open Cloud API, but this has been left out in this example.

## Prerequisites

- Node.js (recommended v23 or above)
- Discord Bot Token
- Running Stealth backend (This example assumes you are running the Basic Framework)

## Installation

1. Clone the repository
2. Run `pnpm install` to install the dependencies
3. Create a `.env` file in the root of the project with the following variables:
    - `STEALTH_API_URL` - The URL of your Stealth backend
    - `STEALTH_API_KEY` - The API key of your Stealth backend
    - `DISCORD_BOT_TOKEN` - The token of your Discord bot
4. Run `pnpm run dev` to start the bot
5. Invite your bot to your server and start chatting with it!
