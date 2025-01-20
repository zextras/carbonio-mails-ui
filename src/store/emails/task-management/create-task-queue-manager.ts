/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { StateCreator } from 'zustand';

/**
 * TaskQueueManager is a store extension that provides functionality
 * for managing and executing asynchronous tasks sequentially in a queue.
 * Also, this implementation safeguards against race conditions caused by
 * execution of asynchronous tasks.
 */
type TaskQueueManager = {
	queue: Array<() => Promise<void>>;
	isExecuting: boolean;
	addTask: (task: () => Promise<void>) => void;
	executeTasks: () => Promise<void>;
};

/**
 * Creates a store slice for task queue management.
 */
export const createTaskQueueManager: StateCreator<TaskQueueManager> = (set, get) => ({
	queue: [],
	isExecuting: false,

	/**
	 * Adds a task to the queue. If no other task is currently executing, it starts the execution.
	 */
	addTask: (task): void => {
		if (typeof task !== 'function') {
			console.error('Invalid task. Task must be a function that returns a Promise.');
			return;
		}

		const { queue, isExecuting } = get();
		set({ queue: [...queue, task] });

		if (!isExecuting) {
			get().executeTasks();
		}
	},

	/**
	 * Executes tasks sequentially from the queue. Ensures that only one execution runs at a time.
	 * If a task in queue will fail the execution will continue with the next task.
	 */
	executeTasks: async (): Promise<void> => {
		const { isExecuting } = get();

		if (isExecuting) {
			return;
		}

		set({ isExecuting: true });

		try {
			while (get().queue.length > 0) {
				const { queue } = get();
				const [currentTask, ...restQueue] = queue;

				set({ queue: restQueue });

				if (typeof currentTask === 'function') {
					try {
						// eslint-disable-next-line no-await-in-loop
						await currentTask();
					} catch (error) {
						console.warn('Task execution failed:', error);
					}
				} else {
					console.warn('Skipping invalid task:', currentTask);
				}
			}
		} finally {
			set({ isExecuting: false });
		}
	}
});
