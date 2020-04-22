import React from 'react';
import Canvas from './Canvas';
import factory from './factory';

import './Diagram.css';

export default function Diagram ({ blocks, setBlocks, makeBlock=b => null, activeBlock=null }) {
    const [ hoverID, setHoverID ] = React.useState(null);
    const [ snapType, setSnapType ] = React.useState(null);
    const [ draggingID, setDraggingID ] = React.useState(null);

    function onSplit (id, x, y) {
        const dummyHead = checkDummyHead(blocks, id);
        if (dummyHead) return dummyHead;
        
        const [ newBlocks, list ] = extractBlocks(blocks, id);
        
        const dummyBlock = createDummy(x, y);
        dummyBlock.children = list;

        setBlocks([
            ...newBlocks,
            dummyBlock
        ]);

        return dummyBlock;
    }

    function setPosition (id, newPosition) {
        const block = blocks.find(block => block.id === id);
        if (block) {
            const newBlock = { ...block, position: newPosition };
            const newBlocks = [ ...blocks.filter(block => block.id !== id), newBlock ];
            setBlocks(newBlocks);
        }
    }

    function commitSnap () {
        if (hoverID) {
            if (hoverID === draggingID) {
                console.error(`Trying to snap ${hoverID} to itself`);
                return;
            }

            console.log(`Committing snap ${draggingID} -> ${hoverID}:${snapType}`);

            let newParent = null;
            let targetIndex = 0;
            const dummyHead = checkDummyHead(blocks, draggingID);
            const list = dummyHead.children;

            if (snapType === "inner") {
                newParent = findBlock(blocks, hoverID);
            } else if (snapType === "append") {
                newParent = findParentBlock(blocks, hoverID);
                targetIndex = newParent.children.findIndex(b => b.id === hoverID) + 1;
            }

            if (newParent) {
                if (!Array.isArray(newParent.children)) {
                    newParent.children = [];
                }

                newParent.children.splice(targetIndex, 0, ...list);

                // deleteBlock(setBlocks, blocks, dummyHead);
                setBlocks(blocks.filter(b => b !== dummyHead));
            }

            setHoverID(null);
        }
    }

    function addBlock (block) {
        if (typeof block !== "string") {
            block.id = generateID();
        }

        const el = createElement(block);

        if (el.topLevel) {
            setBlocks([
                ...blocks,
                block
            ]);
        } else {
            const dummy = createDummy(50, 50);
            dummy.children = [block];
            setBlocks([
                ...blocks,
                dummy
            ]);
        }

    }

    function updateBlock (block, newBlock) {
      // Not immutable
      Object.assign(block, newBlock);
      setBlocks(blocks);
    }

    function createElement (block) {
        return makeBlock(block) || factory(block, updateBlock);
    }
    
    /**
     * 
     * @param {Block} block 
     */
    function inflateBlock (block) {
        if (block.type === "dummy") {
            let props = {
                key: block.id,
                style: { position: "absolute", left: block.position.x, top: block.position.y }
            };

            return React.createElement("div", props, block.children.map(inflateBlock));
        }

        /** @type {React.ReactElement} */
        const blockElement = createElement(block);

        if (blockElement)  {
            const props = {
                key: block.id,
                block: block,
                highlight: block.id === hoverID,
                highlightSnap: snapType,
                dragging: block.id === draggingID,
                active: block.id === activeBlock,
            };
            
            return React.cloneElement(blockElement, props, block.children && block.children.map(inflateBlock));
        }

        return null;
    }

    return (
        <div className="Blocks-Diagram">
            <Canvas
                onSplit={onSplit}
                setPosition={setPosition}
                setHover={setHoverID}
                setSnapType={setSnapType}
                setDraggingBlock={setDraggingID}
                getBlock={id => findBlock(blocks, id)}
                commitSnap={commitSnap}
                createElement={createElement}
                height={1000}
                width={1000}
            >
            {
                blocks.map(inflateBlock)
            }
            </Canvas>
            <button onClick={() => addBlock({ type: "sleep", value: 1000 })}>Add Sleep</button>
            <button onClick={() => addBlock({ type: "loco-set" })}>Add Loco Set</button>
        </div>
    );
}

function findBlock (blocks, id) {
    for (const parent of blocks) {
        if (parent.id === id) {
            return parent;
        }

        if (parent.children && parent.children.length) {
            let block = parent.children.find(c => c.id === id);

            if (block) {
                return block;
            } 
            
            block = findBlock(parent.children, id);

            if (block) {
                return block;
            } 
        }
    }

    return null;
}

function findParentBlock (blocks, id) {
    for (const parent of blocks) {
        if (parent.id === id) {
            return null;
        }

        if (parent.children && parent.children.length) {
            let block = parent.children.find(c => c.id === id);

            if (block) {
                return parent;
            } 
            
            const p = findParentBlock(parent.children, id);

            if (p) {
                return p;
            } 
        }
    }

    return null;
}

/**
 * Modifies blocks to remove a list of elements starting with the specified ID
 * Returns that list 
 * @param {Block[]} originalBlocks 
 * @param {string} firstID 
 * @return {[Block[], Block[]]}
 */
function extractBlocks (originalBlocks, firstID) {
    let list = null;
    const blocks = originalBlocks.map(parent => {
        // If we've already found it then nothing to do
        if (list) {
            return parent;
        }

        if (parent.id === firstID) {
            throw Error("Block found at top level");
        }

        if (parent.children && parent.children.length) {
            const index = parent.children.findIndex(c => c.id === firstID);

            if (index > -1) {
                // We found the block in this list
                list = parent.children.slice(index);
                return { ...parent, children: parent.children.slice(0, index) };
            } else {
                try {
                    const sub = extractBlocks(parent.children, firstID);
                    if (sub[1]) {
                        list = sub[1];
                    }
                    return { ...parent, children: sub[0] };
                } catch (e) {}
                // Only throw at top level
            }
        }

        return parent;
    });

    if (list) {
        return [ blocks, list ];
    }

    
    throw Error("Couldn't find Block " + firstID);
}

function checkDummyHead (blocks, id) {
    for (const parent of blocks) {
        if (parent.type === "dummy" && parent.children && parent.children[0].id === id) {
            return parent;
        }
    }
    return false;
}

function deleteBlock (setBlocks, blocks, id) {
    // TODO: delete at arbritary depth
    setBlocks(blocks.filter(b => b.id !== id));
}


let LATEST_ID = 1;
function createDummy (x, y) {
    return {
        id: `DUMMY_${LATEST_ID++}`,
        type: "dummy",
        position: { x, y },
    };
}

function generateID () {
    return Math.floor(Math.random() * 1e10).toString(36);
}