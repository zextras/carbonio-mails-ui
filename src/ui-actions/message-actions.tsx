/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';
import { Text } from '@zextras/carbonio-design-system';
import {
	Account,
	FOLDERS,
	getBridgedFunctions,
	replaceHistory,
	Tags
} from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';
import { Dispatch } from '@reduxjs/toolkit';
import { getMsgsForPrint, msgAction } from '../store/actions';
import { ActionsType } from '../commons/utils';
import { sendMsg } from '../store/actions/send-msg';
import MoveConvMessage from './move-conv-msg-modal/move-conv-msg';
import DeleteConvConfirm from './delete-conv-modal';
import RedirectAction from './redirect-message-action';
import { getContentForPrint, getErrorPage } from '../commons/print-conversation';
import { applyTag } from './tag-actions';
import { MailMessage } from '../types';

type MessageActionIdsType = Array<string>;
type MessageActionValueType = string | boolean;
type DeselectAllType = () => void;
type CloseEditorType = () => void;
type MessageActionPropType = {
	ids: MessageActionIdsType;
	id?: string | MessageActionIdsType;
	value?: MessageActionValueType;
	dispatch: Dispatch;
	folderId?: string;
	shouldReplaceHistory?: boolean;
	deselectAll?: DeselectAllType;
	conversationId?: string;
	closeEditor?: CloseEditorType;
	isRestore?: boolean;
	message?: MailMessage;
};

type MessageActionReturnType = {
	id: string;
	icon: string;
	label: string;
	click: (ev?: MouseEvent) => void;
};
export const setMsgRead = ({
	ids,
	value,
	dispatch,
	folderId,
	shouldReplaceHistory = false,
	deselectAll
}: MessageActionPropType): MessageActionReturnType => ({
	id: 'message-mark_as_read',
	icon: value ? 'EmailOutline' : 'EmailReadOutline',
	label: value
		? getBridgedFunctions()?.t('action.mark_as_unread', 'Mark as unread')
		: getBridgedFunctions()?.t('action.mark_as_read', 'Mark as read'),
	click: (ev): void => {
		if (ev) ev.preventDefault();
		dispatch(
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			msgAction({
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
});

export function setMsgFlag({
	ids,
	value,
	dispatch
}: Omit<
	MessageActionPropType,
	'folderId' | 'shouldReplaceHistory' | 'deselectAll'
>): MessageActionReturnType {
	return {
		id: 'message-flag',
		icon: value ? 'FlagOutline' : 'Flag',
		label: value
			? getBridgedFunctions()?.t('action.unflag', 'Remove flag')
			: getBridgedFunctions()?.t('action.flag', 'Add flag'),
		click: (ev): void => {
			if (ev) ev.preventDefault();
			dispatch(
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				msgAction({
					operation: `${value ? '!' : ''}flag`,
					ids
				})
			);
		}
	};
}

export function setMsgAsSpam({
	ids,
	value,
	dispatch,
	shouldReplaceHistory = true,
	folderId
}: MessageActionPropType): MessageActionReturnType {
	return {
		id: 'message-mark_as_spam',
		icon: value ? 'AlertCircleOutline' : 'AlertCircle',
		label: value
			? getBridgedFunctions()?.t('action.mark_as_non_spam', 'Not spam')
			: getBridgedFunctions()?.t('action.mark_as_spam', 'Mark as spam'),
		click: (ev): void => {
			if (ev) ev.preventDefault();
			let notCanceled = true;

			const infoSnackbar = (hideButton = false): void => {
				getBridgedFunctions()?.createSnackbar({
					key: `trash-${ids}`,
					replace: true,
					type: 'info',
					label: value
						? getBridgedFunctions()?.t(
								'messages.snackbar.marked_as_non_spam',
								'You’ve marked this e-mail as Not Spam'
						  )
						: getBridgedFunctions()?.t(
								'messages.snackbar.marked_as_spam',
								'You’ve marked this e-mail as Spam'
						  ),
					autoHideTimeout: 3000,
					hideButton,
					actionLabel: getBridgedFunctions()?.t('label.undo', 'Undo'),
					onActionClick: () => {
						notCanceled = false;
					}
				});
			};
			infoSnackbar();
			setTimeout(() => {
				if (notCanceled) {
					dispatch(
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						msgAction({
							operation: `${value ? '!' : ''}spam`,
							// operation: `spam`,
							ids
						}) // eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
					).then((res) => {
						if (res.type.includes('fulfilled') && shouldReplaceHistory) {
							replaceHistory(`/folder/${folderId}`);
						}
						if (!res.type.includes('fulfilled')) {
							getBridgedFunctions()?.createSnackbar({
								key: `trash-${ids}`,
								replace: true,
								type: 'error',
								label: getBridgedFunctions()?.t(
									'label.error_try_again',
									'Something went wrong, please try again'
								),
								autoHideTimeout: 3000
							});
						}
					});
				}
			}, 3000);
		}
	};
}

export function printMsg({
	message,
	account
}: {
	account: Account;
	message: MailMessage;
}): MessageActionReturnType {
	const conversations = map([message], (msg) => ({
		conversation: msg.conversation,
		subject: msg.subject
	}));
	return {
		id: 'message-print',
		icon: 'PrinterOutline',
		label: getBridgedFunctions()?.t('action.print', 'Print'),
		click: (): void => {
			const printWindow = window.open('', '_blank');
			getMsgsForPrint({ ids: [message.id] })
				.then((res) => {
					const content = getContentForPrint({
						messages: res,
						account,
						conversations,
						isMsg: true
					});
					if (printWindow && printWindow?.top) {
						printWindow.top.document.title = 'Carbonio';
						printWindow.document.write(content);
					}
				})
				.catch(() => {
					const errorContent = getErrorPage(getBridgedFunctions()?.t);
					if (printWindow) printWindow.document.write(errorContent);
				});
		}
	};
}

export function showOriginalMsg({ id }: { id: string }): MessageActionReturnType {
	return {
		id: 'message-show_original',
		icon: 'CodeOutline',
		label: getBridgedFunctions()?.t('action.show_original', 'Show original'),
		click: (ev): void => {
			if (ev) ev.preventDefault();
			window.open(`/service/home/~/?auth=co&view=text&id=${id}`, '_blank');
		}
	};
}

export function moveMsgToTrash({
	ids,
	dispatch,
	deselectAll,
	folderId,
	conversationId,
	closeEditor
}: MessageActionPropType): MessageActionReturnType {
	const restoreMessage = (): void => {
		dispatch(
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			msgAction({
				operation: 'move',
				ids,
				folderId
			})
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
		).then((res) => {
			if (res.type.includes('fulfilled')) {
				closeEditor &&
					replaceHistory(
						conversationId
							? `/folder/${folderId}/conversation/${conversationId}`
							: `/folder/${folderId}/conversation/-${ids[0]}`
					);
				getBridgedFunctions()?.createSnackbar({
					key: `move-${ids}`,
					replace: true,
					type: 'success',
					label: getBridgedFunctions()?.t(
						'messages.snackbar.email_restored',
						'E-mail restored in destination folder'
					),
					autoHideTimeout: 3000,
					hideButton: true
				});
			} else {
				getBridgedFunctions()?.createSnackbar({
					key: `move-${ids}`,
					replace: true,
					type: 'error',
					label: getBridgedFunctions()?.t(
						'label.error_try_again',
						'Something went wrong, please try again'
					),
					autoHideTimeout: 3000,
					hideButton: true
				});
			}
		});
	};
	return {
		id: 'message-trash',
		icon: 'Trash2Outline',
		label: getBridgedFunctions()?.t('label.delete', 'Delete'),
		click: (ev): void => {
			if (ev) ev.preventDefault();

			dispatch(
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				msgAction({
					operation: `trash`,
					ids
				}) // eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
			).then((res) => {
				if (res.type.includes('fulfilled')) {
					deselectAll && deselectAll();
					closeEditor && replaceHistory(`/folder/${folderId}`);
					getBridgedFunctions()?.createSnackbar({
						key: `trash-${ids}`,
						replace: true,
						type: 'info',
						label: getBridgedFunctions()?.t(
							'messages.snackbar.email_moved_to_trash',
							'E-mail moved to Trash'
						),
						autoHideTimeout: 5000,
						hideButton: false,
						actionLabel: getBridgedFunctions()?.t('label.undo', 'Undo'),
						onActionClick: () => restoreMessage()
					});
				} else {
					getBridgedFunctions()?.createSnackbar({
						key: `trash-${ids}`,
						replace: true,
						type: 'error',
						label: getBridgedFunctions()?.t(
							'label.error_try_again',
							'Something went wrong, please try again'
						),
						autoHideTimeout: 3000,
						hideButton: true
					});
				}
			});
		}
	};
}

export function deleteMsg({
	ids,
	dispatch
}: Pick<MessageActionPropType, 'ids' | 'dispatch'>): MessageActionReturnType {
	return {
		id: 'message-delete',
		icon: 'Trash2Outline',
		label: getBridgedFunctions()?.t('label.delete', 'Delete'),
		click: (ev): void => {
			if (ev) ev.preventDefault();
			const closeModal = getBridgedFunctions()?.createModal({
				title: getBridgedFunctions()?.t('header.delete_email', 'Delete e-mail'),
				confirmLabel: getBridgedFunctions()?.t('action.ok', 'Ok'),
				onConfirm: () => {
					dispatch(
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						msgAction({
							operation: 'delete',
							ids
						}) // eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
					).then((res) => {
						// TODO: Fix it in DS
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						closeModal();
						if (res.type.includes('fulfilled')) {
							getBridgedFunctions()?.createSnackbar({
								key: `trash-${ids}`,
								replace: true,
								type: 'info',
								label: getBridgedFunctions()?.t(
									'messages.snackbar.message_deleted',
									'Message deleted'
								),
								autoHideTimeout: 3000
							});
						} else {
							getBridgedFunctions()?.createSnackbar({
								key: `trash-${ids}`,
								replace: true,
								type: 'error',
								label: getBridgedFunctions()?.t(
									'label.error_try_again',
									'Something went wrong, please try again.'
								),
								autoHideTimeout: 3000
							});
						}
					});
				},
				onClose: () => {
					// TODO: Fix it in DS
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					closeModal();
				},
				onSecondaryAction: () => {
					// TODO: Fix it in DS
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					closeModal();
				},
				dismissLabel: getBridgedFunctions()?.t('label.cancel', 'Cancel'),
				children: (
					<>
						<Text overflow="break-word">
							{getBridgedFunctions()?.t(
								'messages.modal.delete.sure_delete_email',
								'Are you sure to delete the selected e-mail?'
							)}
						</Text>
						<Text overflow="break-word">
							{getBridgedFunctions()?.t(
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

export function replyMsg({
	id,
	folderId
}: Pick<MessageActionPropType, 'id' | 'folderId'>): MessageActionReturnType {
	return {
		id: 'message-reply',
		icon: 'UndoOutline',
		label: getBridgedFunctions()?.t('action.reply', 'Reply'),
		click: (ev): void => {
			if (ev) ev.preventDefault();
			replaceHistory(`/folder/${folderId}/edit/${id}?action=${ActionsType.REPLY}`);
		}
	};
}

export function replyAllMsg({
	id,
	folderId
}: Pick<MessageActionPropType, 'id' | 'folderId'>): MessageActionReturnType {
	return {
		id: 'message-reply_all',
		icon: 'ReplyAll',
		label: getBridgedFunctions()?.t('action.reply_all', 'Reply all'),
		click: (ev): void => {
			if (ev) ev.preventDefault();
			replaceHistory(`/folder/${folderId}/edit/${id}?action=${ActionsType.REPLY_ALL}`);
		}
	};
}

export function forwardMsg({
	id,
	folderId
}: Pick<MessageActionPropType, 'id' | 'folderId'>): MessageActionReturnType {
	return {
		id: 'message-forward',
		icon: 'Forward',
		label: getBridgedFunctions()?.t('action.forward', 'Forward'),
		click: (ev): void => {
			if (ev) ev.preventDefault();
			replaceHistory(`/folder/${folderId}/edit/${id}?action=${ActionsType.FORWARD}`);
		}
	};
}

export function editAsNewMsg({
	id,
	folderId
}: Pick<MessageActionPropType, 'id' | 'folderId'>): MessageActionReturnType {
	return {
		id: 'message-edit_as_new',
		icon: 'Edit2Outline',
		label: getBridgedFunctions()?.t('action.edit_as_new', 'Edit as new'),
		click: (ev): void => {
			if (ev) ev.preventDefault();
			replaceHistory(`/folder/${folderId}/edit/${id}?action=${ActionsType.EDIT_AS_NEW}`);
		}
	};
}

export function editDraft({
	id,
	folderId
}: Pick<MessageActionPropType, 'id' | 'folderId'>): MessageActionReturnType {
	return {
		id: 'message-edit_as_draft',
		icon: 'Edit2Outline',
		label: getBridgedFunctions()?.t('label.edit', 'Edit'),
		click: (ev): void => {
			if (ev) ev.preventDefault();
			replaceHistory(`/folder/${folderId}/edit/${id}?action=${ActionsType.EDIT_AS_DRAFT}`);
		}
	};
}

export function sendDraft({
	id,
	message,
	dispatch
}: {
	id: string;
	message: MailMessage;
	dispatch: Dispatch;
}): MessageActionReturnType {
	return {
		id: 'message-send',
		icon: 'PaperPlaneOutline',
		label: getBridgedFunctions()?.t('label.send', 'Send'),
		click: (ev): void => {
			if (ev) ev.preventDefault();
			dispatch(
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				sendMsg({
					editorId: id,
					message
				})
			);
		}
	};
}

export function redirectMsg({ id }: { id: string }): MessageActionReturnType {
	return {
		id: 'message-redirect',
		icon: 'CornerUpRight',
		label: getBridgedFunctions()?.t('action.redirect', 'Redirect'),
		click: (ev): void => {
			if (ev) ev.preventDefault();
			const closeModal = getBridgedFunctions()?.createModal(
				{
					maxHeight: '90vh',
					children: (
						<>
							<RedirectAction
								// TODO: Fix it in DS
								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-ignore
								onClose={(): void => closeModal()}
								id={id}
							/>
						</>
					)
				},
				true
			);
		}
	};
}

export function moveMessageToFolder({
	id,
	dispatch,
	isRestore,
	deselectAll
}: Pick<
	MessageActionPropType,
	'id' | 'dispatch' | 'isRestore' | 'deselectAll'
>): MessageActionReturnType {
	return {
		id: 'message-restore',
		icon: isRestore ? 'RestoreOutline' : 'MoveOutline',
		label: isRestore
			? getBridgedFunctions()?.t('label.restore', 'Restore')
			: getBridgedFunctions()?.t('label.move', 'Move'),
		click: (): void => {
			const closeModal = getBridgedFunctions()?.createModal(
				{
					maxHeight: '90vh',
					children: (
						<>
							<MoveConvMessage
								selectedIDs={id}
								// TODO: Fix it in DS
								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-ignore
								onClose={(): void => closeModal()}
								isMessageView
								isRestore={isRestore ?? false}
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

export function deleteMessagePermanently({
	ids,
	dispatch,
	deselectAll
}: MessageActionPropType): MessageActionReturnType {
	return {
		id: 'message-delete-permanently',
		icon: 'DeletePermanentlyOutline',
		label: getBridgedFunctions()?.t('label.delete_permanently', 'Delete Permanently'),
		click: (): void => {
			const closeModal = getBridgedFunctions()?.createModal(
				{
					children: (
						<>
							<DeleteConvConfirm
								selectedIDs={ids}
								isMessageView
								// TODO: Fix it in DS
								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-ignore
								onClose={(): void => closeModal()}
								deselectAll={deselectAll || ((): null => null)}
							/>
						</>
					)
				},
				true
			);
		}
	};
}

type GetMessageActionsType = {
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
}: GetMessageActionsType): any => {
	switch (folderId) {
		case FOLDERS.TRASH:
			return (message: MailMessage): any => [
				[
					setMsgRead({
						ids: [message.id],
						value: message.read,
						dispatch,
						folderId,
						shouldReplaceHistory: true,
						deselectAll
					}),
					setMsgFlag({ ids: [message.id], value: message.flagged, dispatch }),
					replyMsg({ id: message.id, folderId }),
					forwardMsg({ id: message.id, folderId }),
					deleteMessagePermanently({ ids: [message.id], dispatch, deselectAll }),
					moveMessageToFolder({
						id: [message.id],
						dispatch,
						isRestore: true,
						deselectAll
					})
				],
				[
					setMsgRead({
						ids: [message.id],
						value: message.read,
						dispatch,
						folderId,
						shouldReplaceHistory: true,
						deselectAll
					}),
					setMsgFlag({ ids: [message.id], value: message.flagged, dispatch }),
					applyTag({ tags, conversation: message, isMessage: true }),
					setMsgAsSpam({ ids: [message.id], value: false, dispatch, folderId }),
					printMsg({ message, account }),
					deleteMessagePermanently({ ids: [message.id], dispatch, deselectAll }),
					moveMessageToFolder({
						id: [message.id],
						dispatch,
						isRestore: true,
						deselectAll
					}),
					replyMsg({ id: message.id, folderId }),
					replyAllMsg({ id: message.id, folderId }),
					forwardMsg({ id: message.id, folderId }),
					editAsNewMsg({ id: message.id, folderId }),
					sendDraft({ id: message.id, message, dispatch }),
					redirectMsg({ id: message.id })
				]
			];
		case FOLDERS.SPAM:
			return (message: MailMessage, closeEditor: () => void): any => [
				[
					setMsgRead({
						ids: [message.id],
						value: message.read,
						dispatch,
						folderId,
						shouldReplaceHistory: true,
						deselectAll
					}),
					setMsgFlag({ ids: [message.id], value: message.flagged, dispatch }),
					setMsgAsSpam({
						ids: [message.id],
						value: true,
						dispatch,
						folderId,
						shouldReplaceHistory: true
					}),
					deleteMsg({ ids: [message.id], dispatch })
				],
				[
					setMsgRead({
						ids: [message.id],
						value: message.read,
						dispatch,
						folderId,
						shouldReplaceHistory: true,
						deselectAll
					}),
					setMsgFlag({ ids: [message.id], value: message.flagged, dispatch }),
					applyTag({ tags, conversation: message, isMessage: true }),
					setMsgAsSpam({
						ids: [message.id],
						value: true,
						dispatch,
						folderId,
						shouldReplaceHistory: true
					}),
					printMsg({ message, account }),
					showOriginalMsg({ id: message.id }),
					moveMsgToTrash({
						ids: [message.id],
						dispatch,
						deselectAll,
						folderId,
						conversationId: message.conversation,
						closeEditor
					}),
					replyMsg({ id: message.id, folderId }),
					replyAllMsg({ id: message.id, folderId }),
					forwardMsg({ id: message.id, folderId }),
					editAsNewMsg({ id: message.id, folderId }),
					sendDraft({ id: message.id, message, dispatch }),
					redirectMsg({ id: message.id })
				]
			];
		case FOLDERS.DRAFTS:
			return (message: MailMessage, closeEditor: CloseEditorType) => [
				[
					editDraft({ id: message.id, folderId }),
					sendDraft({ id: message.id, message, dispatch }),
					moveMsgToTrash({
						ids: [message.id],
						dispatch,
						deselectAll,
						folderId,
						conversationId: message.conversation,
						closeEditor
					}),
					setMsgFlag({ ids: [message.id], value: message.flagged, dispatch })
				],
				[
					setMsgFlag({ ids: [message.id], value: message.flagged, dispatch }),
					applyTag({ tags, conversation: message, isMessage: true }),
					moveMsgToTrash({
						ids: [message.id],

						dispatch,

						deselectAll,
						folderId,
						conversationId: message.conversation,
						closeEditor
					}),
					editDraft({ id: message.id, folderId }),
					sendDraft({ id: message.id, message, dispatch }),
					printMsg({ message, account })
				]
			];
		case FOLDERS.SENT:
		case FOLDERS.INBOX:
		default:
			return (message: MailMessage, closeEditor: CloseEditorType) => [
				[
					replyMsg({ id: message.id, folderId }),
					replyAllMsg({ id: message.id, folderId }),
					forwardMsg({ id: message.id, folderId }),
					moveMsgToTrash({
						ids: [message.id],

						dispatch,

						deselectAll,
						folderId,
						conversationId: message.conversation,
						closeEditor
					}),
					setMsgRead({
						ids: [message.id],
						value: message.read,

						dispatch,
						folderId,
						shouldReplaceHistory: true,
						deselectAll
					}),
					setMsgFlag({ ids: [message.id], value: message.flagged, dispatch })
				],
				[
					setMsgRead({
						ids: [message.id],
						value: message.read,

						dispatch,
						folderId,
						shouldReplaceHistory: true,
						deselectAll
					}),
					setMsgFlag({ ids: [message.id], value: message.flagged, dispatch }),

					applyTag({ tags, conversation: message, isMessage: true }),
					setMsgAsSpam({
						ids: [message.id],
						value: false,
						dispatch,
						folderId,
						shouldReplaceHistory: true
					}),
					printMsg({ message, account }),
					showOriginalMsg({ id: message.id }),
					moveMsgToTrash({
						ids: [message.id],
						dispatch,
						deselectAll,
						folderId,
						conversationId: message.conversation,
						closeEditor
					}),
					replyMsg({ id: message.id, folderId }),
					replyAllMsg({ id: message.id, folderId }),
					forwardMsg({ id: message.id, folderId }),
					editAsNewMsg({ id: message.id, folderId }),
					sendDraft({ id: message.id, message, dispatch }),
					redirectMsg({ id: message.id })
				]
			];
	}
};
