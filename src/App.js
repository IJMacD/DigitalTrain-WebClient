import React from "react";
import DevicePage from "./DevicePage";
import BlocksPage from "./BlocksPage";
import TrackPage from "./TrackPage";

const API_ROOT = `http://rail_master:8080`;

export default () => {
  const [ devices, setDevices ] = React.useState([]);
  const [ page, setPage ] = React.useState("devices");
  
  async function fetchStatus () {
    const r = await fetch(API_ROOT + "/status");
    setDevices(await r.json());
  }

  function stopDevice (deviceName) {
    sendDeviceProp(deviceName, "stop", "stop");
  }

  function allStop () {
    for (const device of devices) {
      stopDevice(device.id);
    }
  }
  
  React.useEffect(() => {
    const intervalRef = setInterval(fetchStatus, 1000);

    return () => clearInterval(intervalRef);
  }, []);

  let pageElement;
  if (page === "devices") pageElement = <DevicePage devices={devices} sendDeviceProp={sendDeviceProp} />;
  if (page === "blocks") pageElement = <BlocksPage devices={devices} sendDeviceProp={sendDeviceProp} />;
  if (page === "track") pageElement = <TrackPage />;

  return (
    <>
      <button className="stop-btn" onClick={allStop}>STOP</button>
      <div style={{display:"flex"}}>
        <div style={{width: 200}}>
          <p className="App-pagelink" onClick={() => setPage("devices")}>Devices</p>
          <p className="App-pagelink" onClick={() => setPage("blocks")}>Blocks</p>
          <p className="App-pagelink" onClick={() => setPage("track")}>Track</p>
        </div>
        <div style={{flex:1,minWidth:200}}>{pageElement}</div>
      </div>  
    </>
  );
};

async function sendDeviceProp (deviceName, prop, value) {
    const body = new URLSearchParams();
    body.set("id", deviceName);
    body.set(prop, value);
    await fetch (API_ROOT + "/update", {
        method: "post",
        body,
    });
}
