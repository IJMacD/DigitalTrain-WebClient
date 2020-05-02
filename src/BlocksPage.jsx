import React from 'react';
import Diagram from './BlocksUI/Diagram';
import execute from "./blocks";
import StatementBlock from "./BlocksUI/StatementBlock";
import fileDownload from 'js-file-download';

const SAVE_KEY = "digital-train-saved-blocks";


export default function BlocksPage ({ devices, sendDeviceProp }) {
    const [ blocks, setBlocks ] = useSavedState(SAVE_KEY, [ { id: "setup", type: "once" }, { id:"loop", type: "forever" } ]);
    const [ running, setRunning ] = React.useState(false);
    const [ activeBlock, setActiveBlock ] = React.useState(null);
    const context = React.useRef({ running: false, devices, getRunner, setActiveBlock });

    function getRunner (block) {
        if (block.type === "loco-set") {
          return block => sendDeviceProp(block.device, block.prop, block.value);
        }
    }

    function updateBlock (block, newBlock) {
      // Not immutable
      Object.assign(block, newBlock);
      setBlocks(blocks);
    }

    /**
     * 
     * @param {Block} block 
     * @returns {React.ReactElement}
     */
    function makeBlock (block) {
      if (block.type === "loco-set") {
        return <StatementBlock block={block} snapPoints={[{ type: "append", bottom: 0 }]} content={<LocoSetContent devices={devices} block={block} updateBlock={newBlock => updateBlock(block, newBlock)}  />} />;
      }
    }

    /**
     * 
     * @param {import("react").ChangeEvent<HTMLInputElement>} e 
     */
    function handleImport (e) {
      const fileReader = new FileReader();
      fileReader.addEventListener("load", f => {
        try {
          const blocks = JSON.parse(String(f.target.result));
          setBlocks(blocks);
        } catch (ex) {
          console.log("Error parsing imported file " + e.target.files[0].name);
        }
      });
      fileReader.readAsText(e.target.files[0]);
      e.target.value = "";
    }

    React.useEffect(() => {
      context.current.running = running;
      context.current.devices = devices;
    }, [running, devices]);
  
    React.useEffect(() => {
      running && execute(blocks, context.current);
    }, [running]);

    return (
        <div className="BlocksPage">
            <div className="BlocksPage-header">
                {
                    running ?
                    <button onClick={() => setRunning(false) }>Stop</button>
                    :
                    <button onClick={() => setRunning(true) }>Run</button>
                }
            <button onClick={() => fileDownload(JSON.stringify(blocks), `DigitalTrain-Blocks-${new Date().toISOString()}.json`)}>Export</button>
            <label>Import: <input type="file" onChange={handleImport} /></label>
          </div>
          <Diagram blocks={blocks} setBlocks={setBlocks} makeBlock={makeBlock} activeBlock={activeBlock} />
        </div>
    )
}

function LocoSetContent ({ block, devices, updateBlock }) {
  const [ prop, setProp ] = React.useState(block.prop||"");
  const [ value, setValue ] = React.useState(block.value||"");
  return (
    <div className="AppBlock-LocoSet-content">
      <p>Set Loco Property</p>
      <label><span>Device: </span><select value={block.device||""} onChange={e => updateBlock({ device: e.target.value })}><option />{devices.map(d => <option key={d.id} value={d.id}>{d.id}</option>)}</select></label>
      <label><span>Property: </span><input value={prop} onChange={e => setProp(e.target.value)} onBlur={() => updateBlock({ prop })}/></label>
      <label><span>Value: </span><input value={value} onChange={e => setValue(e.target.value)} onBlur={() => updateBlock({ value })}/></label>
    </div>
  );
}

function useSavedState(key, initialValue) {
    // State to store our value
    // Pass initial state function to useState so logic is only executed once
    const [storedValue, setStoredValue] = React.useState(() => {
      try {
        // Get from local storage by key
        const item = window.localStorage.getItem(key);
        // Parse stored json or if none return initialValue
        return item ? JSON.parse(item) : initialValue;
      } catch (error) {
        // If error also return initialValue
        console.log(error);
        return initialValue;
      }
    });
  
    // Return a wrapped version of useState's setter function that ...
    // ... persists the new value to localStorage.
    const setValue = value => {
      try {
        // Allow value to be a function so we have same API as useState
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        // Save state
        setStoredValue(valueToStore);
        // Save to local storage
        throttle(() => {
          const t = performance.now();
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
          console.log("Saving took " + (performance.now() - t) + " ms");
        }, 1000);
      } catch (error) {
        // A more advanced implementation would handle the error case
        console.log(error);
      }
    };
  
    return [storedValue, setValue];
  }
  
  // My own dodgy throttle implementation
  let throttling = false;
  function throttle (fn, t) {
    if (!throttling) {
      fn();
      throttling = true;
      setTimeout(() => throttling = false, t);
    }
  }
  
  // My own dodgy throttle implementation
  function useThrottle (fn, t) {
    const ref = React.useRef(false);
  
    return function run (...args) {
      if (!ref.current) {
        fn(...args);
        ref.current = true;
        setTimeout(() => ref.current = false, t);
      }
    }
  }
  