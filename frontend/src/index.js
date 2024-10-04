import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { Auth0Provider } from "@auth0/auth0-react";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Auth0Provider
      domain={process.env.REACT_APP_AUTH0_DOMAIN}  // Updated to use REACT_APP_ prefix
      clientId={process.env.REACT_APP_AUTH0_CLIENT_ID}  // Updated to use REACT_APP_ prefix
      authorizationParams={{
        redirect_uri: window.location.origin,
      }}
      cacheLocation="localstorage" // Store the tokens in local storage
      useRefreshTokens={true} // Enable refresh tokens
      useRefreshTokensFallback={true} // Fallback if needed
    >
      <App />
    </Auth0Provider>
  </React.StrictMode>
);
