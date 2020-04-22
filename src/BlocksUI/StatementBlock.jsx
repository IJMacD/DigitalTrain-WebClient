import React from 'react';
import './StatementBlock.css';

export default function StatementBlock ({ block, content, highlight=false, highlightSnap=null, dragging=false, active=false, children=null }) {
    return (
        <div
            className={`StatementBlock ${highlight?"highlight":""} ${dragging?"dragging":""} ${active?"active":""}`}
            data-block-id={block.id}
        >
            <div className="StatementBlock-inner">{content}</div>
        </div>
    );
}