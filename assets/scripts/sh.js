class SchellingModel {
    constructor(width, height, params) {
        this.width = width;
        this.height = height;
        this.params = params;
        
        // Initialize grid
        this.grid = new Array(width * height).fill(-1); // -1 for empty, 0 for group 1, 1 for group 2
        this.emptySpots = [];
        
        // Initialize agents
        const totalCells = width * height;
        const numAgents = Math.floor(totalCells * params.density);
        
        // First mark all spots as empty
        for(let i = 0; i < totalCells; i++) {
            this.emptySpots.push(i);
        }
        
        // Place agents randomly
        for(let i = 0; i < numAgents; i++) {
            const randomEmptyIndex = Math.floor(Math.random() * this.emptySpots.length);
            const position = this.emptySpots[randomEmptyIndex];
            this.emptySpots.splice(randomEmptyIndex, 1);
            
            // Assign random group (0 or 1)
            this.grid[position] = Math.floor(Math.random() * 2);
        }
    }
    
    getNeighbors(index) {
        const x = index % this.width;
        const y = Math.floor(index / this.width);
        const neighbors = [];
        
        for(let dy = -1; dy <= 1; dy++) {
            for(let dx = -1; dx <= 1; dx++) {
                if(dx === 0 && dy === 0) continue;
                
                const newX = (x + dx + this.width) % this.width;
                const newY = (y + dy + this.height) % this.height;
                const newIndex = newY * this.width + newX;
                
                if(this.grid[newIndex] !== -1) {
                    neighbors.push(this.grid[newIndex]);
                }
            }
        }
        
        return neighbors;
    }
    
    isHappy(index) {
        if(this.grid[index] === -1) return true;
        
        const neighbors = this.getNeighbors(index);
        if(neighbors.length === 0) return true;
        
        const myGroup = this.grid[index];
        const similarNeighbors = neighbors.filter(n => n === myGroup).length;
        const similarity = similarNeighbors / neighbors.length;
        
        return similarity >= this.params.want_similar;
    }
    
    step() {
        const unhappyAgents = [];
        
        // Find unhappy agents
        for(let i = 0; i < this.grid.length; i++) {
            if(this.grid[i] !== -1 && !this.isHappy(i)) {
                unhappyAgents.push(i);
            }
        }
        
        // Randomly shuffle unhappy agents to avoid bias
        for(let i = unhappyAgents.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [unhappyAgents[i], unhappyAgents[j]] = [unhappyAgents[j], unhappyAgents[i]];
        }
        
        // Move unhappy agents
        for(const agentPos of unhappyAgents) {
            if(this.emptySpots.length === 0) break;
            
            // Choose random empty spot
            const randomEmptyIndex = Math.floor(Math.random() * this.emptySpots.length);
            const newPos = this.emptySpots[randomEmptyIndex];
            
            // Move agent
            const group = this.grid[agentPos];
            this.grid[agentPos] = -1;  // Old position becomes empty
            this.grid[newPos] = group;  // New position gets the agent
            
            // Update empty spots
            this.emptySpots[randomEmptyIndex] = agentPos;  // Replace the used empty spot with the old position
        }
        
        return unhappyAgents.length === 0;
    }
    
    getState() {
        return this.grid;
    }
    
    getSegregation() {
        let totalSimilarity = 0;
        let totalAgents = 0;
        
        for(let i = 0; i < this.grid.length; i++) {
            if(this.grid[i] !== -1) {
                const neighbors = this.getNeighbors(i);
                if(neighbors.length > 0) {
                    const myGroup = this.grid[i];
                    const similarNeighbors = neighbors.filter(n => n === myGroup).length;
                    totalSimilarity += similarNeighbors / neighbors.length;
                    totalAgents++;
                }
            }
        }
        
        return totalAgents > 0 ? totalSimilarity / totalAgents : 0;
    }
    
    getHappiness() {
        let happy = 0;
        let total = 0;
        
        for(let i = 0; i < this.grid.length; i++) {
            if(this.grid[i] !== -1) {
                total++;
                if(this.isHappy(i)) happy++;
            }
        }
        
        return total > 0 ? happy / total : 0;
    }
} 