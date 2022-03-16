/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';
import { FOLDERS, replaceHistory } from '@zextras/carbonio-shell-ui';
import { forEach, isArray, map } from 'lodash';
import { convAction, getMsgsForPrint } from '../store/actions';
import DeleteConvConfirm from './delete-conv-modal';
import MoveConvMessage from './move-conv-msg-modal/move-conv-msg';
import { getContentForPrint } from '../commons/print-conversation';

export function setConversationsFlag(ids, value, t, dispatch) {
	return {
		id: 'flag-conversation',
		icon: value ? 'FlagOutline' : 'Flag',
		label: value ? t('action.unflag', 'Remove flag') : t('action.flag', 'Add flag'),
		click: () => {
			dispatch(
				convAction({
					operation: `${value ? '!' : ''}flag`,
					ids
				})
			);
		}
	};
}

export function setMultipleConversationsFlag(ids, disabled, t, dispatch) {
	return {
		id: 'flag--multiple-conversations',
		icon: 'Flag',
		label: t('action.flag', 'Add flag'),
		disabled,
		click: () => {
			dispatch(
				convAction({
					operation: `flag`,
					ids
				})
			);
		}
	};
}

export function unSetMultipleConversationsFlag(ids, disabled, t, dispatch) {
	return {
		id: 'unflag-multiple-conversations',
		icon: 'FlagOutline',
		label: t('action.unflag', 'Remove flag'),
		disabled,
		click: () => {
			dispatch(
				convAction({
					operation: `!flag`,
					ids
				})
			);
		}
	};
}

export function setConversationsRead(
	ids,
	value,
	t,
	dispatch,
	folderId,
	shouldReplaceHistory,
	deselectAll
) {
	// eslint-disable-next-line react-hooks/rules-of-hooks
	return {
		id: `read-conversations-${value}`,
		icon: value ? 'EmailOutline' : 'EmailReadOutline',
		label: value
			? t('action.mark_as_unread', 'Mark as unread')
			: t('action.mark_as_read', 'Mark as read'),
		click: () => {
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

export function printConversation({ t, conversation, account }) {
	let messageIds = [];

	if (isArray(conversation) && conversation.length > 0) {
		forEach(conversation, (conv) => {
			forEach(conv.messages, (m) => {
				messageIds.push(m.id);
			});
		});
	} else {
		messageIds = map(conversation.messages, (m) => m.id);
	}

	return {
		id: 'print-conversations',
		icon: 'PrinterOutline',
		label: t('action.print', 'Print'),
		click: () => {
			const printWindow = window.open('', '_blank');
			getMsgsForPrint({ ids: messageIds })
				.then((res) => {
					const content = getContentForPrint({
						messages: res,
						account,
						conversations: conversation
					});
					printWindow.top.document.title = 'Carbonio';
					printWindow.document.write(content);
				})
				.catch((err) => {
					printWindow.top.document.title = 'Carbonio';
					printWindow.document.write(`<p style="color:red;"> ${err.message}</>`);
				});
		}
	};
}

export function setConversationsSpam(ids, value, t, dispatch, createSnackbar, deselectAll) {
	return {
		id: 'spam-conversations',
		icon: value ? 'AlertCircleOutline' : 'AlertCircle',
		label: value
			? t('action.mark_as_non_spam', 'Not spam')
			: t('action.mark_as_spam', 'Mark as spam'),
		click: () => {
			let notCanceled = true;

			const infoSnackbar = (hideButton = false) => {
				createSnackbar({
					key: `trash-${ids}`,
					replace: true,
					type: 'info',
					label: value
						? t('messages.snackbar.marked_as_non_spam', 'You’ve marked this e-mail as Not Spam')
						: t('messages.snackbar.marked_as_spam', 'You’ve marked this e-mail as Spam'),
					autoHideTimeout: 3000,
					hideButton,
					actionLabel: 'Undo',
					onActionClick: () => {
						notCanceled = false;
					}
				});
			};
			infoSnackbar();
			setTimeout(() => {
				if (notCanceled) {
					dispatch(
						convAction({
							operation: `${value ? '!' : ''}spam`,
							// operation: `spam`,
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
	};
}

export function moveConversationToTrash(
	ids,
	t,
	dispatch,
	createSnackbar,
	deselectAll,
	currentFolder
) {
	return {
		id: 'trash-conversations',
		icon: 'Trash2Outline',
		label: t('label.delete', 'Delete'),
		// first click, delete email
		click: () => {
			const restoreConversation = () => {
				dispatch(
					convAction({
						operation: `move`,
						ids,
						parent: currentFolder
					})
				).then((res) => {
					if (res.type.includes('fulfilled')) {
						deselectAll();
						replaceHistory(`/folder/${currentFolder}/conversation/${ids[0]}`);
						createSnackbar({
							key: `edit`,
							replace: true,
							type: 'success',
							hideButton: true,
							label: t('messages.snackbar.email_restored', 'E-mail restored in destination folder'),
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
					replaceHistory(`/folder/${currentFolder}/`);
					createSnackbar({
						key: `trash-${ids}`,
						replace: true,
						type: 'info',
						actionLabel: 'Undo',
						label: t('snackbar.email_moved_to_trash', 'E-mail moved to Trash'),
						autoHideTimeout: 5000,
						onActionClick: () => restoreConversation(ids, t, dispatch, createSnackbar, deselectAll)
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
}

export function moveConversationToFolder(
	selectedIDs,
	t,
	dispatch,
	isRestore,
	createModal,
	deselectAll
) {
	return {
		id: 'move-conversations',
		icon: isRestore ? 'RestoreOutline' : 'MoveOutline',
		label: isRestore ? t('label.restore', 'Restore') : t('label.move', 'Move'),
		click: () => {
			const closeModal = createModal(
				{
					maxHeight: '90vh',
					children: (
						<>
							<MoveConvMessage
								selectedIDs={selectedIDs}
								onClose={() => closeModal()}
								dispatch={dispatch}
								isMessageView={false}
								isRestore={isRestore}
								deselectAll={deselectAll}
							/>
						</>
					)
				},
				true
			);
		}
	};
}

export function deleteConversationPermanently(selectedIDs, t, dispatch, createModal, deselectAll) {
	return {
		id: 'delete-conversations',
		icon: 'DeletePermanentlyOutline',
		label: t('label.delete_permanently', 'Delete permanently'),
		click: () => {
			const closeModal = createModal(
				{
					children: (
						<>
							<DeleteConvConfirm
								selectedIDs={selectedIDs}
								dispatch={dispatch}
								isMessageView={false}
								onClose={() => closeModal()}
								deselectAll={deselectAll}
							/>
						</>
					)
				},
				true
			);
		}
	};
}

export const getActions = (
	folderId,
	t,
	dispatch,
	createSnackbar,
	createModal,
	deselectAll,
	timezone,
	account
) => {
	switch (folderId) {
		case FOLDERS.TRASH:
			return (conversation) => [
				[setConversationsFlag([conversation.id], conversation.flagged, t, dispatch)],
				[
					setConversationsRead(
						[conversation.id],
						conversation.read,
						t,
						dispatch,
						folderId,
						true,
						deselectAll
					),
					setConversationsFlag([conversation.id], conversation.flagged, t, dispatch),
					setConversationsSpam([conversation.id], false, t, dispatch, createSnackbar, deselectAll),
					printConversation({
						t,
						conversation: [conversation],
						account
					}),
					moveConversationToFolder([conversation.id], t, dispatch, true, createModal, deselectAll),
					deleteConversationPermanently([conversation.id], t, dispatch, createModal, deselectAll)
				]
			];
		case FOLDERS.SPAM:
			return (conversation) => [
				[
					moveConversationToTrash(
						[conversation.id],
						t,
						dispatch,
						createSnackbar,
						deselectAll,
						folderId
					),
					setConversationsFlag([conversation.id], conversation.flagged, t, dispatch)
				],
				[
					setConversationsRead(
						[conversation.id],
						conversation.read,
						t,
						dispatch,
						folderId,
						true,
						deselectAll
					),
					setConversationsFlag([conversation.id], conversation.flagged, t, dispatch),
					setConversationsSpam([conversation.id], true, t, dispatch, createSnackbar, deselectAll),

					printConversation({
						t,
						conversation: [conversation],
						account
					}),
					moveConversationToTrash(
						[conversation.id],
						t,
						dispatch,
						createSnackbar,
						deselectAll,
						folderId
					)
				]
			];

		case FOLDERS.DRAFTS:
			return (conversation) => [
				[
					moveConversationToTrash(
						[conversation.id],
						t,
						dispatch,
						createSnackbar,
						deselectAll,
						folderId
					),
					setConversationsFlag([conversation.id], conversation.flagged, t, dispatch)
				],
				[
					setConversationsFlag([conversation.id], conversation.flagged, t, dispatch),
					moveConversationToTrash(
						[conversation.id],
						t,
						dispatch,
						createSnackbar,
						deselectAll,
						folderId
					),
					printConversation({
						t,
						conversation: [conversation],
						account
					})
				]
			];
		case FOLDERS.INBOX:
		case FOLDERS.SENT:
		default:
			return (conversation) => [
				[
					setConversationsRead(
						[conversation.id],
						conversation.read,
						t,
						dispatch,
						folderId,
						true,
						deselectAll
					),
					moveConversationToTrash(
						[conversation.id],
						t,
						dispatch,
						createSnackbar,
						deselectAll,
						folderId
					),
					setConversationsFlag([conversation.id], conversation.flagged, t, dispatch)
				],
				[
					setConversationsRead(
						[conversation.id],
						conversation.read,
						t,
						dispatch,
						folderId,
						true,
						deselectAll
					),
					setConversationsFlag([conversation.id], conversation.flagged, t, dispatch),
					setConversationsSpam([conversation.id], false, t, dispatch, createSnackbar, deselectAll),
					printConversation({
						t,
						conversation: [conversation],
						account
					}),
					moveConversationToTrash(
						[conversation.id],
						t,
						dispatch,
						createSnackbar,
						deselectAll,
						folderId
					)
				]
			];
	}
};
