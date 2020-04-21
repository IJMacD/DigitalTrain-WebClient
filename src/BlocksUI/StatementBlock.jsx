import React from 'react';
import './StatementBlock.css';

export default function StatementBlock ({ block, content, highlight=false, highlightSnap=null, dragging=false, children=null }) {
    return (
        <div
            className={`StatementBlock ${highlight?"highlight":""} ${dragging?"dragging":""}`}
            data-block-id={block.id}
        >
            <div className="StatementBlock-inner">{content}</div>
        </div>
    );
}