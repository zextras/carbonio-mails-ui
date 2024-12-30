/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act, waitFor } from '@testing-library/react';
import { CreateSnackbarFn, useSnackbar } from '@zextras/carbonio-design-system';

import * as shell from '../../carbonio-ui-commons/test/mocks/carbonio-shell-ui';
import { createSoapAPIInterceptor } from '../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { setupHook } from '../../carbonio-ui-commons/test/test-setup';
import * as convRequest from '../../store/actions/conv-action';
import * as searchAPI from '../../store/actions/search';
import { setConversationsInEmailStore } from '../../store/zustand/emails/store';
import { createSoapAPIInterceptorWithError } from '../../tests/generators/api';
import { generateConversation } from '../../tests/generators/generateConversation';
import { usePreviewHeaderNavigation } from '../use-preview-header-navigation';

const createSnackbar = (arg: any): CreateSnackbarFn => arg;
const createSnackbarSpy = jest.fn(createSnackbar);

jest.mock('@zextras/carbonio-design-system', () => ({
	...jest.requireActual('@zextras/carbonio-design-system'),
	useSnackbar: jest.fn()
}));

beforeEach(() => {
	createSoapAPIInterceptor('ConvAction');
	createSoapAPIInterceptor('Search');
	(useSnackbar as jest.Mock).mockReturnValue(createSnackbarSpy);
});

describe('usePreviewHeaderNavigation', () => {
	it('should return two items', () => {
		const { result } = setupHook(usePreviewHeaderNavigation, {
			initialProps: [
				{
					itemIds: [],
					folderId: '2',
					currentItemId: '1',
					hasMore: false,
					itemsType: 'conversation',
					searchedInFolderStatus: null
				}
			]
		});
		expect(result.current).toStrictEqual({
			nextActionItem: expect.any(Object),
			previousActionItem: expect.any(Object)
		});
	});
	describe('previousActionItem', () => {
		it('has ArrowIosBack icon', () => {
			const { result } = setupHook(usePreviewHeaderNavigation, {
				initialProps: [
					{
						itemIds: [],
						hasMore: false,
						folderId: '2',
						currentItemId: '1',
						itemsType: 'conversation',
						searchedInFolderStatus: null
					}
				]
			});
			expect(result.current.previousActionItem.icon).toBe('ArrowIosBack');
		});
		it('is disabled when it is the first item', () => {
			const conv1 = generateConversation({ id: '1' });
			setConversationsInEmailStore([conv1], false);

			const { result } = setupHook(usePreviewHeaderNavigation, {
				initialProps: [
					{
						itemIds: ['1'],
						hasMore: false,
						folderId: '2',
						currentItemId: '1',
						itemsType: 'conversation',
						searchedInFolderStatus: null
					}
				]
			});
			expect(result.current.previousActionItem.disabled).toBe(true);
		});
		it('render a tooltip for the default behaviour', () => {
			const conv1 = generateConversation({ id: '1' });
			const conv2 = generateConversation({ id: '2' });
			const conv3 = generateConversation({ id: '3' });
			setConversationsInEmailStore([conv1, conv2, conv3], false);

			const { result } = setupHook(usePreviewHeaderNavigation, {
				initialProps: [
					{
						itemIds: ['1', '2', '3'],
						hasMore: false,
						folderId: '2',
						currentItemId: '2',
						itemsType: 'conversation',
						searchedInFolderStatus: 'fulfilled'
					}
				]
			});
			expect(result.current.previousActionItem.tooltipLabel).toBe('Go to previous email');
		});
		it('render a different tooltip when the first item is displayed', () => {
			const conv1 = generateConversation({ id: '1' });
			const conv2 = generateConversation({ id: '2' });
			const conv3 = generateConversation({ id: '3' });
			setConversationsInEmailStore([conv1, conv2, conv3], false);

			const { result } = setupHook(usePreviewHeaderNavigation, {
				initialProps: [
					{
						itemIds: ['1', '2', '3'],
						hasMore: false,
						folderId: '2',
						currentItemId: '1',
						itemsType: 'conversation',
						searchedInFolderStatus: 'fulfilled'
					}
				]
			});
			expect(result.current.previousActionItem.tooltipLabel).toBe('There are no previous emails');
		});
		it('render a different tooltip when navigation is not available', () => {
			const { result } = setupHook(usePreviewHeaderNavigation, {
				initialProps: [
					{
						itemIds: [],
						hasMore: false,
						folderId: '2',
						currentItemId: '1',
						itemsType: 'conversation',
						searchedInFolderStatus: null
					}
				]
			});
			expect(result.current.previousActionItem.tooltipLabel).toBe('Close this email to navigate');
		});
		describe('calling the action', () => {
			it('will change the route with the previous message id', () => {
				const conv1 = generateConversation({ id: '1' });
				const conv2 = generateConversation({ id: '2' });
				const conv3 = generateConversation({ id: '3' });
				setConversationsInEmailStore([conv1, conv2, conv3], false);

				const replaceHistorySpy = jest.spyOn(shell, 'replaceHistory');
				const { result } = setupHook(usePreviewHeaderNavigation, {
					initialProps: [
						{
							itemIds: ['1', '2', '3'],
							hasMore: false,
							folderId: '2',
							currentItemId: '2',
							itemsType: 'conversation',
							searchedInFolderStatus: 'fulfilled'
						}
					]
				});
				result.current.previousActionItem.action();
				expect(replaceHistorySpy).toHaveBeenCalledWith('/folder/2/conversation/1');
			});
			it('will set the message as read if it was not', () => {
				const convActionSpy = jest.spyOn(convRequest, 'convAction');
				const conv1 = generateConversation({ id: '1' });
				const conv2 = generateConversation({ id: '2' });
				const conv3 = generateConversation({ id: '3' });
				setConversationsInEmailStore([conv1, conv2, conv3], false);

				const { result } = setupHook(usePreviewHeaderNavigation, {
					initialProps: [
						{
							itemIds: ['1', '2', '3'],
							hasMore: false,
							folderId: '2',
							currentItemId: '2',
							itemsType: 'conversation',
							searchedInFolderStatus: 'fulfilled'
						}
					]
				});
				result.current.previousActionItem.action();
				expect(convActionSpy).toHaveBeenCalledWith({ ids: ['1'], operation: 'read' });
			});
		});
	});
	describe('nextActionItem', () => {
		it('has ArrowIosBack icon', () => {
			const { result } = setupHook(usePreviewHeaderNavigation, {
				initialProps: [
					{
						itemIds: [],
						hasMore: false,
						folderId: '2',
						currentItemId: '1',
						itemsType: 'conversation',
						searchedInFolderStatus: null
					}
				]
			});
			expect(result.current.nextActionItem.icon).toBe('ArrowIosForward');
		});
		it('is disabled when it is the is the last item', () => {
			const conv1 = generateConversation({ id: '1' });
			setConversationsInEmailStore([conv1], false);

			const { result } = setupHook(usePreviewHeaderNavigation, {
				initialProps: [
					{
						itemIds: ['1'],
						hasMore: false,
						folderId: '2',
						currentItemId: '1',
						itemsType: 'conversation',
						searchedInFolderStatus: null
					}
				]
			});
			expect(result.current.nextActionItem.disabled).toBe(true);
		});
		it('render a tooltip for the default behaviour', () => {
			const conv1 = generateConversation({ id: '1' });
			const conv2 = generateConversation({ id: '2' });
			const conv3 = generateConversation({ id: '3' });
			setConversationsInEmailStore([conv1, conv2, conv3], false);

			const { result } = setupHook(usePreviewHeaderNavigation, {
				initialProps: [
					{
						itemIds: ['1', '2', '3'],
						hasMore: false,
						folderId: '2',
						currentItemId: '2',
						itemsType: 'conversation',
						searchedInFolderStatus: 'fulfilled'
					}
				]
			});
			expect(result.current.nextActionItem.tooltipLabel).toBe('Go to next email');
		});
		it('render a different tooltip when the last item is displayed', () => {
			const conv1 = generateConversation({ id: '1' });
			const conv2 = generateConversation({ id: '2' });
			const conv3 = generateConversation({ id: '3' });
			setConversationsInEmailStore([conv1, conv2, conv3], false);

			const { result } = setupHook(usePreviewHeaderNavigation, {
				initialProps: [
					{
						itemIds: ['1', '2', '3'],
						hasMore: false,
						folderId: '2',
						currentItemId: '3',
						itemsType: 'conversation',
						searchedInFolderStatus: 'fulfilled'
					}
				]
			});
			expect(result.current.nextActionItem.tooltipLabel).toBe('There are no more emails');
		});
		it('render a different tooltip when navigation is not available', () => {
			const { result } = setupHook(usePreviewHeaderNavigation, {
				initialProps: [
					{
						itemIds: [],
						hasMore: false,
						folderId: '2',
						currentItemId: '1',
						itemsType: 'conversation',
						searchedInFolderStatus: null
					}
				]
			});
			expect(result.current.previousActionItem.tooltipLabel).toBe('Close this email to navigate');
		});
		it('render a different tooltip when is loading next emails', () => {
			const { result } = setupHook(usePreviewHeaderNavigation, {
				initialProps: [
					{
						itemIds: [],
						folderId: '2',
						currentItemId: '1',
						itemsType: 'conversation',
						hasMore: true,
						searchedInFolderStatus: 'fulfilled'
					}
				]
			});
			expect(result.current.nextActionItem.tooltipLabel).toBe('Loading next email');
		});
		test('render a different tooltip when fails to load next emails', async () => {
			createSoapAPIInterceptorWithError('Search');
			const conv1 = generateConversation({ id: '1' });
			setConversationsInEmailStore([conv1], false);

			const { result } = setupHook(usePreviewHeaderNavigation, {
				initialProps: [
					{
						itemIds: ['1'],
						folderId: '2',
						currentItemId: '1',
						itemsType: 'conversation',
						hasMore: true,
						searchedInFolderStatus: 'fulfilled'
					}
				]
			});

			await waitFor(() =>
				expect(result.current.nextActionItem.tooltipLabel).toBe(
					'Unable to load next email. Try again later'
				)
			);
		});
		test('when it is the last item and hasMore it should call a search request', async () => {
			const interceptor = createSoapAPIInterceptor('Search', {});
			const conv1 = generateConversation({ id: '1' });
			setConversationsInEmailStore([conv1], true);

			act(() => {
				setupHook(usePreviewHeaderNavigation, {
					initialProps: [
						{
							itemIds: ['1'],
							folderId: '2',
							currentItemId: '1',
							itemsType: 'conversation',
							hasMore: true,
							searchedInFolderStatus: 'fulfilled'
						}
					]
				});
			});
			const request = await interceptor;

			expect(request).toHaveProperty('query', 'inId:"2"');
		});
		it('when it is the last item and it does not have more it should not call a search request', async () => {
			const conv1 = generateConversation({ id: '1' });
			setConversationsInEmailStore([conv1], false);

			const searchSpy = jest.spyOn(searchAPI, 'search');
			act(() => {
				setupHook(usePreviewHeaderNavigation, {
					initialProps: [
						{
							itemIds: ['1'],
							hasMore: false,
							folderId: '2',
							currentItemId: '1',
							itemsType: 'conversation',
							searchedInFolderStatus: 'fulfilled'
						}
					]
				});
			});

			expect(searchSpy).not.toHaveBeenCalled();
		});
		describe('calling the action', () => {
			it('will change the route with the next message id', () => {
				const replaceHistorySpy = jest.spyOn(shell, 'replaceHistory');
				const conv1 = generateConversation({ id: '1' });
				const conv2 = generateConversation({ id: '2' });
				const conv3 = generateConversation({ id: '3' });
				setConversationsInEmailStore([conv1, conv2, conv3], false);
				const { result } = setupHook(usePreviewHeaderNavigation, {
					initialProps: [
						{
							itemIds: ['1', '2', '3'],
							hasMore: false,
							folderId: '2',
							currentItemId: '2',
							itemsType: 'conversation',
							searchedInFolderStatus: 'fulfilled'
						}
					]
				});
				result.current.nextActionItem.action();
				expect(replaceHistorySpy).toHaveBeenCalledWith('/folder/2/conversation/3');
			});
			it('will set the message as read if it was not', () => {
				const convActionSpy = jest.spyOn(convRequest, 'convAction');
				const conv1 = generateConversation({ id: '1' });
				const conv2 = generateConversation({ id: '2' });
				const conv3 = generateConversation({ id: '3' });
				setConversationsInEmailStore(
					[
						{ ...conv1, read: true },
						{ ...conv2, read: true },
						{ ...conv3, read: false }
					],
					false
				);

				const { result } = setupHook(usePreviewHeaderNavigation, {
					initialProps: [
						{
							itemIds: ['1', '2', '3'],
							hasMore: false,
							folderId: '2',
							currentItemId: '2',
							itemsType: 'conversation',
							searchedInFolderStatus: 'fulfilled'
						}
					]
				});
				result.current.nextActionItem.action();
				expect(convActionSpy).toHaveBeenCalledWith({ ids: ['3'], operation: 'read' });
			});
			it('will not set the message as read if it was already', () => {
				const convActionSpy = jest.spyOn(convRequest, 'convAction');
				const conv1 = generateConversation({ id: '1' });
				const conv2 = generateConversation({ id: '2' });
				const conv3 = generateConversation({ id: '3' });
				setConversationsInEmailStore(
					[
						{ ...conv1, read: true },
						{ ...conv2, read: true },
						{ ...conv3, read: true }
					],
					false
				);

				const { result } = setupHook(usePreviewHeaderNavigation, {
					initialProps: [
						{
							itemIds: ['1', '2', '3'],
							hasMore: false,
							folderId: '2',
							currentItemId: '2',
							itemsType: 'conversation',
							searchedInFolderStatus: 'fulfilled'
						}
					]
				});
				result.current.nextActionItem.action();
				expect(convActionSpy).not.toHaveBeenCalled();
			});
		});
	});
});
