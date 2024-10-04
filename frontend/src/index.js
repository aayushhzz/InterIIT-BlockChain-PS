import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { Auth0Provider } from "@auth0/auth0-react";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Auth0Provider
      domain="dev-mi4dbc0zjxcib7p6.us.auth0.com"
      clientId="KuU3NQq83pEj6N5ylUv0gv2nOcbxFMF4"
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
