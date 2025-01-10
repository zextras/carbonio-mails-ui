/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { waitFor } from '@testing-library/react';

import { getUseEmailStoreForTesting } from '../store';

const useEmailsStore = getUseEmailStoreForTesting();

// Import or mock the `useEmailsStore` implementation
describe('useEmailsStore', () => {
	beforeEach(() => {
		// Reset the store before each test
		useEmailsStore.setState({ queue: [], isExecuting: false });
	});

	test('should add tasks to the queue', () => {
		const task1 = jest.fn(() => Promise.resolve());
		const task2 = jest.fn(() => Promise.resolve());

		useEmailsStore.setState((state) => ({ ...state, isExecuting: true }));
		useEmailsStore.getState().addTask(task1);
		useEmailsStore.getState().addTask(task2);
		const { queue } = useEmailsStore.getState();

		expect(queue).toEqual([task1, task2]);
	});

	it('should execute tasks in sequence', async () => {
		const results: string[] = [];
		const task1 = jest.fn(() => {
			results.push('task1');
			return Promise.resolve(); // Explicitly return a Promise<void>
		});
		const task2 = jest.fn(() => {
			results.push('task2');
			return Promise.resolve(); // Explicitly return a Promise<void>
		});
		const task3 = jest.fn(() => {
			results.push('task3');
			return Promise.resolve(); // Explicitly return a Promise<void>
		});

		// useEmailsStore.setState((state) => ({ ...state, isExecuting: false }));
		useEmailsStore.getState().addTask(task1);
		useEmailsStore.getState().addTask(task2);
		useEmailsStore.getState().addTask(task3);

		// // Wait for tasks to execute
		// await new Promise((resolve) => {
		// 	setTimeout(resolve, 100);
		// });

		await waitFor(() => {
			expect(results).toEqual(['task1', 'task2', 'task3']);
		});
		expect(task1).toHaveBeenCalledTimes(1);
		expect(task2).toHaveBeenCalledTimes(1);
		expect(task3).toHaveBeenCalledTimes(1);
	});

	// test('should not execute tasks concurrently', async () => {
	// 	const results: string[] = [];
	// 	const task1 = jest.fn(
	// 		() =>
	// 			new Promise<void>((resolve) =>
	// 				setTimeout(() => {
	// 					results.push('task1');
	// 					resolve();
	// 				}, 100)
	// 			)
	// 	);
	// 	const task2 = jest.fn(
	// 		() =>
	// 			new Promise<void>((resolve) =>
	// 				setTimeout(() => {
	// 					results.push('task2');
	// 					resolve();
	// 				}, 50)
	// 			)
	// 	);
	//
	// 	useEmailsStore.getState().addTask(task1);
	// 	useEmailsStore.getState().addTask(task2);
	//
	// 	// Wait for tasks to execute
	// 	await new Promise((resolve) => setTimeout(resolve, 200));
	//
	// 	expect(results).toEqual(['task1', 'task2']);
	// 	expect(task1).toHaveBeenCalledTimes(1);
	// 	expect(task2).toHaveBeenCalledTimes(1);
	// });
	//
	// test('should handle task execution errors gracefully', async () => {
	// 	const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
	// 	const results: string[] = [];
	// 	const task1 = jest.fn(() => Promise.resolve(results.push('task1')));
	// 	const failingTask = jest.fn(() => Promise.reject(new Error('Task failed')));
	// 	const task3 = jest.fn(() => Promise.resolve(results.push('task3')));
	//
	// 	useEmailsStore.getState().addTask(task1);
	// 	useEmailsStore.getState().addTask(failingTask);
	// 	useEmailsStore.getState().addTask(task3);
	//
	// 	// Wait for tasks to execute
	// 	await new Promise((resolve) => setTimeout(resolve, 100));
	//
	// 	expect(results).toEqual(['task1', 'task3']);
	// 	expect(task1).toHaveBeenCalledTimes(1);
	// 	expect(failingTask).toHaveBeenCalledTimes(1);
	// 	expect(task3).toHaveBeenCalledTimes(1);
	// 	expect(consoleErrorMock).toHaveBeenCalledWith('Task execution failed:', expect.any(Error));
	//
	// 	consoleErrorMock.mockRestore();
	// });
	//
	// test('should not re-trigger execution if already running', async () => {
	// 	const results: string[] = [];
	// 	const task1 = jest.fn(
	// 		() =>
	// 			new Promise<void>((resolve) =>
	// 				setTimeout(() => {
	// 					results.push('task1');
	// 					resolve();
	// 				}, 100)
	// 			)
	// 	);
	// 	const task2 = jest.fn(() => Promise.resolve(results.push('task2')));
	//
	// 	useEmailsStore.getState().addTask(task1);
	//
	// 	// Simulate task execution starting
	// 	useEmailsStore.setState({ isExecuting: true });
	//
	// 	useEmailsStore.getState().addTask(task2);
	//
	// 	// Wait for a bit to ensure no additional execution
	// 	await new Promise((resolve) => setTimeout(resolve, 200));
	//
	// 	expect(results).toEqual([]);
	// 	expect(task1).not.toHaveBeenCalled();
	// 	expect(task2).not.toHaveBeenCalled();
	// });
});
