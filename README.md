# f1tv-master-link-generator
Script to get authenticated F1TV session media URL from session slug & F1TV credentials.

## Project Requirements
* NodeJS (Latest)
* NPM Package Manager

## Dependency Installation
Clone this repository and run `npm install` to install all the project dependencies.

## Usage
To get authenticated URL:</br>
`node index.js get-auth-url [session_slug] [username/email] [password]`

Where:</br>
* `session_slug` is the slug for the session you want to get the authenticated link for.
* `username/email` is your F1TV Account Email Address.
* `password` is your F1TV Account Password.