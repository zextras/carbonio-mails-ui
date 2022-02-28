/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';
import { Text } from '@zextras/carbonio-design-system';
import { FOLDERS, replaceHistory } from '@zextras/carbonio-shell-ui';
import { msgAction } from '../store/actions';
import { ActionsType } from '../types/participant';
import { sendMsg } from '../store/actions/send-msg';
import MoveConvMessage from './move-conv-msg-modal/move-conv-msg';
import DeleteConvConfirm from './delete-conv-modal';
import RedirectAction from './redirect-message-action';

export function setMsgRead(ids, value, t, dispatch, folderId, shouldReplaceHistory, deselectAll) {
	return {
		id: 'message-mark_as_read',
		icon: value ? 'EmailOutline' : 'EmailReadOutline',
		label: value
			? t('action.mark_as_unread', 'Mark as unread')
			: t('action.mark_as_read', 'Mark as read'),
		click: (ev) => {
			if (ev) ev.preventDefault();
			dispatch(
				msgAction({
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

export function setMsgFlag(ids, value, t, dispatch) {
	return {
		id: 'message-flag',
		icon: value ? 'FlagOutline' : 'Flag',
		label: value ? t('action.unflag', 'Remove flag') : t('action.flag', 'Add flag'),
		click: (ev) => {
			if (ev) ev.preventDefault();
			dispatch(
				msgAction({
					operation: `${value ? '!' : ''}flag`,
					ids
				})
			);
		}
	};
}

export function setMsgAsSpam(ids, value, t, dispatch, createSnackbar) {
	return {
		id: 'message-mark_as_spam',
		icon: value ? 'AlertCircleOutline' : 'AlertCircle',
		label: value
			? t('action.mark_as_non_spam', 'Not spam')
			: t('action.mark_as_spam', 'Mark as spam'),
		click: (ev) => {
			if (ev) ev.preventDefault();
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
					actionLabel: t('label.undo', 'Undo'),
					onActionClick: () => {
						notCanceled = false;
					}
				});
			};
			infoSnackbar();
			setTimeout(() => {
				if (notCanceled) {
					dispatch(
						msgAction({
							operation: `${value ? '!' : ''}spam`,
							// operation: `spam`,
							ids
						})
					).then((res) => {
						if (!res.type.includes('fulfilled')) {
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

export function printMsg(id, t, timezone) {
	return {
		id: 'message-print',
		icon: 'PrinterOutline',
		label: t('action.print', 'Print'),
		click: (ev) => {
			if (ev) ev.preventDefault();
			window.open(`/h/printmessage?id=${id}&tz=${timezone}`, '_blank');
		}
	};
}

export function showOriginalMsg(id, t) {
	return {
		id: 'message-show_original',
		icon: 'CodeOutline',
		label: t('action.show_original', 'Show original'),
		click: (ev) => {
			ev.preventDefault();
			window.open(`/service/home/~/?auth=co&view=text&id=${id}`, '_blank');
		}
	};
}

export function moveMsgToTrash(
	ids,
	t,
	dispatch,
	createSnackbar,
	deselectAll,
	parent,
	conversationId
) {
	const restoreMessage = () => {
		dispatch(
			msgAction({
				operation: 'move',
				ids,
				parent
			})
		).then((res) => {
			if (res.type.includes('fulfilled')) {
				replaceHistory(
					conversationId
						? `/folder/${parent}/conversation/${conversationId}`
						: `/folder/${parent}/conversation/-${ids[0]}`
				);
				createSnackbar({
					key: `move-${ids}`,
					replace: true,
					type: 'success',
					label: t('messages.snackbar.email_restored', 'E-mail restored in destination folder'),
					autoHideTimeout: 3000,
					hideButton: true
				});
			} else {
				createSnackbar({
					key: `move-${ids}`,
					replace: true,
					type: 'error',
					label: t('label.error_try_again', 'Something went wrong, please try again'),
					autoHideTimeout: 3000,
					hideButton: true
				});
			}
		});
	};
	return {
		id: 'message-trash',
		icon: 'Trash2Outline',
		label: t('label.delete', 'Delete'),
		click: (ev) => {
			if (ev) ev.preventDefault();

			dispatch(
				msgAction({
					operation: `trash`,
					ids
				})
			).then((res) => {
				if (res.type.includes('fulfilled')) {
					deselectAll();
					replaceHistory(`/folder/${parent}`);
					createSnackbar({
						key: `trash-${ids}`,
						replace: true,
						type: 'info',
						label: t('messages.snackbar.email_moved_to_trash', 'E-mail moved to Trash'),
						autoHideTimeout: 5000,
						hideButton: false,
						actionLabel: t('label.undo', 'Undo'),
						onActionClick: () => restoreMessage()
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

export function deleteMsg(ids, t, dispatch, createSnackbar, createModal) {
	return {
		id: 'message-delete',
		icon: 'Trash2Outline',
		label: t('label.delete', 'Delete'),
		click: (ev) => {
			if (ev) ev.preventDefault();
			const closeModal = createModal({
				title: t('header.delete_email', 'Delete e-mail'),
				confirmLabel: t('action.ok', 'Ok'),
				onConfirm: () => {
					dispatch(
						msgAction({
							operation: 'delete',
							ids
						})
					).then((res) => {
						closeModal();
						if (res.type.includes('fulfilled')) {
							createSnackbar({
								key: `trash-${ids}`,
								replace: true,
								type: 'info',
								label: t('messages.snackbar.message_deleted', 'Message deleted'),
								autoHideTimeout: 3000
							});
						} else {
							createSnackbar({
								key: `trash-${ids}`,
								replace: true,
								type: 'error',
								label: t('label.error_try_again', 'Something went wrong, please try again.'),
								autoHideTimeout: 3000
							});
						}
					});
				},
				onClose: () => {
					closeModal();
				},
				onSecondaryAction: () => {
					closeModal();
				},
				dismissLabel: t('label.cancel', 'Cancel'),
				children: (
					<>
						<Text overflow="break-word">
							{t(
								'messages.modal.delete.sure_delete_email',
								'Are you sure to delete the selected e-mail?'
							)}
						</Text>
						<Text overflow="break-word">
							{t(
								'messages.modal.delete.if_delete_lost_forever',
								'If you delete the e-mail, it will be lost forever.'
							)}
						</Text>
					</>
				)
			});
		}
	};
}

export function replyMsg(messageId, folderId, t) {
	return {
		id: 'message-reply',
		icon: 'UndoOutline',
		label: t('action.reply', 'Reply'),
		click: (ev) => {
			if (ev) ev.preventDefault();
			replaceHistory(`/folder/${folderId}/edit/${messageId}?action=${ActionsType.REPLY}`);
		}
	};
}

export function replyAllMsg(messageId, folderId, t) {
	return {
		id: 'message-reply_all',
		icon: 'ReplyAll',
		label: t('action.reply_all', 'Reply all'),
		click: (ev) => {
			if (ev) ev.preventDefault();
			replaceHistory(`/folder/${folderId}/edit/${messageId}?action=${ActionsType.REPLY_ALL}`);
		}
	};
}

export function forwardMsg(messageId, folderId, t) {
	return {
		id: 'message-forward',
		icon: 'Forward',
		label: t('action.forward', 'Forward'),
		click: (ev) => {
			if (ev) ev.preventDefault();
			replaceHistory(`/folder/${folderId}/edit/${messageId}?action=${ActionsType.FORWARD}`);
		}
	};
}

export function editAsNewMsg(messageId, folderId, t) {
	return {
		id: 'message-edit_as_new',
		icon: 'Edit2Outline',
		label: t('action.edit_as_new', 'Edit as new'),
		click: (ev) => {
			if (ev) ev.preventDefault();
			replaceHistory(`/folder/${folderId}/edit/${messageId}?action=${ActionsType.EDIT_AS_NEW}`);
		}
	};
}

export function editDraft(messageId, folderId, t) {
	return {
		id: 'message-edit_as_draft',
		icon: 'Edit2Outline',
		label: t('label.edit', 'Edit'),
		click: (ev) => {
			if (ev) ev.preventDefault();
			replaceHistory(`/folder/${folderId}/edit/${messageId}?action=${ActionsType.EDIT_AS_DRAFT}`);
		}
	};
}

export function sendDraft(id, msg, t, dispatch) {
	return {
		id: 'message-send',
		icon: 'PaperPlaneOutline',
		label: t('label.send', 'Send'),
		click: (ev) => {
			if (ev) ev.preventDefault();
			dispatch(
				sendMsg({
					editorId: id,
					msg
				})
			);
		}
	};
}

export function redirectMsg({ id, t, createModal }) {
	return {
		id: 'message-redirect',
		icon: 'CornerUpRight',
		label: t('action.redirect', 'Redirect'),
		click: (ev) => {
			if (ev) ev.preventDefault();
			const closeModal = createModal({
				maxHeight: '90vh',
				children: (
					<>
						<RedirectAction onClose={() => closeModal()} id={id} />
					</>
				)
			});
		}
	};
}

export function moveMessageToFolder(selectedIDs, t, dispatch, isRestore, createModal, deselectAll) {
	return {
		id: 'message-restore',
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
								isMessageView
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

export function deleteMessagePermanently(selectedIDs, t, dispatch, createModal, deselectAll) {
	return {
		id: 'message-delete-permanently',
		icon: 'DeletePermanentlyOutline',
		label: t('label.delete_permanently', 'Delete Permanently'),
		click: () => {
			const closeModal = createModal(
				{
					children: (
						<>
							<DeleteConvConfirm
								selectedIDs={selectedIDs}
								dispatch={dispatch}
								isMessageView
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
	ContactInput,
	deselectAll,
	timezone
) => {
	switch (folderId) {
		case FOLDERS.TRASH:
			return (message) => [
				[
					setMsgRead([message.id], message.read, t, dispatch, folderId, true, deselectAll),
					setMsgFlag([message.id], message.flagged, t, dispatch),
					replyMsg(message.id, folderId, t),
					forwardMsg(message.id, folderId, t),
					deleteMessagePermanently([message.id], t, dispatch, createModal, deselectAll),
					moveMessageToFolder([message.id], t, dispatch, true, createModal, deselectAll)
				],
				[
					setMsgRead([message.id], message.read, t, dispatch, folderId, true, deselectAll),
					setMsgFlag([message.id], message.flagged, t, dispatch),
					setMsgAsSpam([message.id], false, t, dispatch, createSnackbar),
					printMsg(message.id, t, timezone),
					// moveMsgToTrash([message.id], t, dispatch, createSnackbar),
					deleteMessagePermanently([message.id], t, dispatch, createModal, deselectAll),
					moveMessageToFolder([message.id], t, dispatch, true, createModal, deselectAll),
					replyMsg(message.id, folderId, t),
					replyAllMsg(message.id, folderId, t),
					forwardMsg(message.id, folderId, t),
					editAsNewMsg(message.id, folderId, t),
					// editDraft(message.id, folderId, t),
					sendDraft(message.id, message, t, dispatch),
					redirectMsg({ id: message.id, t, createModal })
				]
			];
		case FOLDERS.SPAM:
			return (message) => [
				[
					setMsgRead([message.id], message.read, t, dispatch, folderId, true, deselectAll),
					setMsgFlag([message.id], message.flagged, t, dispatch),
					setMsgAsSpam([message.id], true, t, dispatch, createSnackbar),
					deleteMsg([message.id], t, dispatch, createSnackbar, createModal)
					// printMsg(message.id, t, timezone),
					// showOriginalMsg(message.id, t)
				],
				[
					setMsgRead([message.id], message.read, t, dispatch, folderId, true, deselectAll),
					setMsgFlag([message.id], message.flagged, t, dispatch),
					setMsgAsSpam([message.id], true, t, dispatch, createSnackbar),
					printMsg(message.id, t, timezone),
					showOriginalMsg(message.id, t),
					moveMsgToTrash(
						[message.id],
						t,
						dispatch,
						createSnackbar,
						deselectAll,
						folderId,
						message.conversation
					),
					// deleteMsg([message.id], t, dispatch, createSnackbar, createModal),
					replyMsg(message.id, folderId, t),
					replyAllMsg(message.id, folderId, t),
					forwardMsg(message.id, folderId, t),
					editAsNewMsg(message.id, folderId, t),
					// editDraft(message.id, folderId, t),
					sendDraft(message.id, message, t, dispatch),
					redirectMsg({ id: message.id, t, createModal })
				]
			];
		case FOLDERS.DRAFTS:
			return (message) => [
				[
					editDraft(message.id, folderId, t, replaceHistory),
					sendDraft(message.id, message, t, dispatch),
					moveMsgToTrash(
						[message.id],
						t,
						dispatch,
						createSnackbar,
						deselectAll,
						folderId,
						message.conversation
					),
					setMsgFlag([message.id], message.flagged, t, dispatch)
					// printMsg(message.id, t, timezone)
				],
				[
					setMsgFlag([message.id], message.flagged, t, dispatch),
					moveMsgToTrash(
						[message.id],
						t,
						dispatch,
						createSnackbar,
						deselectAll,
						folderId,
						message.conversation
					),
					editDraft(message.id, folderId, t),
					sendDraft(message.id, message, t, dispatch),
					printMsg(message.id, t, timezone)
				]
			];
		case FOLDERS.SENT:
		case FOLDERS.INBOX:
		default:
			return (message) => [
				[
					replyMsg(message.id, folderId, t),
					replyAllMsg(message.id, folderId, t),
					forwardMsg(message.id, folderId, t),
					moveMsgToTrash(
						[message.id],
						t,
						dispatch,
						createSnackbar,
						deselectAll,
						folderId,
						message.conversation
					),
					setMsgRead(
						[message.id],
						message.read,
						t,
						dispatch,
						folderId,
						replaceHistory,
						deselectAll
					),
					setMsgFlag([message.id], message.flagged, t, dispatch)
					// showOriginalMsg(message.id, t)
				],
				[
					setMsgRead([message.id], message.read, t, dispatch, folderId, true, deselectAll),
					setMsgFlag([message.id], message.flagged, t, dispatch),
					setMsgAsSpam([message.id], false, t, dispatch, createSnackbar),
					printMsg(message.id, t, timezone),
					showOriginalMsg(message.id, t),
					moveMsgToTrash(
						[message.id],
						t,
						dispatch,
						createSnackbar,
						deselectAll,
						folderId,
						message.conversation
					),
					// deleteMsg([message.id], t, dispatch, createSnackbar, createModal),
					replyMsg(message.id, folderId, t),
					replyAllMsg(message.id, folderId, t),
					forwardMsg(message.id, folderId, t),
					editAsNewMsg(message.id, folderId, t),
					// editDraft(message.id, folderId, t),
					sendDraft(message.id, message, t, dispatch),
					redirectMsg({ id: message.id, t, createModal })
				]
			];
	}
};
