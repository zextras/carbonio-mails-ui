/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback } from 'react';

import { replaceHistory, t } from '@zextras/carbonio-shell-ui';
import { forEach, isArray, map } from 'lodash';

import DeleteConvConfirm from './delete-conv-modal';
import { errorPage } from './error-page';
import MoveConvMessage from './move-conv-msg';
import { getContentForPrint } from '../commons/print-conversation/print-conversation';
import { ConversationActionsDescriptors } from '../constants';
import { useUiUtilities } from '../hooks/use-ui-utilities';
import { convAction, getMsgsForPrint } from '../store/actions';
import { AppDispatch, StoreProvider } from '../store/redux';
import type { ConvActionReturnType, Conversation, MailMessage } from '../types';
import { ExtraWindowCreationParams, ExtraWindowsContextType } from '../types';
import { ConversationPreviewPanel } from '../views/app/detail-panel/conversation-preview-panel';

type ConvActionIdsType = Array<string>;
type ConvActionValueType = string | boolean;
type DeselectAllType = () => void;
type CloseEditorType = () => void;
export type ConvActionPropType = {
	ids: ConvActionIdsType;
	id: string | ConvActionIdsType;
	value: ConvActionValueType;
	dispatch: AppDispatch;
	folderId: string;
	shouldReplaceHistory: boolean;
	deselectAll: DeselectAllType;
	conversationId: string;
	closeEditor: CloseEditorType;
	isRestore: boolean;
	message: MailMessage;
	disabled: boolean;
};

export function setConversationsFlag({
	ids,
	value,
	dispatch
}: Pick<ConvActionPropType, 'ids' | 'value' | 'dispatch'>): ConvActionReturnType {
	const actDescriptor = value
		? ConversationActionsDescriptors.UNFLAG.id
		: ConversationActionsDescriptors.FLAG.id;
	return {
		id: actDescriptor,
		icon: value ? 'Flag' : 'FlagOutline',
		label: value ? t('action.unflag', 'Add flag') : t('action.flag', 'Remove flag'),
		onClick: (): void => {
			dispatch(
				convAction({
					operation: `${value ? '!' : ''}flag`,
					ids
				})
			);
		}
	};
}

export const previewConversationOnSeparatedWindow = (
	conversationId: string,
	folderId: string,
	subject: string,
	createWindow: ExtraWindowsContextType['createWindow']
): void => {
	if (!createWindow) {
		return;
	}

	const createWindowParams: ExtraWindowCreationParams = {
		name: `conversation-${conversationId}`,
		returnComponent: false,
		children: <ConversationPreviewPanel conversationId={conversationId} folderId={folderId} />,
		title: subject,
		closeOnUnmount: false
	};
	createWindow(createWindowParams);
};

export const previewConversationOnSeparatedWindowAction = (
	conversationId: string,
	folderId: string,
	subject: string,
	createWindow: ExtraWindowsContextType['createWindow']
): ConvActionReturnType => {
	const actDescriptor = ConversationActionsDescriptors.PREVIEW_ON_SEPARATED_WINDOW;
	return {
		id: actDescriptor.id,
		icon: 'BrowserOutline',
		label: t('action.preview_on_separated_window', 'Open on a new window'),
		onClick: (): void => {
			previewConversationOnSeparatedWindow(conversationId, folderId, subject, createWindow);
		}
	};
};

export function setMultipleConversationsFlag({
	ids,
	disabled,
	dispatch
}: Pick<ConvActionPropType, 'ids' | 'disabled' | 'dispatch'>): ConvActionReturnType {
	return {
		id: 'flag--multiple-conversations',
		icon: 'Flag',
		label: t('action.flag', 'Add flag'),
		disabled,
		onClick: (): void => {
			dispatch(
				convAction({
					operation: `flag`,
					ids
				})
			);
		}
	};
}

export function unSetMultipleConversationsFlag({
	ids,
	disabled,
	dispatch
}: Pick<ConvActionPropType, 'ids' | 'disabled' | 'dispatch'>): ConvActionReturnType {
	return {
		id: 'unflag-multiple-conversations',
		icon: 'FlagOutline',
		label: t('action.unflag', 'Remove flag'),
		disabled,
		onClick: (): void => {
			dispatch(
				convAction({
					operation: `!flag`,
					ids
				})
			);
		}
	};
}

export function setConversationsRead({
	ids,
	value,
	dispatch,
	folderId,
	shouldReplaceHistory,
	deselectAll
}: Pick<
	ConvActionPropType,
	'ids' | 'dispatch' | 'value' | 'folderId' | 'shouldReplaceHistory' | 'deselectAll'
>): ConvActionReturnType {
	const actDescriptor = value
		? ConversationActionsDescriptors.MARK_AS_UNREAD.id
		: ConversationActionsDescriptors.MARK_AS_READ.id;
	return {
		id: actDescriptor,
		icon: value ? 'EmailOutline' : 'EmailReadOutline',
		label: value
			? t('action.mark_as_unread', 'Mark as unread')
			: t('action.mark_as_read', 'Mark as read'),
		onClick: (): void => {
			dispatch(
				convAction({
					operation: `${value ? '!' : ''}read`,
					ids
				})
			).then((res) => {
				deselectAll && deselectAll();
				if (res.type.includes('fulfilled') && shouldReplaceHistory) {
					replaceHistory(`/folder/${folderId}`);
				}
			});
		}
	};
}

export function printConversation({
	conversation
}: {
	conversation: Conversation | Conversation[];
}): ConvActionReturnType {
	let messageIds: Array<string> = [];

	if (isArray(conversation) && conversation.length > 0) {
		forEach(conversation, (conv) => {
			forEach(conv.messages, (m) => {
				messageIds.push(m.id);
			});
		});
	} else {
		messageIds = map((conversation as Conversation)?.messages, (m) => m.id);
	}

	return {
		id: 'print-conversations',
		icon: 'PrinterOutline',
		label: t('action.print', 'Print'),
		onClick: (): void => {
			const printWindow = window.open('', '_blank');
			getMsgsForPrint({ ids: messageIds })
				.then((res) => {
					const content = getContentForPrint({
						messages: res,
						conversations: conversation,
						isMsg: false
					});
					if (printWindow?.top) {
						printWindow.top.document.title = 'Carbonio';
						printWindow.document.write(content);
					}
				})
				.catch(() => {
					if (printWindow) {
						printWindow.document.write(errorPage);
					}
				});
		}
	};
}

export const useSetConversationSpam = (): ((
	arg: Pick<ConvActionPropType, 'ids' | 'dispatch' | 'value' | 'deselectAll'>
) => ConvActionReturnType) => {
	const { createSnackbar } = useUiUtilities();
	return useCallback(
		({ ids, value, dispatch, deselectAll }) => ({
			id: 'spam-conversations',
			icon: value ? 'AlertCircleOutline' : 'AlertCircle',
			label: value
				? t('action.mark_as_non_spam', 'Not spam')
				: t('action.mark_as_spam', 'Mark as spam'),
			onClick: (): void => {
				let notCanceled = true;

				const infoSnackbar = (hideButton = false): void => {
					createSnackbar({
						key: `trash-${ids}`,
						replace: true,
						type: 'info',
						label: value
							? t('messages.snackbar.marked_as_non_spam', 'You’ve marked this e-mail as Not Spam')
							: t('messages.snackbar.marked_as_spam', 'You’ve marked this e-mail as Spam'),
						autoHideTimeout: 3000,
						hideButton,
						actionLabel: t('label.undo', 'Undo'),
						onActionClick: (): void => {
							notCanceled = false;
						}
					});
				};
				infoSnackbar();
				setTimeout((): void => {
					if (notCanceled) {
						dispatch(
							convAction({
								operation: `${value ? '!' : ''}spam`,
								ids
							})
						).then((res) => {
							if (res.type.includes('fulfilled')) {
								deselectAll();
							} else {
								createSnackbar({
									key: `trash-${ids}`,
									replace: true,
									type: 'error',
									label: t('label.error_try_again', 'Something went wrong, please try again'),
									autoHideTimeout: 3000
								});
							}
						});
					}
				}, 3000);
			}
		}),
		[createSnackbar]
	);
};

export const useMoveConversationToTrash = (): ((
	conversation: Pick<ConvActionPropType, 'ids' | 'dispatch' | 'deselectAll' | 'folderId'>
) => ConvActionReturnType) => {
	const { createSnackbar } = useUiUtilities();

	return useCallback(
		({ ids, dispatch, deselectAll, folderId }) => {
			const actDescriptor = ConversationActionsDescriptors.MOVE_TO_TRASH.id;

			return {
				id: actDescriptor,
				icon: 'Trash2Outline',
				label: t('label.delete', 'Delete'),
				onClick: (): void => {
					const restoreConversation = (): void => {
						dispatch(
							convAction({
								operation: `move`,
								ids,
								parent: folderId
							})
						).then((res) => {
							if (res.type.includes('fulfilled')) {
								deselectAll();
								replaceHistory(`/folder/${folderId}/conversation/${ids[0]}`);
								createSnackbar({
									key: `edit`,
									replace: true,
									type: 'success',
									hideButton: true,
									label: t(
										'messages.snackbar.email_restored',
										'E-mail restored in destination folder'
									),
									autoHideTimeout: 3000
								});
							} else {
								createSnackbar({
									key: `edit`,
									replace: true,
									hideButton: true,
									type: 'error',
									label: t('label.error_try_again', 'Something went wrong, please try again.'),
									autoHideTimeout: 3000
								});
							}
						});
					};
					dispatch(
						convAction({
							operation: `trash`,
							ids
						})
					).then((res) => {
						if (res.type.includes('fulfilled')) {
							deselectAll();
							replaceHistory(`/folder/${folderId}/`);
							createSnackbar({
								key: `trash-${ids}`,
								replace: true,
								type: 'info',
								actionLabel: t('label.undo', 'Undo'),
								label: t('snackbar.email_moved_to_trash', 'E-mail moved to Trash'),
								autoHideTimeout: 5000,
								onActionClick: (): void => restoreConversation()
							});
						} else {
							createSnackbar({
								key: `trash-${ids}`,
								replace: true,
								type: 'error',
								label: t('label.error_try_again', 'Something went wrong, please try again'),
								autoHideTimeout: 3000,
								hideButton: true
							});
						}
					});
				}
			};
		},
		[createSnackbar]
	);
};

export const useMoveConversationToFolder = (): ((
	conversation: Pick<
		ConvActionPropType,
		'ids' | 'dispatch' | 'isRestore' | 'deselectAll' | 'folderId'
	>
) => ConvActionReturnType) => {
	const { createModal } = useUiUtilities();
	return useCallback(
		({ ids, folderId, dispatch, isRestore, deselectAll }) => ({
			id: 'move-conversations',
			icon: isRestore ? 'RestoreOutline' : 'MoveOutline',
			label: isRestore ? t('label.restore', 'Restore') : t('label.move', 'Move'),
			onClick: (): void => {
				const closeModal = createModal(
					{
						maxHeight: '90vh',
						size: 'medium',
						children: (
							<StoreProvider>
								<MoveConvMessage
									folderId={folderId}
									selectedIDs={ids}
									onClose={(): void => closeModal()}
									isMessageView={false}
									isRestore={isRestore}
									deselectAll={deselectAll}
									dispatch={dispatch}
								/>
							</StoreProvider>
						)
					},
					true
				);
			}
		}),
		[createModal]
	);
};

export const useDeleteConversationPermanently = (): ((
	conversation: Pick<ConvActionPropType, 'ids' | 'deselectAll'>
) => ConvActionReturnType) => {
	const { createModal } = useUiUtilities();

	return useCallback(
		({ ids, deselectAll }) => ({
			id: 'delete-conversations',
			icon: 'DeletePermanentlyOutline',
			label: t('label.delete_permanently', 'Delete permanently'),
			onClick: (): void => {
				const closeModal = createModal(
					{
						children: (
							<StoreProvider>
								<DeleteConvConfirm
									selectedIDs={ids}
									isMessageView={false}
									// eslint-disable-next-line @typescript-eslint/ban-ts-comment
									// @ts-ignore
									onClose={(): void => closeModal()}
									deselectAll={deselectAll}
								/>
							</StoreProvider>
						)
					},
					true
				);
			}
		}),
		[createModal]
	);
};
