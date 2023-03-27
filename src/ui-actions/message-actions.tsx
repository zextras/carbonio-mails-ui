/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { AsyncThunkAction, Dispatch } from '@reduxjs/toolkit';
import { Text } from '@zextras/carbonio-design-system';
import {
	Account,
	FOLDERS,
	Tags,
	addBoard,
	getBridgedFunctions,
	replaceHistory,
	t
} from '@zextras/carbonio-shell-ui';
import { map, noop } from 'lodash';
import React from 'react';
import { errorPage } from '../commons/preview-eml/error-page';
import { getContentForPrint } from '../commons/print-conversation';
import { ActionsType } from '../commons/utils';
import { MAILS_ROUTE } from '../constants';
import { getMsgsForPrint, msgAction } from '../store/actions';
import { sendMsg } from '../store/actions/send-msg';
import { AppDispatch, StoreProvider } from '../store/redux';
import {
	BoardContext,
	MailMessage,
	MessageActionReturnType,
	MsgActionParameters,
	MsgActionResult
} from '../types';
import DeleteConvConfirm from './delete-conv-modal';
import MoveConvMessage from './move-conv-msg';
import RedirectAction from './redirect-message-action';

type MessageActionIdsType = Array<string>;
type MessageActionValueType = string | boolean;
type DeselectAllType = () => void;

type MessageActionPropType = {
	ids: MessageActionIdsType;
	id?: string | MessageActionIdsType;
	value?: MessageActionValueType;
	dispatch: AppDispatch;
	folderId?: string;
	shouldReplaceHistory?: boolean;
	deselectAll?: DeselectAllType;
	conversationId?: string;
	closeEditor?: boolean;
	isRestore?: boolean;
	message?: MailMessage;
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
		? t('action.mark_as_unread', 'Mark as unread')
		: t('action.mark_as_read', 'Mark as read'),
	onClick: (ev): void => {
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
		icon: value ? 'Flag' : 'FlagOutline',
		label: value ? t('action.unflag', 'Remove flag') : t('action.flag', 'Add flag'),
		onClick: (ev): void => {
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
			? t('action.mark_as_non_spam', 'Not spam')
			: t('action.mark_as_spam', 'Mark as spam'),
		onClick: (ev): void => {
			if (ev) ev.preventDefault();
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
					onActiononClick: () => {
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
		label: t('action.print', 'Print'),
		onClick: (): void => {
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
					const errorContent = errorPage;
					if (printWindow) printWindow.document.write(errorContent);
				});
		}
	};
}

export function showOriginalMsg({ id }: { id: string }): MessageActionReturnType {
	return {
		id: 'message-show_original',
		icon: 'CodeOutline',
		label: t('action.show_original', 'Show original'),
		onClick: (ev): void => {
			if (ev) ev.preventDefault();
			window.open(`/service/home/~/?auth=co&view=text&id=${id}`, '_blank');
		}
	};
}

export const dispatchMsgMove = (
	dispatch: Dispatch<any>,
	ids: MessageActionIdsType,
	folderId: string
): AsyncThunkAction<MsgActionResult, MsgActionParameters, Record<string, unknown>> =>
	dispatch(
		msgAction({
			operation: 'move',
			ids,
			parent: folderId
		})
	);

const restoreMessage = (
	dispatch: AppDispatch,
	ids: MessageActionIdsType,
	folderId: string,
	closeEditor: boolean | undefined,
	conversationId: string | undefined
): void => {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	dispatchMsgMove(dispatch, ids, folderId).then((res) => {
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
				label: t('messages.snackbar.email_restored', 'E-mail restored in destination folder'),
				autoHideTimeout: 3000,
				hideButton: true
			});
		} else {
			getBridgedFunctions()?.createSnackbar({
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

export function moveMsgToTrash({
	ids,
	dispatch,
	deselectAll,
	folderId = FOLDERS.INBOX,
	conversationId,
	closeEditor
}: MessageActionPropType): MessageActionReturnType {
	return {
		id: 'message-trash',
		icon: 'Trash2Outline',
		label: t('label.delete', 'Delete'),
		onClick: (ev): void => {
			if (ev) ev.preventDefault();

			dispatch(
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				msgAction({
					operation: 'trash',
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
						label: t('messages.snackbar.email_moved_to_trash', 'E-mail moved to Trash'),
						autoHideTimeout: 5000,
						hideButton: false,
						actionLabel: t('label.undo', 'Undo'),
						onActiononClick: () =>
							restoreMessage(dispatch, ids, folderId, closeEditor, conversationId)
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

export function deleteMsg({
	ids,
	dispatch
}: Pick<MessageActionPropType, 'ids' | 'dispatch'>): MessageActionReturnType {
	return {
		id: 'message-delete',
		icon: 'Trash2Outline',
		label: t('label.delete', 'Delete'),
		onClick: (ev): void => {
			if (ev) ev.preventDefault();
			const closeModal = getBridgedFunctions()?.createModal({
				title: t('header.delete_email', 'Delete e-mail'),
				confirmLabel: t('action.ok', 'Ok'),
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
								label: t('messages.snackbar.message_deleted', 'Message deleted'),
								autoHideTimeout: 3000
							});
						} else {
							getBridgedFunctions()?.createSnackbar({
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
				dismissLabel: t('label.cancel', 'Cancel'),
				children: (
					<StoreProvider>
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
					</StoreProvider>
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
		label: t('action.reply', 'Reply'),
		onClick: (ev): void => {
			if (ev) ev.preventDefault();
			addBoard<BoardContext>({
				url: `${MAILS_ROUTE}/edit/${id}?action=${ActionsType.REPLY}`,
				context: { mailId: id, folderId },
				title: ''
			});
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
		label: t('action.reply_all', 'Reply all'),
		onClick: (ev): void => {
			if (ev) ev.preventDefault();
			addBoard<BoardContext>({
				url: `${MAILS_ROUTE}/edit/${id}?action=${ActionsType.REPLY_ALL}`,
				context: { mailId: id, folderId },
				title: ''
			});
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
		label: t('action.forward', 'Forward'),
		onClick: (ev): void => {
			if (ev) ev.preventDefault();
			addBoard<BoardContext>({
				url: `${MAILS_ROUTE}/edit/${id}?action=${ActionsType.FORWARD}`,
				context: { mailId: id, folderId },
				title: ''
			});
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
		label: t('action.edit_as_new', 'Edit as new'),
		onClick: (ev): void => {
			if (ev) ev.preventDefault();
			addBoard<BoardContext>({
				url: `${MAILS_ROUTE}/edit/${id}?action=${ActionsType.EDIT_AS_NEW}`,
				context: { mailId: id, folderId },
				title: ''
			});
		}
	};
}

export function editDraft({
	id,
	folderId,
	message
}: Pick<MessageActionPropType, 'id' | 'folderId' | 'message'>): MessageActionReturnType {
	return {
		id: 'message-edit_as_draft',
		icon: 'Edit2Outline',
		label: t('label.edit', 'Edit'),
		onClick: (ev): void => {
			if (ev) ev.preventDefault();
			if (message?.isScheduled) {
				const closeModal = getBridgedFunctions()?.createModal({
					title: t('label.warning', 'Warning'),
					confirmLabel: t('action.edit_anyway', 'Edit anyway'),
					onConfirm: () => {
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						closeModal();
						addBoard<BoardContext>({
							url: `${MAILS_ROUTE}/edit/${id}?action=${ActionsType.EDIT_AS_DRAFT}`,
							context: { mailId: id, folderId },
							title: ''
						});
					},
					onClose: () => {
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						closeModal();
					},
					showCloseIcon: true,
					children: (
						<StoreProvider>
							<Text overflow="break-word">
								{t(
									'messages.edit_schedule_warning',
									'By editing this e-mail, the time and date previously set for delayed sending will be reset.'
								)}
							</Text>
						</StoreProvider>
					)
				});
			} else {
				addBoard<BoardContext>({
					url: `${MAILS_ROUTE}/edit/${id}?action=${ActionsType.EDIT_AS_DRAFT}`,
					context: { mailId: id, folderId },
					title: ''
				});
			}
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
	dispatch: AppDispatch;
}): MessageActionReturnType {
	return {
		id: 'message-send',
		icon: 'PaperPlaneOutline',
		label: t('label.send', 'Send'),
		onClick: (ev): void => {
			if (ev) ev.preventDefault();
			dispatch(
				sendMsg({
					editorId: id,
					msg: message
				})
			);
		}
	};
}

export function redirectMsg({ id }: { id: string }): MessageActionReturnType {
	return {
		id: 'message-redirect',
		icon: 'CornerUpRight',
		label: t('action.redirect', 'Redirect'),
		onClick: (ev): void => {
			if (ev) ev.preventDefault();
			const closeModal = getBridgedFunctions()?.createModal(
				{
					maxHeight: '90vh',
					children: (
						<StoreProvider>
							{/* TODO: Fix it in DS */}
							{/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
							{/* @ts-ignore */}
							<RedirectAction onClose={(): void => closeModal()} id={id} />
						</StoreProvider>
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
	deselectAll,
	folderId
}: Pick<
	MessageActionPropType,
	'id' | 'dispatch' | 'isRestore' | 'deselectAll' | 'folderId'
>): MessageActionReturnType {
	return {
		id: 'message-restore',
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
								selectedIDs={id}
								// TODO: Fix it in DS
								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-ignore
								onClose={(): void => closeModal()}
								isMessageView
								isRestore={isRestore ?? false}
								deselectAll={deselectAll ?? noop}
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

export function deleteMessagePermanently({
	ids,
	deselectAll
}: MessageActionPropType): MessageActionReturnType {
	return {
		id: 'message-delete-permanently',
		icon: 'DeletePermanentlyOutline',
		label: t('label.delete_permanently', 'Delete Permanently'),
		onClick: (): void => {
			const closeModal = getBridgedFunctions()?.createModal(
				{
					children: (
						<StoreProvider>
							<DeleteConvConfirm
								selectedIDs={ids}
								isMessageView
								// TODO: Fix it in DS
								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-ignore
								onClose={(): void => closeModal()}
								deselectAll={deselectAll || ((): null => null)}
							/>
						</StoreProvider>
					)
				},
				true
			);
		}
	};
}

type GetMessageActionsType = {
	item: MailMessage;
	dispatch: Dispatch;
	deselectAll: () => void;
	account: Account;
	tags: Tags;
};
