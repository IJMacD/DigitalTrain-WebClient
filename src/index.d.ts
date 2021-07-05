interface Block {
    id : string;
    type : string;
    label?: string;
    position?: {x: number, y: number};
    children?: Block[];
}

interface BlockComponent {
    component: React.FunctionComponent|string;
    props: any & { snapPoints: SnapPoint[]; topLevel: boolean; };
}

interface SnapPoint {
    type: string;
    x?: number;
    y?: number;
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
}