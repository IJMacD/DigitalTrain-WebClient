/**
 * once         ---->       FlowBlock
 *                          top level
 *                          "Once"
 * 
 * forever      ---->       FlowBlock
 *                          top level
 *                          "Forever"
 * 
 * loop         ---->       FlowBlock
 *                          "Loop" <input> "times"
 * 
 * loco-set     ---->       StatementBlock
 *                          [ CONTENT ]
 * 
 * log          ---->       StatementBlock
 *                          <input>
 * 
 * alert        ---->       StatementBlock
 *                          <input>
 * 
 */
import React from 'react';
import FlowBlock from './FlowBlock';
import StatementBlock from './StatementBlock';

 /**
  * 
  * @param {Block} block 
  * @returns {React.ReactElement}
  */
 export default function factory (block, updateBlock) {
    // const BLOCK_MAP = {
    //     forever: FlowBlock,
    //     once: FlowBlock,
    //     loop: FlowBlock,
    //     statement: StatementBlock,
    // };

    // const bProto = BLOCK_MAP[block.type]
    // if (bProto) {
    //     return React.createElement(bProto, {
    //         key: block.id,
    //         block,
    //     });
    // }

    if (block.type === "once") {
        return <FlowBlock 
                content="Once"
                snapPoints={[{ type: "inner", top: 88, left: 29 }]}
                topLevel={true}
        />;
    }

    if (block.type === "forever") {
        return <FlowBlock 
                content="Forever"
                snapPoints={[{ type: "inner", top: 88, left: 29 }]}
                topLevel={true}
        />;
    }

    if (block.type === "loop") {
        return <LoopBlock
                snapPoints={[{ type: "inner", top: 88, left: 29 },{ type: "append", bottom: 0 }]}
        />;
    }

    if (block.type === "log") {
        return <StatementBlock 
                content={<div>Log ({block.value})</div>}
                snapPoints={[{ type: "append", bottom: 0 }]}
        />;
    }

    if (block.type === "alert") {
        return <StatementBlock 
                content={<div>Alert ({block.value})</div>}
                snapPoints={[{ type: "append", bottom: 0 }]}
        />;
    }

    if (block.type === "sleep") {
        return <SleepBlock block={block} updateBlock={updateBlock} snapPoints={[{ type: "append", bottom: 0 }]} />;
    }

    if (block.type === "wait") { 
        return <WaitBlock block={block} updateBlock={updateBlock}  snapPoints={[{ type: "append", bottom: 0 }]} />;
    }

    if (block.type === "if") { 
        return <IfBlock snapPoints={[{ type: "inner", top: 88, left: 29 },{ type: "append", bottom: 0 }]} />;
    }
}

function SleepBlock ({ block, updateBlock, ...restProps }) {
    const [ value, setValue ] = React.useState(block.value||1000)
    return (
        <StatementBlock 
            block={block}
            { ...restProps }
            content={<div>Sleep <input type="number" value={value} onChange={e => setValue(e.target.value)} onBlur={() => updateBlock(block, { value })} /></div>}
        />
    );
}

function WaitBlock ({ block, updateBlock, ...restProps }) {
    const [ condition, setCondition ] = React.useState(block.condition||"");
    return (
        <StatementBlock 
            color="green"
            content={<div>Wait until <input value={condition} onChange={e => setCondition(e.target.value)} onBlur={() => updateBlock(block, { condition })} /></div>}
            block={block}
            { ...restProps }
        />
    );
}

function LoopBlock ({ block, updateBlock, ...restProps }) {
    const [ count, setCount ] = React.useState(typeof block.count === "number" ? block.count : 1);
    return (
        <FlowBlock
            content={<div>Loop <input type="number" style={{width: 80}} value={count} onChange={e => setCount(e.target.value)} onBlur={() => updateBlock(block, { count: +count })} /> {count === 1 ? "time" : "times"}</div>}
            block={block}
            { ...restProps }
        />
    );
}

function IfBlock ({ block, updateBlock, ...restProps }) {
    const [ condition, setCondition ] = React.useState(block.condition||"")
    return (
        <FlowBlock
            content={<div>If <input value={condition} onChange={e => setCondition(e.target.value)} onBlur={() => updateBlock(block, { condition })} /></div>}
            block={block}
            { ...restProps }
        />
    );
}