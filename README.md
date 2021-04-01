# BoardgameToolkit

## Requirements

### nodejs and npm

The entire project is run in Node.js, and npm is the package manager which will download most dependencies for you. They can be found at:

https://nodejs.org/en/download/

Make certain `npm` ends up on your `PATH`.

### MongoDB

A working MongoDB instance is required for local testing. You can download it here if you wish to run it yourself:

https://www.mongodb.com/try/download/community

Or use their free cloud hosting tier:

https://www.mongodb.com/cloud/atlas

The self-hosted version should also ask if you wish to install MongoDB Compass, which lets you easily visualize the data stored in your instance. This is recommended and can also be download from here:

https://www.mongodb.com/cloud/atlas

### Heroku CLI

To make use of correct environment variables for local testing, use of the Heroku CLI is recommended. You can download and set it up here:

https://devcenter.heroku.com/articles/heroku-cli

Make certain to login, but it is not necesary to create a new project.

### Google ReCaptcha

A Google ReCaptcha v2 API key is required for local testing. If you are a standard collaborator with access to the Heroku project, you may access the official API key in the config vars section of the Heroku project's console. Otherwise, you may create a new API key here:

http://www.google.com/recaptcha/admin

### AWS S3

A working AWS S3 instance and bucket are required for local testing. If you are a standard collaborator, you should have an account and keys created for you already. Otherwise, you should follow this guide to set up your S3 instance and bucket:

https://devcenter.heroku.com/articles/s3-upload-node#prerequisites

## Performing first-time setup

After downloading/setting up all the above requirements, you should create a new Database in your MongoDB instance - naming it anything (for example `TestDB`). Then clone this repository, navigate to the root folder of the clone, and run `npm install` - this will download all of the rest of the dependencies.

### Logging in to your AWS account

The following users have an AWS account:

Name | Initial Password | Bucket Name
---- | ---------------- | -----------
Casey | `o$aV8j+ETJ0f*Qy` | `boardgame-toolkit-assets-local-casey`
Ryan | `GFlf6ocjyT*sJLs` | `boardgame-toolkit-assets-local-ryan`
Tyler |                 | `boardgame-toolkit-assets-local-tyler`

Login using the initial password (And your capitalised first name as a username) at https://574938411764.signin.aws.amazon.com/console. Use your bucket name when setting up your local testing environment variables. You should be able to view your bucket and the items in there after signing in.

### Setting up environment variables for local testing

The project uses several environment variables to hook into services. They need to be set up properly for the project to function locally when testing. If you installed the Heroku CLI as above, then you can create a `.env` file in the root directory of the project with `Key=Value` pairs for all of the environment variables, like such:

```
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET=
RECAPTCHA_SECRET=
MONGODB_URI=
```

Reference the following table to see what each variable does and how to set it:

Variable Name | Where to Find
------------- | -------------
AWS_ACCESS_KEY_ID | Login to your [AWS console](https://console.aws.amazon.com/iam/home#/security_credentials) and find your Access Keys
AWS_SECRET_ACCESS_KEY | In the same console, you can choose to create an access key. When you do this, you will be given the secret **once** and never again.
S3_BUCKET | The name of the bucket you would like to use.
RECAPTCHA_SECRET | In the old version, this was kept in `captcha_secret.json`, so you can just copy and paste it over to the new file. If you have the Heroku CLI, you can use the command `heroku config:get RECAPTCHA_SECRET -s`.
MONGODB_URI | The URI of whatever database you would like to use. If you installed it locally with the name `TestDB`, then it will be `mongodb://localhost/TestDB`

## Building the client

Running `npm run build` in the root folder will build the client and output it into `dist/`.

## Running the project locally

If you have installed the Heroku CLI and set up your environment variables with the `.env` file, you can run the project locally using `npm run local-start`. Otherwise, if you have setup your environment variables yourself, you can run the project with `npm run start`. If you have correctly setup you environment variables, you will not be met with any error messages about missing environment variables, and you should be told which S3 bucket you are using, what port the app is running on, which database you have connected to, and the status of the database connection. Then you should be able to access the project through your browser at `localhost:####`, where `####` is the port number it spits out

## Testing

The following tests should be run when you want to merge a branch:

### Register a new user

Attempt to register a new user on the `/register` page.

**Outcome**: You should see the new user appear in the database, and you should now be logged in as that user. You should be able to see the username in the top right corner next to the logout button.

### Attempt to register a user with a duplicate username and/or email address

Attempt to register a user, but use a username and email address which has already been used in the database.

**Outcome**: The form should not let you submit and the corresponding fields should list an error explaining that the username/email is already in use.

### Log out

After registering or logging in, log out. Then refresh the page.

**Outcome**: The user should be logged out and brought back to the login page. Their username should be gone from the top right and the logout button should be replaced with login/register. After refreshing the page, the user should still be logged out.

### Log in

While logged out, log in as an existing user. The refresh the page.

**Outcome**: The user should be logged in with their username at the top right, next to the logout button. They should be redirected to the home page (currently projects list). After refreshing, the user is still logged in with the previously discussed conditions.

### Create new project with thumbnail

While logged in, create a new project. Make certain to upload a thumbnail.

**Outcome**: The new project is created in the database and displayed in the user's project list, which the user is redirected to. The database shows a thumbnail url and going to the url in a browser displays the correct image.
