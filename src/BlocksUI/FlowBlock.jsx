import React from 'react';
import './FlowBlock.css';

export default function FlowBlock ({
    block,
    label=null,
    snapPoints=null,
    children=null,
    topLevel=false,
    highlight=false,
    highlightSnap=null,
    dragging=false,
}) {
    const position = block.position;

    /** @type {React.CSSProperties} */
    const style = {
        position: position ? "absolute" : "relative",
        left: position ? position.x : "initial",
        top: position ? position.y : "initial",
        marginLeft: position ? 0 : 30,
    };
    
    let highlightElement = null;
    if (highlight) {
        const snapPoint = snapPoints.find(p => p.type === highlightSnap);
        highlightElement = <div style={snapPoint} className="SnapPoint" />;
    }

    return (
        <div style={style}
            className={`FlowBlock ${topLevel?"FlowBlock-closed":""} ${highlight?"highlight-" + highlightSnap:""} ${dragging?"dragging":""}`}
            data-block-id={block.id}
        >
            <div style={{ position: "absolute", top: 20, left: 20 }}>
                {label}
            </div>
            { children }
            { highlightElement }
        </div>
    );
}