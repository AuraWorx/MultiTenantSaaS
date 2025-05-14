# Infrastructure Map Guide

## Overview

The Infrastructure Map is a powerful visualization tool that provides a comprehensive view of your organization's IT infrastructure. It places the AuraAI scanner at the center, showing connections to various infrastructure components across your environment. The map helps you understand relationships between different components and monitor your infrastructure inventory.

## Key Features

### Interactive Visualization
- **Central AuraAI Scanner**: The visualization places AuraAI at the center of your infrastructure map, representing its role in connecting and monitoring all components.
- **Draggable Nodes**: Each infrastructure item is represented as a node that can be dragged to customize the visualization layout.
- **Canvas Background**: The map features a dot-grid canvas background providing spatial context for infrastructure relationships.
- **Animated Connections**: Lines connecting components use subtle animations to represent data flow and relationships.

### Category Visualization
- **Color-Coded Categories**: Infrastructure items are color-coded by category:
  - **On-Premises (Blue)**: Physical infrastructure hosted within your organization
  - **Cloud (Purple)**: Cloud-based resources and services
  - **Source Control (Green)**: Code repositories and version control systems
  - **Other Categories (Gray)**: Miscellaneous infrastructure components
- **Category Counts**: Visual indicators show the count of items in each category, helping you understand your infrastructure distribution.

### User Interaction
- **Reset Layout Button**: Return the visualization to its default layout with a single click.
- **Hover Details**: Hover over any node to see its name and basic details.
- **Node Selection**: Click on a node to view detailed information about the infrastructure item.
- **Zoom and Pan**: Navigate the visualization by zooming in/out and panning across the canvas.

## Using the Infrastructure Map

### Accessing the Map
1. Navigate to the "Map" section in the main navigation.
2. Select "Infrastructure Map" from the submenu.

### Understanding the Visualization
- The AuraAI scanner appears at the center, represented by a pulsing node with the AuraAI logo.
- Connected nodes around it represent your infrastructure inventory items.
- Items are arranged in a radial pattern by default, with the distance from center roughly indicating the relationship proximity.
- Lines connecting the nodes represent relationships between components.

### Interacting with the Map
- **View Item Details**: Hover over any node to see its name and basic information in a tooltip.
- **Rearrange Layout**: Drag nodes to customize the visualization and better understand relationships.
- **Reset Layout**: Click the "Reset Layout" button to return to the default arrangement.
- **View Detailed Information**: Click on a node to open the detailed information panel for that infrastructure item.

### Analyzing Your Infrastructure
- Look for clusters of related infrastructure items.
- Identify gaps or imbalances in your infrastructure categories.
- Understand the connectivity between different components.
- Monitor the growth of your infrastructure inventory over time.

## Technical Details

### Data Source
The Infrastructure Map visualizes data from the `infra_inventory` table in the database, which includes:
- Name and description of infrastructure items
- Category classification (on-premises, cloud, source control, etc.)
- Location information
- Status indicators
- Creation and update timestamps
- Organization and owner relationships

### Visualization Engine
- The map uses a custom visualization engine with a physics-based layout system.
- Nodes are positioned using simulated forces that create natural clustering.
- Animations use requestAnimationFrame for smooth performance.
- The canvas background uses CSS grid patterns for the dot effect.

## Best Practices

### Layout Organization
- Group related items by dragging them closer together.
- Position critical infrastructure closer to the center.
- Use the spatial layout to represent logical or physical proximity.

### Regular Updates
- Keep your infrastructure inventory up-to-date to ensure the map remains accurate.
- Review the map periodically to identify changes in your infrastructure landscape.

### Presentation
- Use the Infrastructure Map in presentations to stakeholders to provide a visual overview of your IT environment.
- Take screenshots of interesting patterns or relationships for documentation.

## Troubleshooting

### Map Loading Issues
- Ensure your browser is up-to-date.
- Check your database connection if items aren't appearing.
- Try refreshing the page if the visualization doesn't load properly.

### Performance Considerations
- For large infrastructure inventories (100+ items), the visualization may take longer to load.
- Consider filtering your inventory by category if performance is affected.