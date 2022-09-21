/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';
import {
	FOLDERS,
	replaceHistory,
	t,
	getBridgedFunctions,
	Tags,
	Account
} from '@zextras/carbonio-shell-ui';
import { forEach, isArray, map } from 'lodash';
import { Dispatch } from '@reduxjs/toolkit';
import { convAction, getMsgsForPrint } from '../store/actions';
import DeleteConvConfirm from './delete-conv-modal';
import MoveConvMessage from './move-conv-msg-modal/move-conv-msg';
import { getContentForPrint, getErrorPage } from '../commons/print-conversation';
import { applyTag } from './tag-actions';
import { StoreProvider } from '../store/redux';
import { Conversation, MailMessage } from '../types';

type ConvActionIdsType = Array<string>;
type ConvActionValueType = string | boolean;
type DeselectAllType = () => void;
type CloseEditorType = () => void;
type ConvActionPropType = {
	ids: ConvActionIdsType;
	id: string | ConvActionIdsType;
	value: ConvActionValueType;
	dispatch: Dispatch;
	folderId: string;
	shouldReplaceHistory: boolean;
	deselectAll: DeselectAllType;
	conversationId: string;
	closeEditor: CloseEditorType;
	isRestore: boolean;
	message: MailMessage;
	disabled: boolean;
};

type ConvActionReturnType = {
	id: string;
	icon: string;
	label: string;
	disabled?: boolean;
	click: (ev: MouseEvent) => void;
	customComponent?: JSX.Element;
};

export function setConversationsFlag({
	ids,
	value,
	dispatch
}: Pick<ConvActionPropType, 'ids' | 'value' | 'dispatch'>): ConvActionReturnType {
	return {
		id: 'flag-conversation',
		icon: value ? 'FlagOutline' : 'Flag',
		label: value ? t('action.unflag', 'Remove flag') : t('action.flag', 'Add flag'),
		click: (): void => {
			dispatch(
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
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
		click: (): void => {
			dispatch(
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
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
		click: (): void => {
			dispatch(
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
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
	// eslint-disable-next-line react-hooks/rules-of-hooks
	return {
		id: `read-conversations-${value}`,
		icon: value ? 'EmailOutline' : 'EmailReadOutline',
		label: value
			? t('action.mark_as_unread', 'Mark as unread')
			: t('action.mark_as_read', 'Mark as read'),
		click: (): void => {
			dispatch(
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				convAction({
					operation: `${value ? '!' : ''}read`,
					ids
				})
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
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
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		messageIds = map(conversation?.messages, (m) => m.id);
	}

	return {
		id: 'print-conversations',
		icon: 'PrinterOutline',
		label: t('action.print', 'Print'),
		click: (): void => {
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
					const errorContent = getErrorPage(t);
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
		click: (): void => {
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
					actionLabel: 'Undo',
					onActionClick: (): void => {
						notCanceled = false;
					}
				});
			};
			infoSnackbar();
			setTimeout((): void => {
				if (notCanceled) {
					dispatch(
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						convAction({
							operation: `${value ? '!' : ''}spam`,
							// operation: `spam`,
							ids
						})
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
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
		// first click, delete email
		click: (): void => {
			const restoreConversation = (): void => {
				dispatch(
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					convAction({
						operation: `move`,
						ids,
						parent: folderId
					})
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
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
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				convAction({
					operation: `trash`,
					ids
				})
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
			).then((res) => {
				if (res.type.includes('fulfilled')) {
					deselectAll();
					replaceHistory(`/folder/${folderId}/`);
					getBridgedFunctions()?.createSnackbar({
						key: `trash-${ids}`,
						replace: true,
						type: 'info',
						actionLabel: 'Undo',
						label: t('snackbar.email_moved_to_trash', 'E-mail moved to Trash'),
						autoHideTimeout: 5000,
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						onActionClick: (): void => restoreConversation(ids, dispatch, deselectAll)
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
	isRestore,
	deselectAll
}: Pick<
	ConvActionPropType,
	'ids' | 'dispatch' | 'isRestore' | 'deselectAll'
>): ConvActionReturnType {
	return {
		id: 'move-conversations',
		icon: isRestore ? 'RestoreOutline' : 'MoveOutline',
		label: isRestore ? t('label.restore', 'Restore') : t('label.move', 'Move'),
		click: (): void => {
			const closeModal = getBridgedFunctions()?.createModal(
				{
					maxHeight: '90vh',
					children: (
						<StoreProvider>
							<MoveConvMessage
								selectedIDs={ids}
								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-ignore
								onClose={(): void => closeModal()}
								isMessageView={false}
								isRestore={isRestore}
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

export function deleteConversationPermanently({
	ids,
	deselectAll
}: Pick<ConvActionPropType, 'ids' | 'deselectAll'>): ConvActionReturnType {
	return {
		id: 'delete-conversations',
		icon: 'DeletePermanentlyOutline',
		label: t('label.delete_permanently', 'Delete permanently'),
		click: (): void => {
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

type GetConvActionsType = {
	folderId: string;
	dispatch: Dispatch;
	deselectAll: () => void;
	account: Account;
	tags: Tags;
};
export const getActions = ({
	folderId,
	dispatch,
	deselectAll,
	account,
	tags
}: GetConvActionsType): any => {
	switch (folderId) {
		case FOLDERS.TRASH:
			return (conversation: Conversation): Array<any> => [
				[setConversationsFlag({ ids: [conversation.id], value: conversation.flagged, dispatch })],
				[
					setConversationsRead({
						ids: [conversation.id],
						value: conversation.read,
						dispatch,
						folderId,
						shouldReplaceHistory: true,
						deselectAll
					}),
					setConversationsFlag({
						ids: [conversation.id],
						value: conversation.flagged,

						dispatch
					}),
					applyTag({ tags, conversation }),
					setConversationsSpam({
						ids: [conversation.id],
						value: false,
						dispatch,
						deselectAll
					}),
					printConversation({
						conversation: [conversation],
						account
					}),
					moveConversationToFolder({
						ids: [conversation.id],
						dispatch,
						isRestore: true,
						deselectAll
					}),
					deleteConversationPermanently({
						ids: [conversation.id],
						deselectAll
					})
				]
			];
		case FOLDERS.SPAM:
			return (conversation: Conversation): Array<any> => [
				[
					moveConversationToTrash({
						ids: [conversation.id],
						dispatch,
						deselectAll,
						folderId
					}),
					setConversationsFlag({ ids: [conversation.id], value: conversation.flagged, dispatch })
				],
				[
					setConversationsRead({
						ids: [conversation.id],
						value: conversation.read,
						dispatch,
						folderId,
						shouldReplaceHistory: true,
						deselectAll
					}),
					setConversationsFlag({
						ids: [conversation.id],
						value: conversation.flagged,
						dispatch
					}),
					applyTag({ tags, conversation }),
					setConversationsSpam({
						ids: [conversation.id],
						value: true,

						dispatch,

						deselectAll
					}),

					printConversation({
						conversation: [conversation],
						account
					}),
					moveConversationToTrash({
						ids: [conversation.id],

						dispatch,

						deselectAll,
						folderId
					})
				]
			];

		case FOLDERS.DRAFTS:
			return (conversation: Conversation): Array<any> => [
				[
					moveConversationToTrash({
						ids: [conversation.id],

						dispatch,

						deselectAll,
						folderId
					}),
					setConversationsFlag({ ids: [conversation.id], value: conversation.flagged, dispatch })
				],
				[
					setConversationsFlag({
						ids: [conversation.id],
						value: conversation.flagged,

						dispatch
					}),
					applyTag({ tags, conversation }),
					moveConversationToTrash({
						ids: [conversation.id],
						dispatch,
						deselectAll,
						folderId
					}),
					printConversation({
						conversation: [conversation],
						account
					})
				]
			];
		case FOLDERS.INBOX:
		case FOLDERS.SENT:
		default:
			return (conversation: Conversation): Array<any> => [
				[
					setConversationsRead({
						ids: [conversation.id],
						value: conversation.read,
						dispatch,
						folderId,
						shouldReplaceHistory: true,
						deselectAll
					}),
					moveConversationToTrash({
						ids: [conversation.id],
						dispatch,
						deselectAll,
						folderId
					}),
					setConversationsFlag({ ids: [conversation.id], value: conversation.flagged, dispatch })
				],
				[
					applyTag({ tags, conversation }),
					setConversationsRead({
						ids: [conversation.id],
						value: conversation.read,
						dispatch,
						folderId,
						shouldReplaceHistory: true,
						deselectAll
					}),
					setConversationsFlag({
						ids: [conversation.id],
						value: conversation.flagged,
						dispatch
					}),
					setConversationsSpam({
						ids: [conversation.id],
						value: false,
						dispatch,
						deselectAll
					}),
					printConversation({
						conversation: [conversation],
						account
					}),
					moveConversationToFolder({
						ids: [conversation.id],
						dispatch,
						isRestore: false,
						deselectAll
					}),
					moveConversationToTrash({
						ids: [conversation.id],
						dispatch,
						deselectAll,
						folderId
					})
				]
			];
	}
};
