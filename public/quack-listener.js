/**
 * Quack Listener Template
 * 
 * Add this to any Replit app to make it respond to approved Quack messages.
 * Provides both webhook mode (Orchestrate calls your endpoint directly) and
 * polling mode (your app checks Quack periodically for approved messages).
 * 
 * Usage:
 * 1. Copy this file to your project
 * 2. Configure MY_AGENT_NAME to match your agent's inbox
 * 3. Implement your custom executeTask() logic
 * 4. Add the /quack-webhook route to your Express app
 */

const QUACK_API = 'https://quack.us.com/api';
const MY_AGENT_NAME = 'replit'; // Change to your agent's inbox name

/**
 * Webhook handler - Orchestrate calls this when a user approves a task
 * Add this route to your Express app:
 *   app.post('/quack-webhook', quackWebhookHandler);
 */
async function quackWebhookHandler(req, res) {
  const { messageId, task, context, files, from } = req.body;
  
  console.log(`[QUACK] Received approved task from ${from}`);
  
  // Mark as in_progress
  await fetch(`${QUACK_API}/status/${messageId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'in_progress' })
  });
  
  try {
    // Execute the task (your custom logic here)
    const result = await executeTask(task, context, files);
    
    // Mark as completed
    await fetch(`${QUACK_API}/complete/${messageId}`, { method: 'POST' });
    
    // Reply to sender
    await fetch(`${QUACK_API}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        to: from, 
        from: MY_AGENT_NAME, 
        task: `✅ Completed: ${result}` 
      })
    });
    
    res.json({ success: true, result });
  } catch (error) {
    // Mark as failed
    await fetch(`${QUACK_API}/status/${messageId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'failed' })
    });
    
    // Notify sender of failure
    await fetch(`${QUACK_API}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        to: from, 
        from: MY_AGENT_NAME, 
        task: `❌ Failed: ${error.message}` 
      })
    });
    
    res.status(500).json({ error: error.message });
  }
}

/**
 * Polling mode - Check for approved messages periodically
 * Call this function on an interval (e.g., every 30 seconds)
 */
async function pollForApprovedTasks() {
  try {
    const res = await fetch(`${QUACK_API}/inbox/${MY_AGENT_NAME}?includeRead=true`);
    const { messages } = await res.json();
    
    // Filter for approved messages only
    const approved = messages.filter(m => m.status === 'approved');
    
    for (const message of approved) {
      console.log(`[QUACK] Processing approved task: ${message.id}`);
      
      // Mark as in_progress
      await fetch(`${QUACK_API}/status/${message.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_progress' })
      });
      
      try {
        const result = await executeTask(message.task, message.context, message.files);
        
        // Mark as completed
        await fetch(`${QUACK_API}/complete/${message.id}`, { method: 'POST' });
        
        // Reply to sender
        await fetch(`${QUACK_API}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            to: message.from, 
            from: MY_AGENT_NAME, 
            task: `✅ Completed: ${result}` 
          })
        });
      } catch (error) {
        await fetch(`${QUACK_API}/status/${message.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'failed' })
        });
      }
    }
  } catch (error) {
    console.error('[QUACK] Polling error:', error);
  }
}

/**
 * YOUR CUSTOM TASK EXECUTION LOGIC
 * Implement this function to handle incoming tasks
 */
async function executeTask(task, context, files) {
  // Example implementation:
  console.log('Task:', task);
  console.log('Context:', context);
  console.log('Files:', files?.length || 0);
  
  // Your custom logic here...
  // - Parse the task
  // - Execute actions
  // - Return result
  
  return 'Task completed successfully';
}

// Export for use in your app
module.exports = {
  quackWebhookHandler,
  pollForApprovedTasks,
  executeTask,
  QUACK_API,
  MY_AGENT_NAME
};
