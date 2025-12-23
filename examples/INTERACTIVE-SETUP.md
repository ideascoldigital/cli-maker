# Interactive Config Setup

This example demonstrates the new interactive config setup feature that allows users to select and configure just one configuration option at a time.

## Features

- **Single Config Selection**: Choose one specific configuration to setup instead of going through all options
- **Visual Status Indicators**: See which configs are already set (✓) and which are not (○)
- **Current Value Display**: View existing configuration values before updating
- **Cancel Option**: Exit the setup process at any time

## Usage

### Setup All Configurations (Original Behavior)
```bash
node interactive-setup-example.js config
```

### Interactive Single Config Selection
```bash
node interactive-setup-example.js config --interactive
```

## Interactive Flow

When using `--interactive`, you'll see an interactive menu with arrow key navigation:

```
Available configuration options:

Use ↑/↓ arrows to navigate, Enter to select, or 'q' to cancel

 ▶ ✓ api_key - Your API key for external services (configured)
   ○ server_url - Server URL endpoint (not set)
   ✓ environment - Deployment environment (production)
   ○ debug_mode - Enable debug logging (not set)
   ○ user_email - Your email address (not set)
   Cancel

Selected: api_key
```

### Navigation Controls:
- **↑/↓ Arrow Keys**: Navigate up and down through options
- **Enter**: Select the highlighted option
- **q/Q**: Cancel and exit
- **Ctrl+C**: Force exit

## Configuration Types Supported

- **Password**: Secure input (hidden from terminal)
- **URL**: Validates URL format
- **Email**: Validates email format
- **List**: Select from predefined options
- **Boolean**: true/false values
- **Text**: Free text input

## Example Commands

1. **First time setup** (configure all):
   ```bash
   node interactive-setup-example.js config
   ```

2. **Update just the API key**:
   ```bash
   node interactive-setup-example.js config --interactive
   # Select option 1 (api_key)
   ```

3. **Change environment**:
   ```bash
   node interactive-setup-example.js config --interactive
   # Select option 3 (environment)
   ```

4. **Check current status**:
   ```bash
   node interactive-setup-example.js status
   ```

## Benefits

- **Faster Updates**: No need to go through all config options when you only want to change one
- **Better UX**: Clear visual feedback about what's configured and what isn't
- **Selective Configuration**: Configure only what you need, when you need it
- **Non-destructive**: Only updates the selected configuration, leaves others unchanged
