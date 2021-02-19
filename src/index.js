import React from 'react';
import ReactDOM from 'react-dom';
import { LoginBiometrico } from './components/LoginBiometrico';

import './styles.css';

// Upload to local seaweedFS instance
const uploadImage = async file => {
    const formData = new FormData();
    formData.append('file', file);

    // Connect to a seaweedfs instance
};

function App() {
    return (
        <div className="App">            
            <LoginBiometrico sendFile={uploadImage} />
        </div>
    );
}

const rootElement = document.getElementById('root');
ReactDOM.render(<App />, rootElement);