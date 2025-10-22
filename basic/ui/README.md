# Compliance-Aware Data Concierge UI

A Next.js frontend for the Compliance-Aware Data Concierge system that provides a chat interface to interact with the workflow, visualize tool calls, and monitor compliance checks in real-time.

## Features

- 🔒 **Role-based Access Control** - Select user roles and emails to test different permission scenarios
- 💬 **Interactive Chat Interface** - Natural language queries with real-time responses
- 📊 **Workflow Visualization** - Step-by-step breakdown of workflow execution
- 🛠️ **Tool Call Monitoring** - Detailed view of permission checks, data fetches, and audit logs
- 📋 **Suggested Queries** - Pre-built examples for common use cases
- ⚡ **Real-time Updates** - Live status updates and error handling

## Quick Start

1. **Install dependencies**:
   ```bash
   cd ui
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Start the workflow server** (in another terminal):
   ```bash
   cd ..
   source .venv/bin/activate
   llamactl serve --port 4501
   ```

4. **Open your browser**:
   ```
   http://localhost:3000
   ```

## Usage

### Basic Chat Interface
- Enter your email and select your role from the dropdown
- Type natural language queries about employee data, policies, or system access
- The system will automatically format your request and process it through the workflow

### Example Queries
Try these sample queries to explore different features:

**HR Access (Allowed)**:
```
Show performance_summary for employee_id 101
Show directory information for all employees
```

**Manager Access (Limited)**:
```
Show salary for employee_id 102  // Will be denied
Show performance_summary for my direct reports
```

**System Administration**:
```
Whitelist IP address 192.168.1.100
Show audit logs for recent access attempts
```

### Workflow Visualization
Each response includes:
- **Workflow Steps**: Timeline view of execution phases
- **Tool Calls**: Detailed breakdown of function executions
  - `check_permissions`: Policy validation and access control
  - `fetch_data`: Database queries with filtering
  - `audit_log`: Compliance logging
- **Status Indicators**: Real-time execution status
- **Error Details**: Comprehensive error reporting with stack traces

### User Roles
The system supports these predefined roles:
- `HR` / `HR Manager` - Full access to employee data
- `Engineering Manager` - Limited to direct reports
- `Finance` / `CFO` - Access to financial reports
- `Engineer` - Basic directory access
- `Admin` / `CEO` - System administration

## Development

### Project Structure
```
ui/
├── src/
│   ├── app/                 # Next.js 13+ app directory
│   │   ├── globals.css      # Global styles with Tailwind
│   │   ├── layout.tsx       # Root layout component
│   │   └── page.tsx         # Main page
│   ├── components/          # React components
│   │   ├── ChatInterface.tsx       # Main chat UI
│   │   ├── WorkflowVisualization.tsx  # Step timeline
│   │   └── ToolCallsDisplay.tsx    # Tool execution details
│   ├── lib/
│   │   └── utils.ts         # API client and utilities
│   └── types/
│       └── workflow.ts      # TypeScript definitions
├── package.json
├── next.config.js           # Next.js configuration with API proxy
├── tailwind.config.js       # Tailwind CSS setup
└── tsconfig.json           # TypeScript configuration
```

### API Integration
The UI communicates with the workflow via:
- **Proxy Configuration**: `/api/*` routes proxy to `http://127.0.0.1:4501/*`
- **Workflow Endpoint**: `POST /api/deployments/basic/workflows/default/run`
- **Status Endpoint**: `GET /api/deployments/basic/workflows/default/runs/{id}`

### Customization
- **Styling**: Modify `src/app/globals.css` for custom themes
- **Components**: Extend components in `src/components/`
- **API Client**: Update `src/lib/utils.ts` for additional endpoints
- **Types**: Add new types in `src/types/workflow.ts`

## Environment Setup

Ensure the workflow server is running with:
```bash
# From the basic/ directory
source .venv/bin/activate
llamactl serve --port 4501
```

Required environment variables in `../.env`:
```bash
OPENAI_API_KEY=your_openai_api_key_here
WEAVIATE_URL=https://your-cluster.weaviate.network
WEAVIATE_API_KEY=your_weaviate_api_key_here
```

## Troubleshooting

### Common Issues

**API Connection Errors**:
- Ensure `llamactl serve` is running on port 4501
- Check that the workflow server is responding: `curl http://127.0.0.1:4501/health`

**Permission Denied Responses**:
- This is expected behavior! Try different user roles to test access control
- HR roles have broader access than Engineering or other departments

**Workflow Visualization Missing**:
- Tool calls are inferred from response content since the workflow doesn't expose detailed execution logs
- Consider enhancing the workflow to return structured debugging information

**Styling Issues**:
- Run `npm run build` to check for Tailwind compilation errors
- Ensure all CSS classes are properly imported

### Development Tips

1. **Real-time Development**: Both `npm run dev` and `llamactl serve` support hot reloading
2. **Network Tab**: Use browser dev tools to inspect API requests/responses
3. **Console Logs**: Check browser console for client-side errors
4. **Server Logs**: Monitor `llamactl serve` output for workflow errors

## Contributing

1. Follow the existing code structure and naming conventions
2. Add TypeScript types for new data structures
3. Include error handling for all API calls
4. Test with different user roles and edge cases
5. Update this README for new features

## License

This project is part of the Compliance-Aware Data Concierge system.