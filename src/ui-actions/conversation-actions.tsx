/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Account, getBridgedFunctions, replaceHistory, t } from '@zextras/carbonio-shell-ui';
import { forEach, isArray, map } from 'lodash';
import React from 'react';
import { errorPage } from '../commons/preview-eml/error-page';
import { getContentForPrint } from '../commons/print-conversation';
import { ConversationActionsDescriptors } from '../constants';
import { convAction, getMsgsForPrint } from '../store/actions';
import { AppDispatch, StoreProvider } from '../store/redux';
import { ConvActionReturnType, Conversation, MailMessage } from '../types';
import DeleteConvConfirm from './delete-conv-modal';
import MoveConvMessage from './move-conv-msg';

type ConvActionIdsType = Array<string>;
type ConvActionValueType = string | boolean;
type DeselectAllType = () => void;
type CloseEditorType = () => void;
type ConvActionPropType = {
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
		? ConversationActionsDescriptors.UNFLAG
		: ConversationActionsDescriptors.FLAG;
	return {
		id: actDescriptor.id,
		icon: value ? 'Flag' : 'FlagOutline',
		label: value ? t('action.unflag', actDescriptor.desc) : t('action.flag', actDescriptor.desc),
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
		? ConversationActionsDescriptors.MARK_AS_UNREAD
		: ConversationActionsDescriptors.MARK_AS_READ;
	return {
		id: actDescriptor.id,
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
	conversation,
	account
}: {
	conversation: Conversation | Conversation[];
	account: Account;
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
						account,
						conversations: conversation
					});
					if (printWindow && printWindow.top) {
						printWindow.top.document.title = 'Carbonio';
						printWindow.document.write(content);
					}
				})
				.catch((err) => {
					const errorContent = errorPage;
					if (printWindow) printWindow.document.write(errorContent);
				});
		}
	};
}

export function setConversationsSpam({
	ids,
	value,
	dispatch,
	deselectAll
}: Pick<ConvActionPropType, 'ids' | 'dispatch' | 'value' | 'deselectAll'>): ConvActionReturnType {
	return {
		id: 'spam-conversations',
		icon: value ? 'AlertCircleOutline' : 'AlertCircle',
		label: value
			? t('action.mark_as_non_spam', 'Not spam')
			: t('action.mark_as_spam', 'Mark as spam'),
		onClick: (): void => {
			let notCanceled = true;

			const infoSnackbar = (hideButton = false): void => {
				getBridgedFunctions()?.createSnackbar({
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
							getBridgedFunctions()?.createSnackbar({
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
	};
}

export function moveConversationToTrash({
	ids,
	dispatch,
	deselectAll,
	folderId
}: Pick<
	ConvActionPropType,
	'ids' | 'dispatch' | 'folderId' | 'deselectAll'
>): ConvActionReturnType {
	return {
		id: 'trash-conversations',
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
						getBridgedFunctions()?.createSnackbar({
							key: `edit`,
							replace: true,
							type: 'success',
							hideButton: true,
							label: t('messages.snackbar.email_restored', 'E-mail restored in destination folder'),
							autoHideTimeout: 3000
						});
					} else {
						getBridgedFunctions()?.createSnackbar({
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
					getBridgedFunctions()?.createSnackbar({
						key: `trash-${ids}`,
						replace: true,
						type: 'info',
						actionLabel: t('label.undo', 'Undo'),
						label: t('snackbar.email_moved_to_trash', 'E-mail moved to Trash'),
						autoHideTimeout: 5000,
						onActionClick: (): void => restoreConversation()
					});
				} else {
					getBridgedFunctions()?.createSnackbar({
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
}

export function moveConversationToFolder({
	ids,
	folderId,
	dispatch,
	isRestore,
	deselectAll
}: Pick<
	ConvActionPropType,
	'ids' | 'dispatch' | 'isRestore' | 'deselectAll' | 'folderId'
>): ConvActionReturnType {
	return {
		id: 'move-conversations',
		icon: isRestore ? 'RestoreOutline' : 'MoveOutline',
		label: isRestore ? t('label.restore', 'Restore') : t('label.move', 'Move'),
		onClick: (): void => {
			const closeModal = getBridgedFunctions()?.createModal(
				{
					maxHeight: '90vh',
					children: (
						<StoreProvider>
							<MoveConvMessage
								folderId={folderId}
								selectedIDs={ids}
								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-ignore
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
	};
}

export function deleteConversationPermanently({
	ids,
	deselectAll
}: Pick<ConvActionPropType, 'ids' | 'deselectAll'>): ConvActionReturnType {
	return {
		id: 'delete-conversations',
		icon: 'DeletePermanentlyOutline',
		label: t('label.delete_permanently', 'Delete permanently'),
		onClick: (): void => {
			const closeModal = getBridgedFunctions()?.createModal(
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
	};
}
