import logo from './logo.svg';
import './App.css';
import React from 'react';
import { Panel, PanelContainer, PanelGroup } from 'react-panels';

function Main() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

function App() {
  window.React1 = React;
  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <PanelContainer>
        <Panel><Main/></Panel>
        <PanelGroup orientation='vertical'>
          <Panel>
            <div style={{ backgroundColor: 'deepskyblue', color: 'white',
              height: '100%',
              display: 'flex', justifyContent: 'center', alignItems: 'center'
            }}>
              Hello world
            </div>
          </Panel>
          <Panel>
            <div style={{ backgroundColor: 'darkgreen', color: 'white',
              height: '100%',
              display: 'flex', justifyContent: 'center', alignItems: 'center'
            }}>
              Hello world
            </div>
          </Panel>
        </PanelGroup>
      </PanelContainer>
    </div>
  )
}

export default App;
