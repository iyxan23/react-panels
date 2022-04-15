import logo from './logo.svg';
import './App.css';
import React, { useState } from 'react';
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

function PanelPlaceholder(props) {
  return (
    <div style={{ backgroundColor: 'deepskyblue', color: 'white',
      height: '100%',
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>Hello world {props.index}</div>
  );
}

function App() {
  let [panels, setPanels] = useState([
    <PanelPlaceholder />,
    <div style={{ backgroundColor: 'darkgreen', color: 'white',
      height: '100%',
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <button onClick={() => {
        setPanels((prevPanels) => {
          return [...prevPanels, <PanelPlaceholder index={panels.length + 1} />];
        })
      }}>Create a new panel</button>
    </div>
  ]);

  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <PanelContainer>
        <Panel><Main/></Panel>
        <PanelGroup orientation='vertical'>
          {panels.map((child, idx) => {
            return <Panel key={idx}>{child}</Panel>
          })}
        </PanelGroup>
      </PanelContainer>
    </div>
  )
}

export default App;
