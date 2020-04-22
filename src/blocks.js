export default async function execute (blocks, context={}, notify=null) {

    const startBlock = blocks.find(b => b.type === "once");
    const loopBlock = blocks.find(b => b.type === "forever");

    if (startBlock && startBlock.children && startBlock.children.length) {
        await runBlocks(startBlock.children);
    }

    if (loopBlock && loopBlock.children && loopBlock.children.length) {
        while (context.running) {
            await runBlocks(loopBlock.children);
            await sleep(1000 / 60); // Rate limit 60fps
        }
    }

    async function runBlocks (blocks) {
        for (const block of blocks) {
            if (notify instanceof Function) notify(block.id);
            await runBlock(block);
            if (notify instanceof Function) notify(null);
        }
    }

    async function runBlock (block) {
        if (context.getRunner) {
            const fn = context.getRunner(block);
            if (fn) return fn(block);
        }

        switch (block.type) {
            case "sleep": return sleep(block.value);
            case "log": return console.log(block.value);
            case "alert": return alert(block.value);
            case "loop": return runLoopBlock(block);
        }
        throw Error("Can't run block type " + block.type);
    }

    async function runLoopBlock (block) {
        if (block.children.length) {
            for (let i = 0; i < block.count; i++) {
                await runBlocks(block.children);
            }
        }
    }
}

function sleep (n) {
    return new Promise(r => setTimeout(r, n));
}