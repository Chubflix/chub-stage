import {InitialData, ReactRunner} from '@chub-ai/stages-ts';
import { Stage } from './Stage';
import { TestRunner } from './TestRunner';

// Check the mode
const isStaging = import.meta.env.MODE === 'staging';
const isDev = import.meta.env.DEV && !isStaging;

/**
 * App component
 */
function App() {
    // In development (not staging), show the test runner
    if (isDev) {
        return <TestRunner />;
    }

    return <ReactRunner factory={(data:  InitialData<any, any, any, any>) => new Stage(data)} />;
}

export default App;
