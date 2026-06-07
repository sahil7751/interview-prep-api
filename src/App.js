import { useEffect, useState } from 'react';
import API from './api/axios';

function App() {

    const [status, setStatus] = useState('Checking...');

    useEffect(() => {

        API.get('/health')
            .then(res => setStatus(res.data))
            .catch(() => setStatus('Backend not reachable'));

    }, []);

    return (
        <div>
            <h1>Job Application Tracker</h1>
            <p>{status}</p>
        </div>
    );
}

export default App;

