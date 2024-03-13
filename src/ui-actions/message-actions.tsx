/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { AsyncThunkAction, Dispatch } from '@reduxjs/toolkit';
import { Text } from '@zextras/carbonio-design-system';
import {
	addBoard,
	FOLDERS,
	getBridgedFunctions,
	replaceHistory,
	t
} from '@zextras/carbonio-shell-ui';
import { isNull, map, noop } from 'lodash';

import DeleteConvConfirm from './delete-conv-modal';
import { errorPage } from './error-page';
import MoveConvMessage from './move-conv-msg';
import RedirectAction from './redirect-message-action';
import { getRoot } from '../carbonio-ui-commons/store/zustand/folder';
import { getContentForPrint } from '../commons/print-conversation/print-conversation';
import { EditViewActions, MAILS_ROUTE, MessageActionsDescriptors, TIMEOUTS } from '../constants';
import { getAttendees, getOptionalsAttendees, getSenderByOwner } from '../helpers/appointmemt';
import { getMsgCall, getMsgsForPrint, msgAction } from '../store/actions';
import { sendMsg } from '../store/actions/send-msg';
import { extractBody } from '../store/editor-slice-utils';
import { AppDispatch, StoreProvider } from '../store/redux';
import type {
	BoardContext,
	MailMessage,
	MessageAction,
	MessageActionReturnType,
	MsgActionParameters,
	MsgActionResult
} from '../types';
import { ConvActionReturnType, ExtraWindowCreationParams, ExtraWindowsContextType } from '../types';
import { CalendarType, SenderType } from '../types/calendar';
import { MessagePreviewPanel } from '../views/app/detail-panel/message-preview-panel';
import { getLocationOrigin } from '../views/app/detail-panel/preview/utils';

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
}: MessageActionPropType): MessageActionReturnType => {
	const actDescriptor = value
		? MessageActionsDescriptors.MARK_AS_UNREAD
		: MessageActionsDescriptors.MARK_AS_READ;

	return {
		id: actDescriptor.id,
		icon: value ? 'EmailOutline' : 'EmailReadOutline',
		label: value
			? t('action.mark_as_unread', 'Mark as unread')
			: t('action.mark_as_read', 'Mark as read'),
		onClick: (ev): void => {
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
};

export function setMsgFlag({
	ids,
	value,
	dispatch
}: Omit<
	MessageActionPropType,
	'folderId' | 'shouldReplaceHistory' | 'deselectAll'
>): MessageActionReturnType {
	const actDescriptor = value ? MessageActionsDescriptors.UNFLAG : MessageActionsDescriptors.FLAG;

	return {
		id: actDescriptor.id,
		icon: value ? 'Flag' : 'FlagOutline',
		label: value ? t('action.unflag', 'Remove flag') : t('action.flag', 'Add flag'),
		onClick: (ev): void => {
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

type SetAsSpamProps = {
	notCanceled: boolean;
	value: MessageActionValueType | undefined;
	dispatch: AppDispatch;
	ids: Array<string>;
	shouldReplaceHistory?: boolean;
	folderId?: string;
};
function setAsSpam({
	notCanceled,
	value,
	dispatch,
	ids,
	shouldReplaceHistory,
	folderId
}: SetAsSpamProps): void {
	if (!notCanceled) return;
	dispatch(
		msgAction({
			operation: `${value ? '!' : ''}spam`,
			ids
		})
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

export function setMsgAsSpam({
	ids,
	value,
	dispatch,
	shouldReplaceHistory = true,
	folderId
}: MessageActionPropType): MessageActionReturnType {
	const actDescriptor = value
		? MessageActionsDescriptors.MARK_AS_NOT_SPAM
		: MessageActionsDescriptors.MARK_AS_SPAM;

	return {
		id: actDescriptor.id,
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
					autoHideTimeout: TIMEOUTS.SET_AS_SPAM,
					hideButton,
					actionLabel: t('label.undo', 'Undo'),
					onActionClick: () => {
						notCanceled = false;
					}
				});
			};
			infoSnackbar();
			setTimeout(() => {
				/** If the user has not clicked on the undo button, we can proceed with the action */
				setAsSpam({ notCanceled, value, dispatch, ids, shouldReplaceHistory, folderId });
			}, TIMEOUTS.SET_AS_SPAM);
		}
	};
}

export const previewOnSeparatedWindow = (
	messageId: string,
	folderId: string,
	subject: string,
	createWindow: ExtraWindowsContextType['createWindow'],
	messageActions: Array<MessageAction>
): void => {
	if (!createWindow) {
		return;
	}

	const createWindowParams: ExtraWindowCreationParams = {
		name: `message-${messageId}`,
		returnComponent: false,
		children: (
			<MessagePreviewPanel
				messageId={messageId}
				folderId={folderId}
				messageActions={messageActions}
			/>
		),
		title: subject,
		closeOnUnmount: false
	};
	createWindow(createWindowParams);
};

export function previewMessageOnSeparatedWindow(
	messageId: string,
	folderId: string,
	subject: string,
	createWindow: ExtraWindowsContextType['createWindow'],
	messageActions: Array<MessageAction>
): ConvActionReturnType {
	const actDescriptor = MessageActionsDescriptors.PREVIEW_ON_SEPARATED_WINDOW;
	return {
		id: actDescriptor.id,
		icon: 'BrowserOutline',
		label: t('action.preview_on_separated_window', 'Open on a new window'),
		onClick: (): void => {
			previewOnSeparatedWindow(messageId, folderId, subject, createWindow, messageActions);
		}
	};
}

export function printMsg({ message }: { message: MailMessage }): MessageActionReturnType {
	const conversations = map([message], (msg) => ({
		conversation: msg.conversation,
		subject: msg.subject
	}));

	const actDescriptor = MessageActionsDescriptors.PRINT;

	return {
		id: actDescriptor.id,
		icon: 'PrinterOutline',
		label: t('action.print', 'Print'),
		onClick: (): void => {
			const printWindow = window.open('', '_blank');
			getMsgsForPrint({ ids: [message.id] })
				.then((res) => {
					const content = getContentForPrint({
						messages: res,
						conversations,
						isMsg: true
					});
					if (printWindow?.top) {
						printWindow.top.document.title = 'Carbonio';
						printWindow.document.write(content);
					}
				})
				.catch(() => {
					if (printWindow) printWindow.document.write(errorPage);
				});
		}
	};
}

export function showOriginalMsg({ id }: { id: string }): MessageActionReturnType {
	const actDescriptor = MessageActionsDescriptors.SHOW_SOURCE;

	return {
		id: actDescriptor.id,
		icon: 'CodeOutline',
		label: t('action.show_original', 'Show original'),
		onClick: (ev): void => {
			if (ev) ev.preventDefault();
			window.open(`/service/home/~/?auth=co&view=text&id=${id}`, '_blank');
		}
	};
}

const dispatchMsgMove = (
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
	dispatchMsgMove(dispatch, ids, folderId)
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		.then((res) => {
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
	const actDescriptor = MessageActionsDescriptors.MOVE_TO_TRASH;

	return {
		id: actDescriptor.id,
		icon: 'Trash2Outline',
		label: t('label.delete', 'Delete'),
		onClick: (ev): void => {
			if (ev) ev.preventDefault();

			dispatch(
				msgAction({
					operation: 'trash',
					ids
				})
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
						onActionClick: () =>
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
	const actDescriptor = MessageActionsDescriptors.DELETE;

	return {
		id: actDescriptor.id,
		icon: 'Trash2Outline',
		label: t('label.delete', 'Delete'),
		onClick: (ev): void => {
			if (ev) ev.preventDefault();
			const closeModal = getBridgedFunctions()?.createModal({
				title: t('header.delete_email', 'Delete e-mail'),
				confirmLabel: t('action.ok', 'Ok'),
				onConfirm: () => {
					dispatch(
						msgAction({
							operation: 'delete',
							ids
						})
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
	const actDescriptor = MessageActionsDescriptors.REPLY;
	return {
		id: actDescriptor.id,
		icon: 'UndoOutline',
		label: t('action.reply', 'Reply'),
		onClick: (ev): void => {
			if (ev) ev.preventDefault();
			addBoard<BoardContext>({
				url: `${MAILS_ROUTE}/edit?action=${EditViewActions.REPLY}&id=${id}`,
				// context: { mailId: id, folderId },
				title: ''
			});
		}
	};
}

export function replyAllMsg({
	id,
	folderId
}: Pick<MessageActionPropType, 'id' | 'folderId'>): MessageActionReturnType {
	const actDescriptor = MessageActionsDescriptors.REPLY_ALL;
	return {
		id: actDescriptor.id,
		icon: 'ReplyAll',
		label: t('action.reply_all', 'Reply all'),
		onClick: (ev): void => {
			if (ev) ev.preventDefault();
			addBoard<BoardContext>({
				url: `${MAILS_ROUTE}/edit?action=${EditViewActions.REPLY_ALL}&id=${id}`,
				// context: { mailId: id, folderId },
				title: ''
			});
		}
	};
}

export function forwardMsg({
	id,
	folderId
}: Pick<MessageActionPropType, 'id' | 'folderId'>): MessageActionReturnType {
	const actDescriptor = MessageActionsDescriptors.FORWARD;
	return {
		id: actDescriptor.id,
		icon: 'Forward',
		label: t('action.forward', 'Forward'),
		onClick: (ev): void => {
			if (ev) ev.preventDefault();
			addBoard<BoardContext>({
				url: `${MAILS_ROUTE}/edit?action=${EditViewActions.FORWARD}&id=${id}`,
				// context: { mailId: id, folderId },
				title: ''
			});
		}
	};
}

export function editAsNewMsg({
	id,
	folderId
}: Pick<MessageActionPropType, 'id' | 'folderId'>): MessageActionReturnType {
	const actDescriptor = MessageActionsDescriptors.EDIT_AS_NEW;
	return {
		id: actDescriptor.id,
		icon: 'Edit2Outline',
		label: t('action.edit_as_new', 'Edit as new'),
		onClick: (ev): void => {
			if (ev) ev.preventDefault();
			addBoard<BoardContext>({
				url: `${MAILS_ROUTE}/edit?action=${EditViewActions.EDIT_AS_NEW}&id=${id}`,
				// context: { mailId: id, folderId },
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
	const actDescriptor = MessageActionsDescriptors.EDIT_DRAFT;
	return {
		id: actDescriptor.id,
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
							url: `${MAILS_ROUTE}/edit?action=${EditViewActions.EDIT_AS_DRAFT}&id=${id}`,
							// context: { mailId: id, folderId },
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
					url: `${MAILS_ROUTE}/edit?action=${EditViewActions.EDIT_AS_DRAFT}&id=${id}`,
					// context: { mailId: id, folderId },
					title: ''
				});
			}
		}
	};
}

export function sendDraft({
	message,
	dispatch
}: {
	message: MailMessage;
	dispatch: AppDispatch;
}): MessageActionReturnType {
	const actDescriptor = MessageActionsDescriptors.SEND;
	return {
		id: actDescriptor.id,
		icon: 'PaperPlaneOutline',
		label: t('label.send', 'Send'),
		onClick: (ev): void => {
			if (ev) ev.preventDefault();
			dispatch(
				sendMsg({
					msg: message
				})
			)
				.then() // TODO IRIS-4400
				.catch(); // TODO IRIS-4400
		}
	};
}

export function redirectMsg({ id }: { id: string }): MessageActionReturnType {
	const actDescriptor = MessageActionsDescriptors.REDIRECT;
	return {
		id: actDescriptor.id,
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
	const actDescriptor = isRestore
		? MessageActionsDescriptors.RESTORE
		: MessageActionsDescriptors.MOVE;
	return {
		id: actDescriptor.id,
		icon: isRestore ? 'RestoreOutline' : 'MoveOutline',
		label: isRestore ? t('label.restore', 'Restore') : t('label.move', 'Move'),
		onClick: (): void => {
			const closeModal = getBridgedFunctions()?.createModal(
				{
					maxHeight: '90vh',
					size: 'medium',
					children: (
						<StoreProvider>
							<MoveConvMessage
								folderId={folderId ?? ''}
								selectedIDs={[id as string]}
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
	const actDescriptor = MessageActionsDescriptors.DELETE_PERMANENTLY;
	return {
		id: actDescriptor.id,
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

export function downloadEml({ id }: { id: string }): MessageActionReturnType {
	const actDescriptor = MessageActionsDescriptors.DOWNLOAD_EML;

	return {
		id: actDescriptor.id,
		icon: 'DownloadOutline',
		label: t('action.download_eml', 'Download EML'),
		onClick: (ev): void => {
			ev?.preventDefault();
			const link = document.createElement('a');
			link.download = `${id}.eml`;
			link.href = `${getLocationOrigin()}/service/home/~/?auth=co&id=${id}`;
			link.click();
			link.remove();
		}
	};
}

export function createAppointment({
	item,
	openAppointmentComposer
}: {
	item: MailMessage;
	// eslint-disable-next-line @typescript-eslint/ban-types
	openAppointmentComposer: Function;
}): MessageActionReturnType {
	const actDescriptor = MessageActionsDescriptors.CREATE_APPOINTMENT;
	return {
		id: actDescriptor.id,
		icon: 'CalendarModOutline',
		label: t('action.create_appointment', 'Create Appointment'),
		onClick: (ev): void => {
			ev?.preventDefault();
			const attendees = getAttendees(item);
			const optionalAttendees = getOptionalsAttendees(item);
			const rooFolder = getRoot(item.parent);
			let calendar: CalendarType | null = null;
			let sender: SenderType | null = null;
			const htmlBody = extractBody(item)[1];
			if (rooFolder && rooFolder?.isLink) {
				const calendarId = `${rooFolder.id.split(':')[0]}:${FOLDERS.CALENDAR}`;
				calendar = {
					id: calendarId,
					owner: rooFolder?.isLink && rooFolder.owner
				};
				sender = getSenderByOwner(rooFolder?.owner);
			}
			if (!item?.isComplete) {
				getMsgCall({ msgId: item.id })
					.then((message: MailMessage) => {
						const mailHtmlBody = extractBody(message)[1];
						openAppointmentComposer({
							title: message.subject,
							isRichText: true,
							richText: mailHtmlBody,
							...(!isNull(calendar) ? { calendar } : {}),
							...(!isNull(sender) ? { sender } : {}),
							attendees,
							optionalAttendees
						});
					})
					.catch(() => {
						getBridgedFunctions()?.createSnackbar({
							key: `get-msg-on-new-appointment`,
							replace: true,
							type: 'warning',
							hideButton: true,
							label: t(
								'message.snackbar.att_err',
								'There seems to be a problem when saving, please try again'
							),
							autoHideTimeout: 3000
						});
					});
			} else {
				openAppointmentComposer({
					title: item.subject,
					isRichText: true,
					richText: htmlBody,
					...(!isNull(calendar) ? { calendar } : {}),
					...(!isNull(sender) ? { sender } : {}),
					attendees,
					optionalAttendees
				});
			}
		}
	};
}
