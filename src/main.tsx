import React from 'react'
import ReactDOM from 'react-dom/client'
import EnvironmentCheck from './EnvironmentCheck'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <EnvironmentCheck />
    </React.StrictMode>,
)
