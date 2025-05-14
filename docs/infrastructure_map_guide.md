# Infrastructure Map Guide

The Infrastructure Map is a feature that allows you to visualize your organization's IT infrastructure inventory and how different components connect to the AuraAI Scanner system.

## Overview

The Infrastructure Map provides a visual representation of your IT infrastructure, including:

- On-premises servers and databases
- Cloud resources
- Source control repositories 
- Other IT assets

Each item is represented as a node in a network graph, with the AuraAI Scanner at the center connecting to all inventory items.

## Features

### Interactive Visualization

The Infrastructure Map provides a fully interactive visualization with these capabilities:

- **Draggable Nodes**: Click and drag any node to rearrange the layout.
- **Reset Layout**: Return to the original circular arrangement.
- **Visual Feedback**: Animation effects show connections between components.
- **Node Categories**: Color-coding helps distinguish between different types of infrastructure.

### Infrastructure Categories

The map segments your infrastructure into categories:

| Category | Description | Color Scheme |
|----------|-------------|--------------|
| On-premises | Physical servers, databases, and hardware you manage locally | Amber/Yellow |
| Cloud | Virtual machines, containers, and services hosted in cloud environments | Blue |
| Source Control | Code repositories and version control systems | Purple |

### Count Indicators

Each node displays a count of assets in that category, giving you a quick overview of your infrastructure distribution.

## Getting Started

### Access the Infrastructure Map

1. Log in to your AuraAI account
2. Navigate to the "Map" section from the main navigation
3. Select the "Visualize" tab

### Initial Setup

If no infrastructure data exists yet, you'll see a prompt to create sample data. Click "Create Sample Data" to populate the visualization with demonstration data.

### Using the Map

- **View Infrastructure Details**: Hover over nodes to see detailed information.
- **Rearrange Layout**: Drag nodes to customize the visualization.
- **Reset Position**: Use the "Reset Layout" button to return to the default arrangement.

## Technical Implementation

The Infrastructure Map is implemented using:

- SVG for vector graphics
- DOM manipulation for interactive elements
- React for state management
- Drizzle ORM for data persistence

## Database Structure

The infrastructure inventory is stored in the `infra_inventory` table with these key fields:

- `id`: Unique identifier
- `label`: Display name
- `category`: Type of infrastructure (onprem, cloud, sourcecontrol)
- `provider`: Service provider name
- `count`: Number of assets in this category
- `icon`: Icon identifier for visual representation
- `organizationId`: Organization that owns this infrastructure
- `createdById`: User who created the inventory item

## Future Enhancements

Planned enhancements for the Infrastructure Map include:

- **Deeper Integration**: Connect infrastructure items to risk assessment
- **Detailed Drill-down**: Click on nodes to see detailed asset listings
- **Custom Grouping**: Arrange nodes by custom categories
- **Relationship Mapping**: Show direct connections between infrastructure items
- **Export Options**: Save map as image or PDF for documentation

## Support

For any questions about the Infrastructure Map feature, please contact support at support@auraai.example.com.