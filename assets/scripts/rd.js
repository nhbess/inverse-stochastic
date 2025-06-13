class ReactionDiffusion {
    constructor(width, height, params) {
        this.width = width;
        this.height = height;
        this.params = params;
        this.padMode = params.padMode || 'circular'; // Add padding mode parameter
        
        // Initialize grids A and B
        this.A = new Float32Array(width * height).fill(1.0);
        this.B = new Float32Array(width * height).fill(0.0);
        
        // Laplacian kernel weights
        this.kernel = [0.05, 0.2, 0.05,
                      0.2, -1.0, 0.2,
                      0.05, 0.2, 0.05];
    }

    // Helper function for bilinear interpolation
    bilinearInterpolate(lowResGrid, lowWidth, lowHeight, highWidth, highHeight) {
        const result = new Float32Array(highWidth * highHeight);
        const scaleX = (lowWidth - 1) / (highWidth - 1);
        const scaleY = (lowHeight - 1) / (highHeight - 1);

        for (let y = 0; y < highHeight; y++) {
            for (let x = 0; x < highWidth; x++) {
                const gx = x * scaleX;
                const gy = y * scaleY;
                
                const gxi = Math.floor(gx);
                const gyi = Math.floor(gy);
                
                const wx = gx - gxi;
                const wy = gy - gyi;
                
                const gxi1 = Math.min(gxi + 1, lowWidth - 1);
                const gyi1 = Math.min(gyi + 1, lowHeight - 1);

                // Get values at corners
                const f00 = lowResGrid[gyi * lowWidth + gxi];
                const f10 = lowResGrid[gyi * lowWidth + gxi1];
                const f01 = lowResGrid[gyi1 * lowWidth + gxi];
                const f11 = lowResGrid[gyi1 * lowWidth + gxi1];

                // Bilinear interpolation
                const value = f00 * (1 - wx) * (1 - wy) +
                             f10 * wx * (1 - wy) +
                             f01 * (1 - wx) * wy +
                             f11 * wx * wy;

                result[y * highWidth + x] = value;
            }
        }
        return result;
    }

    initialize(seedType = 'random', seedRadius = 5) {
        // Reset grid A to 1.0
        this.A.fill(1.0);
        this.B.fill(0.0);

        const centerX = Math.floor(this.width / 2);
        const centerY = Math.floor(this.height / 2);

        switch(seedType) {
            case 'circle':
                for(let y = 0; y < this.height; y++) {
                    for(let x = 0; x < this.width; x++) {
                        const dx = x - centerX;
                        const dy = y - centerY;
                        if(dx * dx + dy * dy < seedRadius * seedRadius) {
                            this.B[y * this.width + x] = 1.0;
                        }
                    }
                }
                break;

            case 'triple':
                const spacing = Math.floor(this.width / 4);
                const centers = [spacing, 2 * spacing, 3 * spacing];
                for(let cx of centers) {
                    for(let y = 0; y < this.height; y++) {
                        for(let x = 0; x < this.width; x++) {
                            const dx = x - cx;
                            const dy = y - centerY;
                            if(dx * dx + dy * dy < seedRadius * seedRadius) {
                                this.B[y * this.width + x] = 1.0;
                            }
                        }
                    }
                }
                break;

            case 'random':
                const sensibility = 0.8;
                // Create lower resolution grid
                const lowResSize = Math.floor(Math.sqrt(Math.max(this.width, this.height)));
                const lowResGrid = new Float32Array(lowResSize * lowResSize);

                // Fill low resolution grid with random values
                for(let i = 0; i < lowResGrid.length; i++) {
                    lowResGrid[i] = Math.random() > sensibility ? 1.0 : 0.0;
                }

                // Upscale using bilinear interpolation
                this.B = this.bilinearInterpolate(
                    lowResGrid,
                    lowResSize,
                    lowResSize,
                    this.width,
                    this.height
                );
                break;

            case 'random_oval':
                const rx_ratio = 0.5 + Math.random();
                const ry_ratio = 0.5 + Math.random();
                const rx = seedRadius * rx_ratio;
                const ry = seedRadius * ry_ratio;
                
                for(let y = 0; y < this.height; y++) {
                    for(let x = 0; x < this.width; x++) {
                        const dx = x - centerX;
                        const dy = y - centerY;
                        if((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) < 1) {
                            this.B[y * this.width + x] = 1.0;
                        }
                    }
                }
                break;

            case 'random_rectangle':
                const width_ratio = 0.5 + Math.random();
                const height_ratio = 0.5 + Math.random();
                const half_width = Math.floor(seedRadius * width_ratio);
                const half_height = Math.floor(seedRadius * height_ratio);
                
                const y_min = Math.max(centerY - half_height, 0);
                const y_max = Math.min(centerY + half_height, this.height);
                const x_min = Math.max(centerX - half_width, 0);
                const x_max = Math.min(centerX + half_width, this.width);
                
                for(let y = y_min; y < y_max; y++) {
                    for(let x = x_min; x < x_max; x++) {
                        this.B[y * this.width + x] = 1.0;
                    }
                }
                break;

            case 'random_circle':
            case 'random_circle_small':
                const maxScale = seedType === 'random_circle' ? 5.0 : 2.0;
                const radius_scale = 1 + Math.random() * (maxScale - 1);
                const rand_radius = seedRadius * radius_scale;
                
                for(let y = 0; y < this.height; y++) {
                    for(let x = 0; x < this.width; x++) {
                        const dx = x - centerX;
                        const dy = y - centerY;
                        if(dx * dx + dy * dy < rand_radius * rand_radius) {
                            this.B[y * this.width + x] = 1.0;
                        }
                    }
                }
                break;

            case 'random_cross':
                const arm_length = seedRadius * 20;
                const arm_width = seedRadius * 0.2;
                const angle = Math.random() * Math.PI;
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);
                
                for(let y = 0; y < this.height; y++) {
                    for(let x = 0; x < this.width; x++) {
                        const dx = x - centerX;
                        const dy = y - centerY;
                        const x_rot = cos * dx + sin * dy;
                        const y_rot = -sin * dx + cos * dy;
                        
                        if((Math.abs(x_rot) < arm_width/2 && Math.abs(y_rot) < arm_length/2) ||
                           (Math.abs(y_rot) < arm_width/2 && Math.abs(x_rot) < arm_length/2)) {
                            this.B[y * this.width + x] = 1.0;
                        }
                    }
                }
                break;

            case 'random_stripes':
            case 'random_thin_stripes':
            case 'random_thick_stripes':
                const stripe_width = seedType === 'random_thin_stripes' ? seedRadius : seedRadius * 4;
                const stripe_angle = Math.random() * Math.PI * 2;
                const stripe_cos = Math.cos(stripe_angle);
                const stripe_sin = Math.sin(stripe_angle);
                
                for(let y = 0; y < this.height; y++) {
                    for(let x = 0; x < this.width; x++) {
                        const dx = x - centerX;
                        const dy = y - centerY;
                        const x_rot = stripe_cos * dx + stripe_sin * dy;
                        if((x_rot / stripe_width) % 2 < 1) {
                            this.B[y * this.width + x] = 1.0;
                        }
                    }
                }
                break;

            case 'random_triangle':
                const triangleScale = seedRadius * (0.5 + Math.random());
                const triangleAngle = Math.random() * Math.PI * 2;
                
                // Define equilateral triangle vertices
                const vertices = [
                    [0, -triangleScale],  // top
                    [-triangleScale * Math.sin(Math.PI / 3), triangleScale / 2],  // bottom left
                    [triangleScale * Math.sin(Math.PI / 3), triangleScale / 2]   // bottom right
                ];
                
                // Rotate vertices
                const triangleCos = Math.cos(triangleAngle);
                const triangleSin = Math.sin(triangleAngle);
                const rotatedVertices = vertices.map(([x, y]) => [
                    x * triangleCos - y * triangleSin + centerX,
                    x * triangleSin + y * triangleCos + centerY
                ]);
                
                // Helper function to check if a point is inside the triangle
                const isInside = (px, py) => {
                    const [x1, y1] = rotatedVertices[0];
                    const [x2, y2] = rotatedVertices[1];
                    const [x3, y3] = rotatedVertices[2];
                    
                    const d1 = this.sign(px, py, x1, y1, x2, y2);
                    const d2 = this.sign(px, py, x2, y2, x3, y3);
                    const d3 = this.sign(px, py, x3, y3, x1, y1);

                    const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
                    const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);

                    return !(hasNeg && hasPos);
                };
                
                // Fill the triangle
                for(let y = 0; y < this.height; y++) {
                    for(let x = 0; x < this.width; x++) {
                        if(isInside(x, y)) {
                            this.B[y * this.width + x] = 1.0;
                        }
                    }
                }
                break;

            case 'random_square':
                const squareScale = seedRadius * (0.5 + Math.random());
                const squareAngle = Math.random() * Math.PI * 2;
                
                // Define square vertices (centered at origin)
                const squareVertices = [
                    [-squareScale, -squareScale],  // top left
                    [squareScale, -squareScale],   // top right
                    [squareScale, squareScale],    // bottom right
                    [-squareScale, squareScale]    // bottom left
                ];
                
                // Rotate vertices
                const squareCos = Math.cos(squareAngle);
                const squareSin = Math.sin(squareAngle);
                const rotatedSquare = squareVertices.map(([x, y]) => [
                    x * squareCos - y * squareSin + centerX,
                    x * squareSin + y * squareCos + centerY
                ]);
                
                // Helper function to check if a point is inside the square
                const isInsideSquare = (px, py) => {
                    const [x1, y1] = rotatedSquare[0];
                    const [x2, y2] = rotatedSquare[1];
                    const [x3, y3] = rotatedSquare[2];
                    const [x4, y4] = rotatedSquare[3];
                    
                    // Check if point is on the same side of all edges
                    const d1 = this.sign(px, py, x1, y1, x2, y2);
                    const d2 = this.sign(px, py, x2, y2, x3, y3);
                    const d3 = this.sign(px, py, x3, y3, x4, y4);
                    const d4 = this.sign(px, py, x4, y4, x1, y1);

                    const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0) || (d4 < 0);
                    const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0) || (d4 > 0);

                    return !(hasNeg && hasPos);
                };
                
                // Fill the square
                for(let y = 0; y < this.height; y++) {
                    for(let x = 0; x < this.width; x++) {
                        if(isInsideSquare(x, y)) {
                            this.B[y * this.width + x] = 1.0;
                        }
                    }
                }
                break;
        }
    }

    // Add helper function for triangle point-in-polygon test
    sign(px, py, x1, y1, x2, y2) {
        return (px - x2) * (y1 - y2) - (x1 - x2) * (py - y2);
    }

    laplace(grid) {
        const result = new Float32Array(this.width * this.height);
        
        for(let y = 0; y < this.height; y++) {
            for(let x = 0; x < this.width; x++) {
                let sum = 0;
                
                for(let ky = -1; ky <= 1; ky++) {
                    for(let kx = -1; kx <= 1; kx++) {
                        let px, py;
                        
                        if (this.padMode === 'circular') {
                            // Circular padding (wrap around)
                            px = (x + kx + this.width) % this.width;
                            py = (y + ky + this.height) % this.height;
                        } else {
                            // Constant padding (clamp to edge)
                            px = Math.min(Math.max(x + kx, 0), this.width - 1);
                            py = Math.min(Math.max(y + ky, 0), this.height - 1);
                        }
                        
                        const kernelIdx = (ky + 1) * 3 + (kx + 1);
                        sum += grid[py * this.width + px] * this.kernel[kernelIdx];
                    }
                }
                
                result[y * this.width + x] = sum;
            }
        }
        
        return result;
    }

    step() {
        const lapA = this.laplace(this.A);
        const lapB = this.laplace(this.B);
        
        const nextA = new Float32Array(this.width * this.height);
        const nextB = new Float32Array(this.width * this.height);
        
        for(let i = 0; i < this.width * this.height; i++) {
            const a = this.A[i];
            const b = this.B[i];
            
            nextA[i] = a + (this.params.dA * lapA[i] - a * b * b + this.params.f * (1 - a));
            nextB[i] = b + (this.params.dB * lapB[i] + a * b * b - (this.params.k + this.params.f) * b);
            
            // Clamp values
            nextA[i] = Math.max(0, Math.min(1, nextA[i]));
            nextB[i] = Math.max(0, Math.min(1, nextB[i]));
        }
        
        this.A = nextA;
        this.B = nextB;
    }

    getBState() {
        return this.B;
    }
} 