import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import { OktaAuth, toRelativeUrl } from '@okta/okta-auth-js';
import { Security, LoginCallback, useOktaAuth } from '@okta/okta-react';
import { useNavigate, Routes, Route, Outlet, Link } from 'react-router-dom';
import axios from 'axios';
import './App.css';

const oktaDomain = "dev-57384933.okta.com";
const clientID = "0oaaxp7arqragUJCT5d7";
const oktaAuth = new OktaAuth({
  issuer: `https://${oktaDomain}/oauth2/default`,
  clientId: `${clientID}`,
  redirectUri: window.location.origin + '/login/callback'
});

function Home() {
  return (<div><p>Home.</p></div>);
}

interface Claims {
  sub: string | undefined
}

function Protected() {
  const { authState } = useOktaAuth();
  const [claims, setClaims] = useState<Claims>({ sub: undefined });

  useEffect(() => {
    async function whoami() {
      const response = await axios.get<Claims>("http://localhost:3001/api/whoami", { headers: { 'Authorization': `Bearer ${authState?.accessToken?.accessToken}` } });
      setClaims(response.data);
    }
    whoami();
  }, [authState]);

  return (<div>
    <p>Protected.
    </p>
    <p>{claims.sub}</p>
  </div>);
}

export const RequiredAuth: React.FC = () => {
  const { oktaAuth, authState } = useOktaAuth();
  const authStateDependency = !!authState;
  const isAuthenticated = authState?.isAuthenticated;

  useEffect(() => {
    if (!authStateDependency) {
      return;
    }

    if (!isAuthenticated) {
      const originalUri = toRelativeUrl(window.location.href, window.location.origin);
      oktaAuth.setOriginalUri(originalUri);
      oktaAuth.signInWithRedirect();
    }
  }, [oktaAuth, authStateDependency, isAuthenticated]);

  if (!authState || !authState?.isAuthenticated) {
    return (<Loading />);
  }

  return (<Outlet />);
}


const Loading: React.FC = () => {
  return (
    <h3 id='loading-icon'>Loading...</h3>
  );
};

function Footer() {
  const { authState, oktaAuth } = useOktaAuth();

  const handleLogin = () => oktaAuth.signInWithRedirect();
  const handleLogout = () => oktaAuth.signOut();

  return (
    <footer>
      <hr />
      {
        !authState || !authState.isAuthenticated ?
          (
            <>
              <p>Please log in</p>
              <button type="button" onClick={handleLogin}>Login</button>
            </>
          ) :
          (
            <>
              <p>You&apos;re logged in!</p>
              <button type="button" onClick={handleLogout}>Logout</button>
            </>
          )
      }
    </footer>
  );
}

function App(props: any) {

  const navigate = useNavigate();
  const restoreOriginalUri = (_oktaAuth: any, originalUri: string) => {
    navigate(toRelativeUrl(originalUri || '/', window.location.origin));
  };

  return (
    <Security oktaAuth={oktaAuth} restoreOriginalUri={restoreOriginalUri}>
      <Link id='home-nav-link' to='/'>Home</Link>
      <Link id='protected-nav-link' to='/protected'>Protected</Link>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='login/callback' element={<LoginCallback loadingElement={<Loading />} />} />
        <Route path='/protected' element={<RequiredAuth />}>
          <Route path='' element={<Protected />} />
        </Route>
      </Routes>
      <Footer />
    </Security>
  );
}

export default App;
