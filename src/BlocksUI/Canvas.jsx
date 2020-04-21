import React from 'react';

export default function Canvas ({ 
    children=null,
    onSplit,
    setDraggingBlock,
    setPosition,
    setHover,
    setSnapType,
    getBlock,
    commitSnap,
    createElement,
}) {
    const [ dragging, setDragging ] = React.useState(null);
    /** @type {React.MutableRefObject<HTMLDivElement>} */
    const ref = React.useRef();
    
    /** @param {React.MouseEvent<HTMLDivElement, MouseEvent>|React.TouchEvent<HTMLDivElement, TouchEvent>} e */
    function onMouseDown (e) {
        if (e.target.localName === "input" || e.target.localName === "select") {
            return;
        }

        const block = findBlockTarget(e.target);
        if (block) {
            const id = block.dataset.blockId;
            const position = block.style;
            const ev = e.nativeEvent;
            setDragging({
                startX: ev instanceof TouchEvent ? ev.touches[0].clientX : ev.clientX,
                startY: ev instanceof TouchEvent ? ev.touches[0].clientY : ev.clientY,
                initX: Number.parseFloat(position.left),
                initY: Number.parseFloat(position.top),
                id,
            });
        }
    }
    /** @param {React.MouseEvent<HTMLDivElement>|React.TouchEvent<HTMLDivElement>} e */
    function onMouseMove (e) {
        if (dragging) {
            setDraggingBlock(dragging.id);

            const ev = e.nativeEvent;
            const currX = ev instanceof TouchEvent ? ev.touches[0].clientX : ev.clientX;
            const currY = ev instanceof TouchEvent ? ev.touches[0].clientY : ev.clientY;
            const target = findBlockTarget(ev.target);

            if (isNaN(dragging.initX)) {
                const canvasRect = ref.current.getBoundingClientRect();
                const rect = target.getBoundingClientRect();

                dragging.initX = rect.x - canvasRect.x;
                dragging.initY = rect.y - canvasRect.y;
            }

            const { topLevel } = createElement(getBlock(dragging.id)).props;

            if (!dragging.dummyID && !topLevel && onSplit) {
                const dummy = onSplit(dragging.id);
                setDragging({
                    ...dragging,
                    dummyID: dummy.id,
                });
                setPosition(dummy.id, { x: dragging.initX, y: dragging.initY });
            } else {
                const dX = currX - dragging.startX;
                const dY = currY - dragging.startY;
                setPosition(dragging.dummyID || dragging.id, { x: dragging.initX + dX, y: dragging.initY + dY });
            }

            const draggingBlock = getBlock(dragging.id);
            if (!draggingBlock) {
                console.log("Block not found? " + dragging.id);
                return;
            }

            // Let's reacreate to crab the data;
            const el = createElement(draggingBlock)

            const canSnap = !el.props.topLevel;

            if (canSnap) {
                const els = document.elementsFromPoint(currX, currY);
                const underBlockEl = els.filter(el => el.dataset.blockId !== dragging.id).find(el => el.dataset.blockId);
                if (underBlockEl instanceof HTMLElement) {
                    const underID = underBlockEl.dataset.blockId;
                    const targetBlock = getBlock(underID);
                    const tEl = createElement(targetBlock);
                    const snapPoints = resolveSnapPoints(underBlockEl, tEl.props.snapPoints);
                    if (!snapPoints || snapPoints.length === 0) {
                        setHover(null);
                    }
                    else if (snapPoints.length === 1) {
                        setHover(underID);
                        setSnapType(snapPoints[0].type);
                    } else {
                        let minVal = Number.MAX_VALUE;
                        let snapType = null;
                        snapPoints.forEach(p => {
                            const d = Math.abs(p.y - currY);
                            if (d < minVal) {
                                snapType = p.type;
                                minVal = d;
                            }
                        });
                        setHover(underID);
                        setSnapType(snapType);
                    }
                } else setHover(null);
            }
            else setHover(null);
        }
    }
    /** @param {React.MouseEvent<HTMLDivElement>|React.TouchEvent<HTMLDivElement>} e */
    function onMouseUp (e) {
        setDragging(null);
        setDraggingBlock(null);
        commitSnap();
    }

    return (
        <div
            ref={ref}
            style={{
                background: "#333",
                padding: 30,
                height: 600,
                position: "relative",
                touchAction: "none",
                overflow: "hidden",
                userSelect: "none",
            }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onTouchStart={onMouseDown}
            onTouchMove={onMouseMove}
            onTouchEnd={onMouseUp}
        >
            {children}
        </div>
    );
}

/**
 * 
 * @param {HTMLElement} element 
 * @returns {HTMLElement}
 */
function findBlockTarget (element) {
    if (element.dataset.blockId) return element;
    if (element.parentElement === document.body) return null;
    return findBlockTarget(element.parentElement);
}

// const SNAP_DEFS = {
//     "inner": { left: 29, top: 88 },
//     "append": { bottom: 0},
// };

/**
 * 
 * @param {HTMLElement} element 
 * @param {SnapPoint[]} snapPoints 
 * @returns {SnapPoint[]}
 */
function resolveSnapPoints (element, snapPoints) {
    if (!snapPoints) return [];
    
    const clientRect = element.getBoundingClientRect();
    return snapPoints.map(p => {
        const out = { type: p.type };
        if (typeof p.x === "number" || typeof p.left === "number") {
            out.x = (p.x || p.left) + clientRect.x;
            out.left = out.x;
        }
        if (typeof p.y === "number" || typeof p.top === "number") {
            out.y = (p.y || p.top) + clientRect.y;
            out.top = out.y;
        }
        if (typeof p.right === "number") {
            out.right = clientRect.right - p.right;
            if (typeof out.x !== "number") out.x = out.right;
        }
        if (typeof p.bottom === "number") {
            out.bottom = clientRect.bottom - p.bottom;
            if (typeof out.y !== "number") out.y = clientRect.y + clientRect.height - p.bottom;
        }
        return out;
    });
}