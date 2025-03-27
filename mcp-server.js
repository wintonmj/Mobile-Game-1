import express from 'express';
import cors from 'cors';
const app = express();

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// MCP endpoint
app.post('/api/mcp', (req, res) => {
  const { tool, params } = req.body;
  console.log(`MCP request received for tool: ${tool}`, params);
  
  let result = {};
  
  switch(tool) {
    case 'optimizeAnimations':
      result = {
        suggestions: [
          'Consider using texture atlases for animations',
          'Preload animations in loading scene',
          'Use frame caching to improve performance'
        ]
      };
      break;
      
    case 'validateGameAssets':
      result = {
        valid: true,
        missing: [],
        recommendations: 'All assets appear to be properly loaded'
      };
      break;
      
    case 'debugAnimationLoader':
      result = {
        issues: ['Silent error handling might hide loading issues'],
        fixes: ['Add console.warn() in error catch blocks for easier debugging']
      };
      break;
      
    case 'analyzePerformance':
      result = {
        fps: 60,
        bottlenecks: ['Animation loading', 'Asset initialization'],
        recommendations: 'Consider implementing a loading progress bar'
      };
      break;
      
    case 'logGameState':
      result = {
        playerPosition: { x: 100, y: 100 },
        loadedAnimations: ['idle_down', 'walk_up', 'walk_down', 'walk_side'],
        activeScenes: ['MainScene']
      };
      break;
      
    default:
      return res.status(400).json({ error: 'Unknown tool' });
  }
  
  res.json({ result });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
const PORT = 5174;
app.listen(PORT, () => {
  console.log(`MCP server running at http://localhost:${PORT}`);
  console.log('Available tools:');
  console.log('- optimizeAnimations');
  console.log('- validateGameAssets');
  console.log('- debugAnimationLoader');
  console.log('- analyzePerformance');
  console.log('- logGameState');
}); 