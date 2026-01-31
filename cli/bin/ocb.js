#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';

// Config
const API_URL = process.env.OCB_API_URL || 'http://localhost:3000/api';

// Helper to make API requests
async function api(path, options = {}) {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

// Parse task ID (accepts OCB-42 or just 42)
function parseTaskId(input) {
  const match = input.match(/^(?:OCB-)?(\d+)$/i);
  if (!match) throw new Error(`Invalid task ID: ${input}`);
  return parseInt(match[1], 10);
}

// Format task for display
function formatTask(task, verbose = false) {
  const status = {
    'TODO': chalk.yellow('TODO'),
    'IN_PROGRESS': chalk.blue('IN PROGRESS'),
    'NEEDS_REVIEW': chalk.magenta('NEEDS REVIEW'),
    'DONE': chalk.green('DONE'),
    'BLOCKED': chalk.red('BLOCKED'),
  }[task.status] || task.status;

  const priority = {
    'CRITICAL': chalk.red.bold('!!!'),
    'HIGH': chalk.red('!!'),
    'MEDIUM': chalk.yellow('!'),
    'LOW': chalk.dim('·'),
  }[task.priority] || '';

  const active = task.isActive ? chalk.cyan(' ⚡') : '';
  const id = chalk.dim(`OCB-${task.taskNumber}`);
  
  let line = `${id} ${status}${active} ${priority} ${task.title}`;
  
  if (verbose && task.description) {
    line += `\n${chalk.dim(task.description.split('\n').map(l => '    ' + l).join('\n'))}`;
  }
  
  return line;
}

// Commands
program
  .name('ocb')
  .description('CLI for OpenClaw-Board')
  .version('0.1.0');

// list
program
  .command('list')
  .alias('ls')
  .description('List tasks')
  .option('-s, --status <status>', 'Filter by status (TODO, IN_PROGRESS, NEEDS_REVIEW, DONE, BLOCKED)')
  .option('-p, --priority <priority>', 'Filter by priority (CRITICAL, HIGH, MEDIUM, LOW)')
  .option('-t, --tag <tag>', 'Filter by tag')
  .option('-a, --all', 'Include archived tasks')
  .option('--json', 'Output as JSON')
  .action(async (opts) => {
    try {
      let tasks = await api('/tasks');
      
      if (opts.status) {
        tasks = tasks.filter(t => t.status.toUpperCase() === opts.status.toUpperCase());
      }
      if (opts.priority) {
        tasks = tasks.filter(t => t.priority?.toUpperCase() === opts.priority.toUpperCase());
      }
      if (opts.tag) {
        tasks = tasks.filter(t => t.tags?.includes(opts.tag));
      }
      if (!opts.all) {
        tasks = tasks.filter(t => !t.archived);
      }
      
      if (opts.json) {
        console.log(JSON.stringify(tasks, null, 2));
      } else if (tasks.length === 0) {
        console.log(chalk.dim('No tasks found'));
      } else {
        tasks.forEach(t => console.log(formatTask(t)));
      }
    } catch (e) {
      console.error(chalk.red('Error:'), e.message);
      process.exit(1);
    }
  });

// show
program
  .command('show <id>')
  .description('Show task details')
  .option('--json', 'Output as JSON')
  .action(async (id, opts) => {
    try {
      const taskNum = parseTaskId(id);
      const tasks = await api('/tasks');
      const task = tasks.find(t => t.taskNumber === taskNum);
      
      if (!task) {
        console.error(chalk.red(`Task OCB-${taskNum} not found`));
        process.exit(1);
      }
      
      if (opts.json) {
        console.log(JSON.stringify(task, null, 2));
      } else {
        console.log(formatTask(task, true));
        if (task.tags?.length) {
          console.log(chalk.dim('Tags:'), task.tags.join(', '));
        }
        if (task.blockedReason) {
          console.log(chalk.red('Blocked:'), task.blockedReason);
        }
        if (task.comments?.length) {
          console.log(chalk.dim('\nComments:'));
          task.comments.forEach(c => {
            console.log(`  ${chalk.dim(c.createdAt)} ${c.content}`);
          });
        }
      }
    } catch (e) {
      console.error(chalk.red('Error:'), e.message);
      process.exit(1);
    }
  });

// create
program
  .command('create <title>')
  .alias('new')
  .description('Create a new task')
  .option('-d, --description <desc>', 'Task description')
  .option('-p, --priority <priority>', 'Priority (CRITICAL, HIGH, MEDIUM, LOW)', 'MEDIUM')
  .option('-t, --tags <tags>', 'Comma-separated tags')
  .option('--json', 'Output as JSON')
  .action(async (title, opts) => {
    try {
      const body = {
        title,
        description: opts.description || '',
        priority: opts.priority.toUpperCase(),
        status: 'TODO',
        origin: 'AI',
        tags: opts.tags ? opts.tags.split(',').map(t => t.trim()) : [],
      };
      
      const task = await api('/tasks', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      
      if (opts.json) {
        console.log(JSON.stringify(task, null, 2));
      } else {
        console.log(chalk.green('Created:'), formatTask(task));
      }
    } catch (e) {
      console.error(chalk.red('Error:'), e.message);
      process.exit(1);
    }
  });

// start
program
  .command('start <id>')
  .description('Start working on a task (move to IN_PROGRESS)')
  .action(async (id) => {
    try {
      const taskNum = parseTaskId(id);
      const tasks = await api('/tasks');
      const task = tasks.find(t => t.taskNumber === taskNum);
      
      if (!task) {
        console.error(chalk.red(`Task OCB-${taskNum} not found`));
        process.exit(1);
      }
      
      const updated = await api(`/tasks/${task.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'IN_PROGRESS', isActive: true }),
      });
      
      console.log(chalk.blue('Started:'), formatTask(updated));
    } catch (e) {
      console.error(chalk.red('Error:'), e.message);
      process.exit(1);
    }
  });

// done
program
  .command('done <id>')
  .description('Mark a task as done')
  .action(async (id) => {
    try {
      const taskNum = parseTaskId(id);
      const tasks = await api('/tasks');
      const task = tasks.find(t => t.taskNumber === taskNum);
      
      if (!task) {
        console.error(chalk.red(`Task OCB-${taskNum} not found`));
        process.exit(1);
      }
      
      const updated = await api(`/tasks/${task.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'DONE', isActive: false }),
      });
      
      console.log(chalk.green('Done:'), formatTask(updated));
    } catch (e) {
      console.error(chalk.red('Error:'), e.message);
      process.exit(1);
    }
  });

// review
program
  .command('review <id>')
  .description('Move a task to needs review')
  .action(async (id) => {
    try {
      const taskNum = parseTaskId(id);
      const tasks = await api('/tasks');
      const task = tasks.find(t => t.taskNumber === taskNum);
      
      if (!task) {
        console.error(chalk.red(`Task OCB-${taskNum} not found`));
        process.exit(1);
      }
      
      const updated = await api(`/tasks/${task.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'NEEDS_REVIEW', isActive: false }),
      });
      
      console.log(chalk.magenta('Ready for review:'), formatTask(updated));
    } catch (e) {
      console.error(chalk.red('Error:'), e.message);
      process.exit(1);
    }
  });

// block
program
  .command('block <id> [reason]')
  .description('Mark a task as blocked')
  .action(async (id, reason) => {
    try {
      const taskNum = parseTaskId(id);
      const tasks = await api('/tasks');
      const task = tasks.find(t => t.taskNumber === taskNum);
      
      if (!task) {
        console.error(chalk.red(`Task OCB-${taskNum} not found`));
        process.exit(1);
      }
      
      const updated = await api(`/tasks/${task.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ 
          status: 'BLOCKED', 
          isActive: false,
          blockedReason: reason || 'Blocked',
        }),
      });
      
      console.log(chalk.red('Blocked:'), formatTask(updated));
    } catch (e) {
      console.error(chalk.red('Error:'), e.message);
      process.exit(1);
    }
  });

// pick
program
  .command('pick')
  .description('Pick the next TODO task and start working on it')
  .option('--priority', 'Pick highest priority first')
  .action(async (opts) => {
    try {
      let tasks = await api('/tasks');
      tasks = tasks.filter(t => t.status === 'TODO' && !t.archived);
      
      if (opts.priority) {
        const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        tasks.sort((a, b) => (order[a.priority] ?? 99) - (order[b.priority] ?? 99));
      }
      
      if (tasks.length === 0) {
        console.log(chalk.dim('No TODO tasks available'));
        process.exit(0);
      }
      
      const task = tasks[0];
      const updated = await api(`/tasks/${task.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'IN_PROGRESS', isActive: true }),
      });
      
      console.log(chalk.blue('Picked up:'), formatTask(updated));
    } catch (e) {
      console.error(chalk.red('Error:'), e.message);
      process.exit(1);
    }
  });

// active
program
  .command('active')
  .description('Show the currently active task')
  .option('--json', 'Output as JSON')
  .action(async (opts) => {
    try {
      const tasks = await api('/tasks');
      const active = tasks.find(t => t.isActive);
      
      if (!active) {
        console.log(chalk.dim('No active task'));
        process.exit(0);
      }
      
      if (opts.json) {
        console.log(JSON.stringify(active, null, 2));
      } else {
        console.log(formatTask(active, true));
      }
    } catch (e) {
      console.error(chalk.red('Error:'), e.message);
      process.exit(1);
    }
  });

// comment
program
  .command('comment <id> <message>')
  .description('Add a comment to a task')
  .action(async (id, message) => {
    try {
      const taskNum = parseTaskId(id);
      const tasks = await api('/tasks');
      const task = tasks.find(t => t.taskNumber === taskNum);
      
      if (!task) {
        console.error(chalk.red(`Task OCB-${taskNum} not found`));
        process.exit(1);
      }
      
      const comment = await api(`/tasks/${task.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: message, author: 'AI' }),
      });
      
      console.log(chalk.green('Comment added to'), chalk.dim(`OCB-${taskNum}`));
    } catch (e) {
      console.error(chalk.red('Error:'), e.message);
      process.exit(1);
    }
  });

// todo (shorthand for list --status TODO)
program
  .command('todo')
  .description('List TODO tasks (shorthand)')
  .option('--json', 'Output as JSON')
  .action(async (opts) => {
    try {
      let tasks = await api('/tasks');
      tasks = tasks.filter(t => t.status === 'TODO' && !t.archived);
      
      if (opts.json) {
        console.log(JSON.stringify(tasks, null, 2));
      } else if (tasks.length === 0) {
        console.log(chalk.dim('No TODO tasks'));
      } else {
        tasks.forEach(t => console.log(formatTask(t)));
      }
    } catch (e) {
      console.error(chalk.red('Error:'), e.message);
      process.exit(1);
    }
  });

program.parse();
