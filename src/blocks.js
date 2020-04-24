export default async function execute (blocks, context={}) {

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
            if (context.running) {
                if (context.setActiveBlock instanceof Function) context.setActiveBlock(block.id);
                await runBlock(block);
                if (context.setActiveBlock instanceof Function) context.setActiveBlock(null);
            }
        }
    }

    async function runBlock (block) {
        if (context.getRunner) {
            const fn = context.getRunner(block);
            if (fn) return fn(block, context);
        }

        switch (block.type) {
            case "sleep": return sleep(block.value);
            case "log": return console.log(block.value);
            case "alert": return alert(block.value);
            case "loop": return runLoopBlock(block);
            case "wait": return runWaitBlock(block);
            case "if": return runIfBlock(block);
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

    async function runWaitBlock (block) {
        return new Promise(resolve => {
            const ast = parseCondition(block.condition);
            const interval = setInterval(() => {
                if (executeCondition(ast, context) || !context.running) {
                    clearInterval(interval);
                    resolve();
                }
            }, 1000 / 60); // 60 fps
        });
    }

    async function runIfBlock (block) {
        const ast = parseCondition(block.condition);
        if (executeCondition(ast, context)) {
            return runBlocks(block.children);
        }
    }
}

function sleep (n) {
    return new Promise(r => setTimeout(r, n));
}


/**
 * @typedef ASTNode
 * @prop {string} type
 * @prop {string} [operator]
 * @prop {string} [device]
 * @prop {string} [property]
 * @prop {string} [value]
 * @prop {ASTNode[]} [children]
 */

/**
 * 
 * @param {string} str 
 * @returns {ASTNode}
 */
function parseCondition (str) {
    const match = /([A-Z0-9]+):([a-z_]+)\s*(=|==|!=|>=|<=|>|<)\s*(\d+)/.exec(str);
  
    if (!match) {
      throw Error("Condition parse error");
    }
  
    const device = match[1];
    const property = match[2];
    const operator = match[3] === "==" ? "=" : match[3];
    const value = match[4];
  
    return {
      type: "condition",
      operator,
      children: [
        {
          type: "property",
          device,
          property
        },
        {
          type: "number",
          value
        },
      ]
    };
  }
  
  /**
   * 
   * @param {ASTNode} node 
   * @returns {boolean}
   */
  function executeCondition (node, context) {
    const d = context.devices.find(d => d.name === node.children[0].device);
    if (!d) throw Error("Couldn't find device " + node.children[0].device);
    const dv = +d[node.children[0].property];
    const v = +node.children[1].value;
    switch (node.operator) {
      case "=": return dv == v;
      case "!=": return dv != v;
      case "<": return dv < v;
      case ">": return dv > v;
      case "<=": return dv <= v;
      case ">=": return dv >= v;
    }
    throw Error("Operator " + node.operator + " not recognised");
  }