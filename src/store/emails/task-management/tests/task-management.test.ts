/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, waitFor } from '@testing-library/react';

import { getUseEmailStoreAndHooksForTesting } from 'store/emails/store';

const { useEmailsStore } = getUseEmailStoreAndHooksForTesting();

describe('useEmailsStore', () => {
	beforeEach(() => {
		useEmailsStore.setState({ queue: [], isExecuting: false });
	});

	it('should add tasks to the queue', async () => {
		const task1 = vi.fn(() => Promise.resolve());
		const task2 = vi.fn(() => Promise.resolve());

		useEmailsStore.setState((state) => ({ ...state, isExecuting: true }));
		useEmailsStore.getState().addTask(task1);
		useEmailsStore.getState().addTask(task2);
		const { queue } = useEmailsStore.getState();

		await waitFor(() => {
			expect(queue).toEqual([task1, task2]);
		});
	});

	it('should execute tasks in sequence', async () => {
		const results: string[] = [];
		const task1 = vi.fn(() => {
			results.push('task1');
			return Promise.resolve(); // Explicitly return a Promise<void>
		});
		const task2 = vi.fn(() => {
			results.push('task2');
			return Promise.resolve(); // Explicitly return a Promise<void>
		});
		const task3 = vi.fn(() => {
			results.push('task3');
			return Promise.resolve(); // Explicitly return a Promise<void>
		});

		useEmailsStore.getState().addTask(task1);
		useEmailsStore.getState().addTask(task2);
		useEmailsStore.getState().addTask(task3);

		await waitFor(() => {
			expect(results).toEqual(['task1', 'task2', 'task3']);
		});
		expect(task1).toHaveBeenCalledTimes(1);
		expect(task2).toHaveBeenCalledTimes(1);
		expect(task3).toHaveBeenCalledTimes(1);
	});

	it('should not execute tasks concurrently', async () => {
		const results: string[] = [];
		const task1 = vi.fn(
			() =>
				new Promise<void>((resolve) => {
					setTimeout(() => {
						results.push('task1');
						resolve();
					}, 100);
				})
		);

		const task2 = vi.fn(
			() =>
				new Promise<void>((resolve) => {
					setTimeout(() => {
						results.push('task2');
						resolve();
					}, 50);
				})
		);

		useEmailsStore.getState().addTask(task1);
		useEmailsStore.getState().addTask(task2);

		await waitFor(() => {
			expect(results).toEqual(['task1', 'task2']);
		});
		expect(task1).toHaveBeenCalledTimes(1);
		expect(task2).toHaveBeenCalledTimes(1);
	});

	it('should handle task execution errors gracefully', async () => {
		const consoleWarnMock = vi.spyOn(console, 'warn').mockImplementation(vi.fn());
		const results: string[] = [];
		const task1 = vi.fn(() => {
			results.push('task1');
			return Promise.resolve();
		});
		const failingTask = vi.fn(() => Promise.reject(new Error('Task failed')));
		const task3 = vi.fn(() => {
			results.push('task3');
			return Promise.resolve();
		});

		useEmailsStore.getState().addTask(task1);
		useEmailsStore.getState().addTask(failingTask);
		useEmailsStore.getState().addTask(task3);

		await waitFor(() => {
			expect(results).toEqual(['task1', 'task3']);
		});

		expect(task1).toHaveBeenCalledTimes(1);
		expect(failingTask).toHaveBeenCalledTimes(1);
		expect(task3).toHaveBeenCalledTimes(1);
		expect(consoleWarnMock).toHaveBeenCalledWith('Task execution failed:', expect.any(Error));

		consoleWarnMock.mockRestore();
	});

	test('should not re-trigger execution if already running', async () => {
		const results: string[] = [];
		const task1 = vi.fn(
			() =>
				new Promise<void>((resolve) => {
					setTimeout(() => {
						results.push('task1');
						resolve();
					}, 100);
				})
		);
		const task2 = vi.fn(() => {
			results.push('task2');
			return Promise.resolve(); // Explicitly return a Promise<void>
		});

		await act(async () => {
			useEmailsStore.setState({ isExecuting: true });
		});

		useEmailsStore.getState().addTask(task1);
		useEmailsStore.getState().addTask(task2);

		vi.advanceTimersByTimeAsync(1000);

		expect(results).toEqual([]);
		expect(task1).not.toHaveBeenCalled();
		expect(task2).not.toHaveBeenCalled();
	});
});
