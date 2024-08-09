/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { getSetupServer } from '../../carbonio-ui-commons/test/jest-setup';
import * as shell from '../../carbonio-ui-commons/test/mocks/carbonio-shell-ui';
import { setupHook } from '../../carbonio-ui-commons/test/test-setup';
import * as convRequest from '../../store/actions/conv-action';
import * as searchAPI from '../../store/actions/search';
import { generateStore } from '../../tests/generators/store';
import { usePreviewHeaderNavigation } from '../use-preview-header-navigation';

describe('usePreviewHeaderNavigation', () => {
	test('should return two items', () => {
		const store = generateStore();
		const { result } = setupHook(usePreviewHeaderNavigation, {
			store,
			initialProps: [
				{
					items: [],
					folderId: '2',
					currentItemId: '1',
					itemsType: 'conversation',
					searchedInFolderStatus: undefined
				}
			]
		});
		expect(result.current).toStrictEqual({
			nextActionItem: expect.any(Object),
			previousActionItem: expect.any(Object)
		});
	});
	describe('previousActionItem', () => {
		test('has ArrowIosBack icon', () => {
			const store = generateStore();
			const { result } = setupHook(usePreviewHeaderNavigation, {
				store,
				initialProps: [
					{
						items: [],
						folderId: '2',
						currentItemId: '1',
						itemsType: 'conversation',
						searchedInFolderStatus: undefined
					}
				]
			});
			expect(result.current.previousActionItem.icon).toBe('ArrowIosBack');
		});
		test('is disabled when it is the is the first item', () => {
			const store = generateStore();
			const { result } = setupHook(usePreviewHeaderNavigation, {
				store,
				initialProps: [
					{
						items: [{ id: '1', read: true }],
						folderId: '2',
						currentItemId: '1',
						itemsType: 'conversation',
						searchedInFolderStatus: undefined
					}
				]
			});
			expect(result.current.previousActionItem.disabled).toBe(true);
		});
		test('render a tooltip for the default behaviour', () => {
			const store = generateStore();
			const { result } = setupHook(usePreviewHeaderNavigation, {
				store,
				initialProps: [
					{
						items: [
							{ id: '1', read: true },
							{ id: '2', read: true },
							{ id: '3', read: true }
						],
						folderId: '2',
						currentItemId: '2',
						itemsType: 'conversation',
						searchedInFolderStatus: 'complete'
					}
				]
			});
			expect(result.current.previousActionItem.tooltipLabel).toBe('Go to previous email');
		});
		test('render a different tooltip when the first item is displayed', () => {
			const store = generateStore();
			const { result } = setupHook(usePreviewHeaderNavigation, {
				store,
				initialProps: [
					{
						items: [
							{ id: '1', read: true },
							{ id: '2', read: true },
							{ id: '3', read: true }
						],
						folderId: '2',
						currentItemId: '1',
						itemsType: 'conversation',
						searchedInFolderStatus: 'complete'
					}
				]
			});
			expect(result.current.previousActionItem.tooltipLabel).toBe('There are no previous emails');
		});
		test('render a different tooltip when navigation is not available', () => {
			const store = generateStore();
			const { result } = setupHook(usePreviewHeaderNavigation, {
				store,
				initialProps: [
					{
						items: [],
						folderId: '2',
						currentItemId: '1',
						itemsType: 'conversation',
						searchedInFolderStatus: undefined
					}
				]
			});
			expect(result.current.previousActionItem.tooltipLabel).toBe('Close this email to navigate');
		});
		describe('calling the action', () => {
			test('will change the route with the previous message id', () => {
				const store = generateStore();
				const replaceHistorySpy = jest.spyOn(shell, 'replaceHistory');
				const { result } = setupHook(usePreviewHeaderNavigation, {
					store,
					initialProps: [
						{
							items: [
								{ id: '1', read: true },
								{ id: '2', read: true },
								{ id: '3', read: true }
							],
							folderId: '2',
							currentItemId: '2',
							itemsType: 'conversation',
							searchedInFolderStatus: 'complete'
						}
					]
				});
				result.current.previousActionItem.action();
				expect(replaceHistorySpy).toHaveBeenCalledWith('/folder/2/conversation/1');
			});
			test('will set the message as read if it was not', () => {
				const convActionSpy = jest.spyOn(convRequest, 'convAction');

				const store = generateStore();
				const { result } = setupHook(usePreviewHeaderNavigation, {
					store,
					initialProps: [
						{
							items: [
								{ id: '1', read: false },
								{ id: '2', read: true },
								{ id: '3', read: true }
							],
							folderId: '2',
							currentItemId: '2',
							itemsType: 'conversation',
							searchedInFolderStatus: 'complete'
						}
					]
				});
				result.current.previousActionItem.action();
				expect(convActionSpy).toHaveBeenCalledWith({ ids: ['1'], operation: 'read' });
			});
			test('will not set the message as read if it was already', () => {
				const convActionSpy = jest.spyOn(convRequest, 'convAction');

				const store = generateStore();
				const { result } = setupHook(usePreviewHeaderNavigation, {
					store,
					initialProps: [
						{
							items: [
								{ id: '1', read: true },
								{ id: '2', read: true },
								{ id: '3', read: true }
							],
							folderId: '2',
							currentItemId: '2',
							itemsType: 'conversation',
							searchedInFolderStatus: 'complete'
						}
					]
				});
				result.current.previousActionItem.action();
				expect(convActionSpy).not.toHaveBeenCalled();
			});
		});
	});
	describe('nextActionItem', () => {
		test('has ArrowIosBack icon', () => {
			const store = generateStore();
			const { result } = setupHook(usePreviewHeaderNavigation, {
				store,
				initialProps: [
					{
						items: [],
						folderId: '2',
						currentItemId: '1',
						itemsType: 'conversation',
						searchedInFolderStatus: undefined
					}
				]
			});
			expect(result.current.nextActionItem.icon).toBe('ArrowIosForward');
		});
		test('is disabled when it is the is the last item', () => {
			const store = generateStore();
			const { result } = setupHook(usePreviewHeaderNavigation, {
				store,
				initialProps: [
					{
						items: [{ id: '1', read: true }],
						folderId: '2',
						currentItemId: '1',
						itemsType: 'conversation',
						searchedInFolderStatus: undefined
					}
				]
			});
			expect(result.current.nextActionItem.disabled).toBe(true);
		});
		test('render a tooltip for the default behaviour', () => {
			const store = generateStore();
			const { result } = setupHook(usePreviewHeaderNavigation, {
				store,
				initialProps: [
					{
						items: [
							{ id: '1', read: true },
							{ id: '2', read: true },
							{ id: '3', read: true }
						],
						folderId: '2',
						currentItemId: '2',
						itemsType: 'conversation',
						searchedInFolderStatus: 'complete'
					}
				]
			});
			expect(result.current.nextActionItem.tooltipLabel).toBe('Go to next email');
		});
		test('render a different tooltip when the last item is displayed', () => {
			const store = generateStore();
			const { result } = setupHook(usePreviewHeaderNavigation, {
				store,
				initialProps: [
					{
						items: [
							{ id: '1', read: true },
							{ id: '2', read: true },
							{ id: '3', read: true }
						],
						folderId: '2',
						currentItemId: '3',
						itemsType: 'conversation',
						searchedInFolderStatus: 'complete'
					}
				]
			});
			expect(result.current.nextActionItem.tooltipLabel).toBe('There are no more emails');
		});
		test('render a different tooltip when navigation is not available', () => {
			const store = generateStore();
			const { result } = setupHook(usePreviewHeaderNavigation, {
				store,
				initialProps: [
					{
						items: [],
						folderId: '2',
						currentItemId: '1',
						itemsType: 'conversation',
						searchedInFolderStatus: undefined
					}
				]
			});
			expect(result.current.previousActionItem.tooltipLabel).toBe('Close this email to navigate');
		});
		test('render a different tooltip when is loading next emails', () => {
			const store = generateStore();
			const { result } = setupHook(usePreviewHeaderNavigation, {
				store,
				initialProps: [
					{
						items: [{ id: '1', read: true }],
						folderId: '2',
						currentItemId: '1',
						itemsType: 'conversation',
						searchedInFolderStatus: 'hasMore'
					}
				]
			});
			expect(result.current.nextActionItem.tooltipLabel).toBe('Loading next email');
		});
		test('render a different tooltip when fails to load next emails', async () => {
			const store = generateStore();
			getSetupServer().use(
				http.post('/service/soap/SearchRequest', async () => HttpResponse.json({ error: true }))
			);
			const { result } = await waitFor(() =>
				setupHook(usePreviewHeaderNavigation, {
					store,
					initialProps: [
						{
							items: [{ id: '1', read: true }],
							folderId: '2',
							currentItemId: '1',
							itemsType: 'conversation',
							searchedInFolderStatus: 'hasMore'
						}
					]
				})
			);

			expect(result.current.nextActionItem.tooltipLabel).toBe(
				'Unable to load next email. Try again later'
			);
		});
		test('when it is the last item and hasMore it should call a search request', async () => {
			const store = generateStore();
			const searchSpy = jest.spyOn(searchAPI, 'search');
			act(() => {
				setupHook(usePreviewHeaderNavigation, {
					store,
					initialProps: [
						{
							items: [{ id: '1', read: true }],
							folderId: '2',
							currentItemId: '1',
							itemsType: 'conversation',
							searchedInFolderStatus: 'hasMore'
						}
					]
				});
			});

			expect(searchSpy).toHaveBeenCalledWith({
				folderId: '2',
				limit: 50,
				offset: 1,
				sortBy: 'dateDesc',
				types: 'conversation'
			});
		});
		test('when it is the last item and it does not have more it should not call a search request', async () => {
			const store = generateStore();
			const searchSpy = jest.spyOn(searchAPI, 'search');
			act(() => {
				setupHook(usePreviewHeaderNavigation, {
					store,
					initialProps: [
						{
							items: [{ id: '1', read: true }],
							folderId: '2',
							currentItemId: '1',
							itemsType: 'conversation',
							searchedInFolderStatus: 'complete'
						}
					]
				});
			});

			expect(searchSpy).not.toHaveBeenCalled();
		});
		describe('calling the action', () => {
			test('will change the route with the next message id', () => {
				const store = generateStore();
				const replaceHistorySpy = jest.spyOn(shell, 'replaceHistory');
				const { result } = setupHook(usePreviewHeaderNavigation, {
					store,
					initialProps: [
						{
							items: [
								{ id: '1', read: true },
								{ id: '2', read: true },
								{ id: '3', read: true }
							],
							folderId: '2',
							currentItemId: '2',
							itemsType: 'conversation',
							searchedInFolderStatus: 'complete'
						}
					]
				});
				result.current.nextActionItem.action();
				expect(replaceHistorySpy).toHaveBeenCalledWith('/folder/2/conversation/3');
			});
			test('will set the message as read if it was not', () => {
				const convActionSpy = jest.spyOn(convRequest, 'convAction');

				const store = generateStore();
				const { result } = setupHook(usePreviewHeaderNavigation, {
					store,
					initialProps: [
						{
							items: [
								{ id: '1', read: true },
								{ id: '2', read: true },
								{ id: '3', read: false }
							],
							folderId: '2',
							currentItemId: '2',
							itemsType: 'conversation',
							searchedInFolderStatus: 'complete'
						}
					]
				});
				result.current.nextActionItem.action();
				expect(convActionSpy).toHaveBeenCalledWith({ ids: ['3'], operation: 'read' });
			});
			test('will not set the message as read if it was already', () => {
				const convActionSpy = jest.spyOn(convRequest, 'convAction');

				const store = generateStore();
				const { result } = setupHook(usePreviewHeaderNavigation, {
					store,
					initialProps: [
						{
							items: [
								{ id: '1', read: true },
								{ id: '2', read: true },
								{ id: '3', read: true }
							],
							folderId: '2',
							currentItemId: '2',
							itemsType: 'conversation',
							searchedInFolderStatus: 'complete'
						}
					]
				});
				result.current.nextActionItem.action();
				expect(convActionSpy).not.toHaveBeenCalled();
			});
		});
	});
});
