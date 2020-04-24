import React from 'react';
import './StatementBlock.css';

export default function StatementBlock ({ block, content, color="blue", highlight=false, highlightSnap=null, dragging=false, active=false, children=null }) {
    return (
        <div
            className={classList(["StatementBlock", { color, highlight, dragging, active }])}
            data-block-id={block.id}
        >
            <div className="StatementBlock-inner">{content}</div>
        </div>
    );
}

function classList (classes) {
    const out = [];
    if (Array.isArray(classes)) {
        for (const c of classes) {
            if (typeof c === "string") {
                out.push(c);
            } else if (typeof c === "object") {
                for (const n in c) {
                    if (typeof c[n] === "boolean" && c[n]) out.push(n);
                    if (typeof c[n] === "string") out.push(c[n]);
                }
            }
        }
    }
    return out.join(" ");
}