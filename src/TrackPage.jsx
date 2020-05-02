import React from 'react';

const BLOCKS_URL = "http://rail_master:8080/track";

export default function TrackPage () {
    const [ blocks, setBlocks ] = React.useState([]);

    React.useEffect(() => {
        fetch(BLOCKS_URL).then(async r => {
            const { blocks } = await r.json();
            setBlocks(blocks);
        });
    }, []);

    return (
        <svg viewBox="0 0 1221 918">
            <g>
                {
                    blocks.map(block => {
                        let strokeColour;
                        if (block.links.length === 1) {
                            // Siding
                            strokeColour = "#eeee00";
                        } else if (block.links.length === 2) {
                            // Track
                            strokeColour = "#f00";
                        } else if (block.links.length === 3) {
                            // Points
                            strokeColour = "#00f";
                        }
                        return (
                        <>
                        {
                            block.segments.map(segment => <path key={segment.id} d={segment.path} stroke={strokeColour} strokeWidth="4" fill="none" />)
                        }                            
                        </>
                        );
                    })
                }
            </g>
        </svg>
    );
}