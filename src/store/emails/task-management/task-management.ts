/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { StateCreator } from 'zustand';

type TaskManagement = {
	queue: Array<() => Promise<void>>;
	isExecuting: boolean;
	addTask: (task: () => Promise<void>) => void;
	executeTasks: () => Promise<void>;
};

export const taskManagement: StateCreator<TaskManagement> = (set, get) => ({
	queue: [],
	isExecuting: false,

	// Add a task to the queue
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

	// Execute tasks sequentially
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
