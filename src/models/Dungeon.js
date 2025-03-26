export class Dungeon {
    constructor(width = 15, height = 15) {
        this.width = width;
        this.height = height;
        this.tileSize = 32;
        this.layout = this.generateLayout();
    }

    generateLayout() {
        // Simple dungeon layout: 0 = floor, 1 = wall
        const layout = [];
        for (let y = 0; y < this.height; y++) {
            const row = [];
            for (let x = 0; x < this.width; x++) {
                // Create walls around the edges
                if (x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1) {
                    row.push(1);
                } else {
                    // Add some random walls (15% chance instead of 20%)
                    row.push(Math.random() < 0.15 ? 1 : 0);
                }
            }
            layout.push(row);
        }
        return layout;
    }

    getTileAt(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return this.layout[y][x];
        }
        return 1; // Return wall for out of bounds
    }

    isWalkable(x, y) {
        return this.getTileAt(x, y) === 0;
    }

    getSize() {
        return {
            width: this.width * this.tileSize,
            height: this.height * this.tileSize
        };
    }
} 