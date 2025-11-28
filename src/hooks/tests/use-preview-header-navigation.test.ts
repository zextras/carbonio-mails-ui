import { act, renderHook, waitFor } from '@testing-library/react';
import * as reactRouterDom from 'react-router-dom';
import type { Mock } from 'vitest';
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { createSoapAPIInterceptorWithError } from '__test__/generators/api';
import { generateConversation } from '__test__/generators/generateConversation';
import * as convRequest from 'api/conv-action-soap-api';
import * as searchSoapApi from 'api/search-soap-api';
import { usePreviewHeaderNavigation } from 'hooks/use-preview-header-navigation';
import { setConversationsInEmailStore } from 'store/emails/store';

vi.mock('react-i18next', async () => ({
	...(await vi.importActual('react-i18next')),
	useTranslation: (): Array<(key: string) => string> => [
		(key: string): string => key // Return the translation key as the translation
	],
	Trans: ({ children }: { children: React.ReactNode }): React.ReactNode => children,
	I18nextProvider: ({ children }: { children: React.ReactNode }): React.ReactNode => children
}));

vi.mock('react-router-dom', async () => ({
	...(await vi.importActual('react-router-dom')),
	useNavigate: vi.fn().mockReturnValue(vi.fn())
}));

beforeEach(() => {
	createSoapAPIInterceptor('ConvAction');
	createSoapAPIInterceptor('Search');
});

describe('usePreviewHeaderNavigation', () => {
	it('should return two items', async () => {
		const { result } = renderHook(usePreviewHeaderNavigation, {
			initialProps: {
				itemIds: [],
				folderId: '2',
				currentItemId: '1',
				hasMore: false,
				itemsType: 'conversation',
				searchedInFolderStatus: null
			}
		});
		await waitFor(() => {
			expect(result.current).toStrictEqual({
				nextActionItem: expect.any(Object),
				previousActionItem: expect.any(Object)
			});
		});
	});
	describe('previousActionItem', () => {
		it('has ArrowIosBack icon', () => {
			const { result } = renderHook(usePreviewHeaderNavigation, {
				initialProps: {
					itemIds: [],
					hasMore: false,
					folderId: '2',
					currentItemId: '1',
					itemsType: 'conversation',
					searchedInFolderStatus: null
				}
			});
			expect(result.current.previousActionItem.icon).toBe('ArrowIosBack');
		});
		it('is disabled when it is the first item', async () => {
			const conv1 = generateConversation({ id: '1' });
			setConversationsInEmailStore([conv1], false);

			const { result } = renderHook(usePreviewHeaderNavigation, {
				initialProps: {
					itemIds: ['1'],
					hasMore: false,
					folderId: '2',
					currentItemId: '1',
					itemsType: 'conversation',
					searchedInFolderStatus: null
				}
			});
			await waitFor(() => {
				expect(result.current.previousActionItem.disabled).toBe(true);
			});
		});
		it('render a tooltip for the default behaviour', async () => {
			const conv1 = generateConversation({ id: '1' });
			const conv2 = generateConversation({ id: '2' });
			const conv3 = generateConversation({ id: '3' });
			setConversationsInEmailStore([conv1, conv2, conv3], false);

			const { result } = renderHook(usePreviewHeaderNavigation, {
				initialProps: {
					itemIds: ['1', '2', '3'],
					hasMore: false,
					folderId: '2',
					currentItemId: '2',
					itemsType: 'conversation',
					searchedInFolderStatus: 'fulfilled'
				}
			});
			await waitFor(() => {
				expect(result.current.previousActionItem.tooltipLabel).toBe(
					'tooltip.list_navigation.goToPrevious'
				);
			});
		});
		it('render a different tooltip when the first item is displayed', async () => {
			const conv1 = generateConversation({ id: '1' });
			const conv2 = generateConversation({ id: '2' });
			const conv3 = generateConversation({ id: '3' });
			setConversationsInEmailStore([conv1, conv2, conv3], false);

			const { result } = renderHook(usePreviewHeaderNavigation, {
				initialProps: {
					itemIds: ['1', '2', '3'],
					hasMore: false,
					folderId: '2',
					currentItemId: '1',
					itemsType: 'conversation',
					searchedInFolderStatus: 'fulfilled'
				}
			});
			await waitFor(() => {
				expect(result.current.previousActionItem.tooltipLabel).toBe(
					'tooltip.list_navigation.noPreviousEmails'
				);
			});
		});
		it('render a different tooltip when navigation is not available', async () => {
			const { result } = renderHook(usePreviewHeaderNavigation, {
				initialProps: {
					itemIds: [],
					hasMore: false,
					folderId: '2',
					currentItemId: '1',
					itemsType: 'conversation',
					searchedInFolderStatus: null
				}
			});
			await waitFor(() => {
				expect(result.current.previousActionItem.tooltipLabel).toBe(
					'tooltip.list_navigation.closeToNavigate'
				);
			});
		});
		describe('calling the action', () => {
			it('will change the route with the previous message id', async () => {
				const navigate = vi.fn();
				(reactRouterDom.useNavigate as Mock).mockReturnValue(navigate);
				const conv1 = generateConversation({ id: '1' });
				const conv2 = generateConversation({ id: '2' });
				const conv3 = generateConversation({ id: '3' });
				setConversationsInEmailStore([conv1, conv2, conv3], false);

				const { result } = renderHook(usePreviewHeaderNavigation, {
					initialProps: {
						itemIds: ['1', '2', '3'],
						hasMore: false,
						folderId: '2',
						currentItemId: '2',
						itemsType: 'conversation',
						searchedInFolderStatus: 'fulfilled'
					}
				});
				await act(async () => {
					result.current.previousActionItem.action();
				});
				await waitFor(() => {
					expect(navigate).toHaveBeenCalledWith('/mails/folder/2/conversation/1', {
						replace: true
					});
				});
			});
			it('will set the message as read if it was not', async () => {
				const convActionSpy = vi.spyOn(convRequest, 'convActionSoapApi');
				const conv1 = generateConversation({ id: '1' });
				const conv2 = generateConversation({ id: '2' });
				const conv3 = generateConversation({ id: '3' });
				setConversationsInEmailStore([conv1, conv2, conv3], false);

				const { result } = renderHook(usePreviewHeaderNavigation, {
					initialProps: {
						itemIds: ['1', '2', '3'],
						hasMore: false,
						folderId: '2',
						currentItemId: '2',
						itemsType: 'conversation',
						searchedInFolderStatus: 'fulfilled'
					}
				});
				await act(async () => {
					result.current.previousActionItem.action();
				});
				await waitFor(() => {
					expect(convActionSpy).toHaveBeenCalledWith({ ids: ['1'], operation: 'read' });
				});
			});
		});
	});
	describe('nextActionItem', () => {
		it('has ArrowIosBack icon', async () => {
			const { result } = renderHook(usePreviewHeaderNavigation, {
				initialProps: {
					itemIds: [],
					hasMore: false,
					folderId: '2',
					currentItemId: '1',
					itemsType: 'conversation',
					searchedInFolderStatus: null
				}
			});
			await waitFor(() => {
				expect(result.current.nextActionItem.icon).toBe('ArrowIosForward');
			});
		});
		it('is disabled when it is the is the last item', async () => {
			const conv1 = generateConversation({ id: '1' });
			setConversationsInEmailStore([conv1], false);

			const { result } = renderHook(usePreviewHeaderNavigation, {
				initialProps: {
					itemIds: ['1'],
					hasMore: false,
					folderId: '2',
					currentItemId: '1',
					itemsType: 'conversation',
					searchedInFolderStatus: null
				}
			});
			await waitFor(() => {
				expect(result.current.nextActionItem.disabled).toBe(true);
			});
		});
		it('render a tooltip for the default behaviour', async () => {
			const conv1 = generateConversation({ id: '1' });
			const conv2 = generateConversation({ id: '2' });
			const conv3 = generateConversation({ id: '3' });
			setConversationsInEmailStore([conv1, conv2, conv3], false);

			const { result } = renderHook(usePreviewHeaderNavigation, {
				initialProps: {
					itemIds: ['1', '2', '3'],
					hasMore: false,
					folderId: '2',
					currentItemId: '2',
					itemsType: 'conversation',
					searchedInFolderStatus: 'fulfilled'
				}
			});
			await waitFor(() => {
				expect(result.current.nextActionItem.tooltipLabel).toBe('tooltip.list_navigation.goToNext');
			});
		});
		it('render a different tooltip when the last item is displayed', async () => {
			const conv1 = generateConversation({ id: '1' });
			const conv2 = generateConversation({ id: '2' });
			const conv3 = generateConversation({ id: '3' });
			setConversationsInEmailStore([conv1, conv2, conv3], false);

			const { result } = renderHook(usePreviewHeaderNavigation, {
				initialProps: {
					itemIds: ['1', '2', '3'],
					hasMore: false,
					folderId: '2',
					currentItemId: '3',
					itemsType: 'conversation',
					searchedInFolderStatus: 'fulfilled'
				}
			});
			await waitFor(() => {
				expect(result.current.nextActionItem.tooltipLabel).toBe(
					'tooltip.list_navigation.noMoreEmails'
				);
			});
		});
		it('render a different tooltip when navigation is not available', async () => {
			const { result } = renderHook(usePreviewHeaderNavigation, {
				initialProps: {
					itemIds: [],
					hasMore: false,
					folderId: '2',
					currentItemId: '1',
					itemsType: 'conversation',
					searchedInFolderStatus: null
				}
			});
			await waitFor(() => {
				expect(result.current.previousActionItem.tooltipLabel).toBe(
					'tooltip.list_navigation.closeToNavigate'
				);
			});
		});
		it('render a different tooltip when is loading next emails', async () => {
			const { result } = renderHook(usePreviewHeaderNavigation, {
				initialProps: {
					itemIds: [],
					folderId: '2',
					currentItemId: '1',
					itemsType: 'conversation',
					hasMore: true,
					searchedInFolderStatus: 'fulfilled'
				}
			});
			await waitFor(() => {
				expect(result.current.nextActionItem.tooltipLabel).toBe(
					'tooltip.list_navigation.loadingNextEmail'
				);
			});
		});
		test('render a different tooltip when fails to load next emails', async () => {
			createSoapAPIInterceptorWithError('Search');
			const conv1 = generateConversation({ id: '1' });
			setConversationsInEmailStore([conv1], false);

			const { result } = renderHook(usePreviewHeaderNavigation, {
				initialProps: {
					itemIds: ['1'],
					folderId: '2',
					currentItemId: '1',
					itemsType: 'conversation',
					hasMore: true,
					searchedInFolderStatus: 'fulfilled'
				}
			});

			await waitFor(() =>
				expect(result.current.nextActionItem.tooltipLabel).toBe(
					'tooltip.list_navigation.unableToLoadNextEmail'
				)
			);
		});
		test('when it is the last item and hasMore it should call a search request', async () => {
			const interceptor = createSoapAPIInterceptor('Search', {});
			const conv1 = generateConversation({ id: '1' });
			setConversationsInEmailStore([conv1], true);

			renderHook(usePreviewHeaderNavigation, {
				initialProps: {
					itemIds: ['1'],
					folderId: '2',
					currentItemId: '1',
					itemsType: 'conversation',
					hasMore: true,
					searchedInFolderStatus: 'fulfilled'
				}
			});

			await waitFor(async () => {
				expect(await interceptor).toHaveProperty('query', 'inId:"2"');
			});
		});
		it('when it is the last item and it does not have more it should not call a search request', async () => {
			const conv1 = generateConversation({ id: '1' });
			setConversationsInEmailStore([conv1], false);

			const searchSpy = vi.spyOn(searchSoapApi, 'searchSoapApi');
			renderHook(usePreviewHeaderNavigation, {
				initialProps: {
					itemIds: ['1'],
					hasMore: false,
					folderId: '2',
					currentItemId: '1',
					itemsType: 'conversation',
					searchedInFolderStatus: 'fulfilled'
				}
			});

			await waitFor(() => {
				expect(searchSpy).not.toHaveBeenCalled();
			});
		});
		describe('calling the action', () => {
			it('will change the route with the next message id', async () => {
				const navigate = vi.fn();
				(reactRouterDom.useNavigate as Mock).mockReturnValue(navigate);
				const conv1 = generateConversation({ id: '1' });
				const conv2 = generateConversation({ id: '2' });
				const conv3 = generateConversation({ id: '3' });
				setConversationsInEmailStore([conv1, conv2, conv3], false);
				const { result } = renderHook(usePreviewHeaderNavigation, {
					initialProps: {
						itemIds: ['1', '2', '3'],
						hasMore: false,
						folderId: '2',
						currentItemId: '2',
						itemsType: 'conversation',
						searchedInFolderStatus: 'fulfilled'
					}
				});
				await act(async () => {
					result.current.nextActionItem.action();
				});
				await waitFor(() => {
					expect(navigate).toHaveBeenCalledWith('/mails/folder/2/conversation/3', {
						replace: true
					});
				});
			});
			it('will set the message as read if it was not', async () => {
				const convActionSpy = vi.spyOn(convRequest, 'convActionSoapApi');
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

				const { result } = renderHook(usePreviewHeaderNavigation, {
					initialProps: {
						itemIds: ['1', '2', '3'],
						hasMore: false,
						folderId: '2',
						currentItemId: '2',
						itemsType: 'conversation',
						searchedInFolderStatus: 'fulfilled'
					}
				});
				await act(async () => {
					result.current.nextActionItem.action();
				});
				await waitFor(() => {
					expect(convActionSpy).toHaveBeenCalledWith({ ids: ['3'], operation: 'read' });
				});
			});
			it('will not set the message as read if it was already', async () => {
				const convActionSpy = vi.spyOn(convRequest, 'convActionSoapApi');
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

				const { result } = renderHook(usePreviewHeaderNavigation, {
					initialProps: {
						itemIds: ['1', '2', '3'],
						hasMore: false,
						folderId: '2',
						currentItemId: '2',
						itemsType: 'conversation',
						searchedInFolderStatus: 'fulfilled'
					}
				});
				result.current.nextActionItem.action();
				await waitFor(() => {
					expect(convActionSpy).not.toHaveBeenCalled();
				});
			});
		});
	});
});
