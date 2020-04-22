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
                label="Once"
                snapPoints={[{ type: "inner", top: 88, left: 29 }]}
                topLevel={true}
        />;
    }

    if (block.type === "forever") {
        return <FlowBlock 
                label="Forever"
                snapPoints={[{ type: "inner", top: 88, left: 29 }]}
                topLevel={true}
        />;
    }

    if (block.type === "loop") {
        return <FlowBlock 
                label={<div>Loop <span>{block.count}</span> times</div>}
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
}

function SleepBlock ({ block, updateBlock, ...restProps }) {
    const [ value, setValue ] = React.useState(block.value)
    return (
        <StatementBlock 
            block={block}
            { ...restProps }
            content={<div>Sleep <input type="number" value={value} onChange={e => setValue(e.target.value)} onBlur={() => updateBlock(block, { value })} /></div>}
        />
    );
}